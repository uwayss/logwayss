//go:build sqlite
// +build sqlite

package storage

import (
	"context"
	"database/sql"
	"fmt"
	"path/filepath"

	_ "modernc.org/sqlite"
)

// OpenDB opens a SQLite database at the given path and applies recommended pragmas.
func OpenDB(ctx context.Context, path string, mobile bool) (*sql.DB, error) {
	abs := path
	if !filepath.IsAbs(path) {
		var err error
		abs, err = filepath.Abs(path)
		if err != nil {
			return nil, fmt.Errorf("abs path: %w", err)
		}
	}
	dsn := fmt.Sprintf("file:%s?_pragma=journal_mode(WAL)", abs)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}
	// Synchronous level: NORMAL for desktop, FULL for mobile (safer on crash/power loss)
	syncLevel := "NORMAL"
	if mobile {
		syncLevel = "FULL"
	}
	if _, err := db.ExecContext(ctx, "PRAGMA synchronous = "+syncLevel); err != nil {
		_ = db.Close()
		return nil, err
	}
	return db, nil
}
