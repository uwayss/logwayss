package core

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	ccrypto "logwayss/core-go/internal/crypto"
	"logwayss/core-go/internal/storage"

	"github.com/oklog/ulid/v2"
)

var (
	ErrLocked         = errors.New("profile is locked")
	ErrProfileExists  = errors.New("profile already exists")
	ErrNotFound       = errors.New("not found")
	ErrInvalidProfile = errors.New("invalid profile or password")
	ErrInvalidEntry   = errors.New("entry is missing required fields (type)")
	schemaVersion     = 1
	profileMagic      = "LOGWAYSS_PROFILE"
	dbFileName        = "db.sqlite3"
	profileFileName   = "profile.json"
	schemaSQL         = `
		CREATE TABLE IF NOT EXISTS entries (
			id TEXT PRIMARY KEY,
			type TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			schema_version INTEGER NOT NULL,
			source TEXT,
			device_id TEXT,
			meta_json TEXT,
			payload BLOB NOT NULL,
			iv BLOB NOT NULL,
			tag BLOB NOT NULL
		);
		CREATE TABLE IF NOT EXISTS entry_tags (
			entry_id TEXT NOT NULL,
			tag TEXT NOT NULL,
			PRIMARY KEY (entry_id, tag),
			FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
		CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);
		CREATE INDEX IF NOT EXISTS idx_entry_tags_tag ON entry_tags(tag);
`
)

// For JSON marshaling, compatible with core-js
type profileFileJSON struct {
	SchemaVersion int                  `json:"schema_version"`
	Scrypt        ccrypto.ScryptParams `json:"scrypt"`
	Salt          string               `json:"salt"`
	IV            string               `json:"iv"`
	Tag           string               `json:"tag"`
	Ciphertext    string               `json:"ciphertext"`
}

type profilePayload struct {
	Magic         string `json:"magic"`
	SchemaVersion int    `json:"schema_version"`
	CreatedAt     string `json:"created_at"`
}

type Core struct {
	mu         sync.RWMutex
	sessionKey []byte
	dataDir    string
	db         *sql.DB
}

func New() *Core { return &Core{} }

func (c *Core) CreateEntry(ctx context.Context, ne NewEntry) (Entry, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if !c.isUnlocked() {
		return Entry{}, ErrLocked
	}
	if ne.Type == "" {
		return Entry{}, ErrInvalidEntry
	}

	now := time.Now().UTC()
	entropy := ulid.Monotonic(rand.Reader, 0)
	id, err := ulid.New(ulid.Timestamp(now), entropy)
	if err != nil {
		return Entry{}, fmt.Errorf("failed to generate entry ID: %w", err)
	}

	e := Entry{
		ID:            id.String(),
		Type:          ne.Type,
		CreatedAt:     now,
		UpdatedAt:     now,
		SchemaVersion: schemaVersion,
		Tags:          ne.Tags,
		Source:        ne.Source,
		DeviceID:      ne.DeviceID,
		Meta:          ne.Meta,
		Payload:       ne.Payload,
	}

	payloadBuf := e.Payload
	if payloadBuf == nil {
		payloadBuf = []byte("null")
	}

	aad := []byte(fmt.Sprintf("schema=%d|id=%s|type=%s", e.SchemaVersion, e.ID, e.Type))
	iv, tag, ciphertext, err := ccrypto.Encrypt(aad, c.sessionKey, payloadBuf)
	if err != nil {
		return Entry{}, fmt.Errorf("failed to encrypt payload: %w", err)
	}

	tx, err := c.db.BeginTx(ctx, nil)
	if err != nil {
		return Entry{}, err
	}
	defer tx.Rollback()

	metaJSON, err := json.Marshal(e.Meta)
	if err != nil {
		if e.Meta == nil {
			metaJSON = []byte("null")
		} else {
			return Entry{}, fmt.Errorf("failed to marshal meta: %w", err)
		}
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO entries (id, type, created_at, updated_at, schema_version, source, device_id, meta_json, payload, iv, tag)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		e.ID, e.Type, e.CreatedAt.Format(time.RFC3339Nano), e.UpdatedAt.Format(time.RFC3339Nano), e.SchemaVersion, e.Source, e.DeviceID, string(metaJSON), ciphertext, iv, tag,
	)
	if err != nil {
		return Entry{}, err
	}

	if len(e.Tags) > 0 {
		stmt, err := tx.PrepareContext(ctx, "INSERT OR IGNORE INTO entry_tags (entry_id, tag) VALUES (?, ?)")
		if err != nil {
			return Entry{}, err
		}
		defer stmt.Close()
		for _, t := range e.Tags {
			if _, err := stmt.ExecContext(ctx, e.ID, t); err != nil {
				return Entry{}, err
			}
		}
	}

	return e, tx.Commit()
}

func (c *Core) GetEntry(ctx context.Context, id string) (Entry, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if !c.isUnlocked() {
		return Entry{}, ErrLocked
	}

	query := `SELECT type, created_at, updated_at, schema_version, source, device_id, meta_json, payload, iv, tag FROM entries WHERE id = ?`
	row := c.db.QueryRowContext(ctx, query, id)

	var e Entry
	var createdAt, updatedAt, metaJSON sql.NullString
	var payload, iv, tag []byte
	e.ID = id

	if err := row.Scan(&e.Type, &createdAt, &updatedAt, &e.SchemaVersion, &e.Source, &e.DeviceID, &metaJSON, &payload, &iv, &tag); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Entry{}, ErrNotFound
		}
		return Entry{}, err
	}

	e.CreatedAt, _ = time.Parse(time.RFC3339Nano, createdAt.String)
	e.UpdatedAt, _ = time.Parse(time.RFC3339Nano, updatedAt.String)
	if metaJSON.Valid && metaJSON.String != "null" {
		_ = json.Unmarshal([]byte(metaJSON.String), &e.Meta)
	}

	aad := []byte(fmt.Sprintf("schema=%d|id=%s|type=%s", e.SchemaVersion, e.ID, e.Type))
	pt, err := ccrypto.Decrypt(aad, c.sessionKey, iv, tag, payload)
	if err != nil {
		return Entry{}, fmt.Errorf("failed to decrypt payload: %w", err)
	}
	e.Payload = pt

	tagRows, err := c.db.QueryContext(ctx, "SELECT tag FROM entry_tags WHERE entry_id = ?", id)
	if err != nil {
		return Entry{}, err
	}
	defer tagRows.Close()
	for tagRows.Next() {
		var t string
		if err := tagRows.Scan(&t); err != nil {
			return Entry{}, err
		}
		e.Tags = append(e.Tags, t)
	}

	return e, nil
}

func (c *Core) Query(ctx context.Context, filter QueryFilter, pagination Pagination) ([]Entry, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if !c.isUnlocked() {
		return nil, ErrLocked
	}

	var args []interface{}
	var where []string
	if filter.Type != "" {
		where = append(where, "type = ?")
		args = append(args, filter.Type)
	}

	query := "SELECT id FROM entries"
	if len(where) > 0 {
		query += " WHERE " + strings.Join(where, " AND ")
	}
	query += " ORDER BY created_at DESC"

	if pagination.Limit > 0 {
		query += " LIMIT ?"
		args = append(args, pagination.Limit)
		if pagination.Offset > 0 {
			query += " OFFSET ?"
			args = append(args, pagination.Offset)
		}
	}

	rows, err := c.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []Entry
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		e, err := c.GetEntry(ctx, id)
		if err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, nil
}

func (c *Core) ExportArchive(ctx context.Context, dest string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if !c.isUnlocked() {
		return ErrLocked
	}

	// This command safely creates a compacted, consistent backup of the database,
	// correctly handling the WAL file.
	_, err := c.db.ExecContext(ctx, "VACUUM INTO ?", dest)
	if err != nil {
		return fmt.Errorf("failed to vacuum database for export: %w", err)
	}

	return nil
}

func (c *Core) ImportArchive(ctx context.Context, src string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if !c.isUnlocked() {
		return ErrLocked
	}

	if err := c.db.Close(); err != nil {
		return fmt.Errorf("failed to close db for import: %w", err)
	}
	c.db = nil

	dbPath := filepath.Join(c.dataDir, dbFileName)
	// CRITICAL FIX: Remove WAL and SHM files to prevent state corruption.
	_ = os.Remove(dbPath)
	_ = os.Remove(dbPath + "-wal")
	_ = os.Remove(dbPath + "-shm")

	if err := copyFile(src, dbPath); err != nil {
		return err
	}

	db, err := storage.OpenDB(ctx, dbPath, false)
	if err != nil {
		c.sessionKey = nil
		return fmt.Errorf("failed to open imported database: %w", err)
	}
	c.db = db
	return nil
}

// Profile & Session lifecycle
func (c *Core) CreateProfile(ctx context.Context, dataDir string, password []byte, params ccrypto.ScryptParams) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	pPath := filepath.Join(dataDir, profileFileName)
	if _, err := os.Stat(pPath); !os.IsNotExist(err) {
		return ErrProfileExists
	}
	if err := os.MkdirAll(dataDir, 0700); err != nil {
		return err
	}

	salt, err := ccrypto.GenerateSalt(32)
	if err != nil {
		return err
	}
	key, err := ccrypto.DeriveKey(password, salt, params.N, params.R, params.P, 32)
	if err != nil {
		return err
	}

	payload, err := json.Marshal(profilePayload{
		Magic:         profileMagic,
		SchemaVersion: schemaVersion,
		CreatedAt:     time.Now().UTC().Format(time.RFC3339Nano),
	})
	if err != nil {
		return err
	}

	aad := []byte(fmt.Sprintf("schema=%d|type=profile", schemaVersion))
	iv, tag, ciphertext, err := ccrypto.Encrypt(aad, key, payload)
	if err != nil {
		return err
	}

	profile := profileFileJSON{
		SchemaVersion: schemaVersion,
		Scrypt:        params,
		Salt:          hex.EncodeToString(salt),
		IV:            hex.EncodeToString(iv),
		Tag:           hex.EncodeToString(tag),
		Ciphertext:    hex.EncodeToString(ciphertext),
	}

	fileBytes, err := json.MarshalIndent(profile, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(pPath, fileBytes, 0600)
}

func (c *Core) UnlockProfile(ctx context.Context, dataDir string, password []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	pPath := filepath.Join(dataDir, profileFileName)
	fileBytes, err := os.ReadFile(pPath)
	if err != nil {
		return err
	}

	var profile profileFileJSON
	if err := json.Unmarshal(fileBytes, &profile); err != nil {
		return ErrInvalidProfile
	}

	salt, _ := hex.DecodeString(profile.Salt)
	iv, _ := hex.DecodeString(profile.IV)
	tag, _ := hex.DecodeString(profile.Tag)
	ciphertext, _ := hex.DecodeString(profile.Ciphertext)

	key, err := ccrypto.DeriveKey(password, salt, profile.Scrypt.N, profile.Scrypt.R, profile.Scrypt.P, 32)
	if err != nil {
		return err
	}

	aad := []byte(fmt.Sprintf("schema=%d|type=profile", profile.SchemaVersion))
	plaintext, err := ccrypto.Decrypt(aad, key, iv, tag, ciphertext)
	if err != nil {
		return ErrInvalidProfile
	}

	var payload profilePayload
	if err := json.Unmarshal(plaintext, &payload); err != nil || payload.Magic != profileMagic {
		return ErrInvalidProfile
	}

	c.sessionKey = key
	c.dataDir = dataDir

	db, err := storage.OpenDB(ctx, filepath.Join(c.dataDir, dbFileName), false)
	if err != nil {
		return err
	}
	c.db = db

	_, err = c.db.ExecContext(ctx, schemaSQL)
	return err
}

func (c *Core) Lock() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.sessionKey != nil {
		for i := range c.sessionKey {
			c.sessionKey[i] = 0
		}
	}
	if c.db != nil {
		_ = c.db.Close()
	}
	c.sessionKey = nil
	c.dataDir = ""
	c.db = nil
}

func (c *Core) IsUnlocked() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.isUnlocked()
}

func (c *Core) isUnlocked() bool {
	return c.sessionKey != nil && c.dataDir != "" && c.db != nil
}

func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
}