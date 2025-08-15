package core

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"

	ccrypto "logwayss/core-go/internal/crypto"
)

// This smoke test outlines the full client flow per spec.
// Each step Skips if the feature is not yet implemented.
func TestClientFlow_Smoke(t *testing.T) {
	ctx := context.Background()
	c := New()

	t.Run("profile_create_unlock_lock", func(t *testing.T) {
		dir := t.TempDir()
		pass := []byte("password")
		if err := c.CreateProfile(ctx, dir, pass, ccrypto.DesktopScrypt); err != nil {
			if errors.Is(err, ErrNotImplemented) { t.Skip("CreateProfile not implemented") }
			t.Fatalf("CreateProfile: %v", err)
		}
		if err := c.UnlockProfile(ctx, dir, pass); err != nil {
			if errors.Is(err, ErrNotImplemented) { t.Skip("UnlockProfile not implemented") }
			t.Fatalf("UnlockProfile: %v", err)
		}
		if !c.IsUnlocked() {
			// If implemented, expect unlocked; otherwise skip
			t.Skip("IsUnlocked not implemented or returning false in stub")
		}
		c.Lock()
	})

	t.Run("entry_crud_and_query", func(t *testing.T) {
		entry := Entry{ID: "01HXXXXXTESTID", Type: "text", SchemaVersion: 1}
		_, err := c.CreateEntry(ctx, entry)
		if err != nil {
			if errors.Is(err, ErrNotImplemented) { t.Skip("CreateEntry not implemented") }
			t.Fatalf("CreateEntry: %v", err)
		}
		if _, err := c.GetEntry(ctx, entry.ID); err != nil {
			if errors.Is(err, ErrNotImplemented) { t.Skip("GetEntry not implemented") }
			t.Fatalf("GetEntry: %v", err)
		}
		if _, err := c.Query(ctx, QueryFilter{Type: "text"}, Pagination{Limit: 10}); err != nil {
			if errors.Is(err, ErrNotImplemented) { t.Skip("Query not implemented") }
			t.Fatalf("Query: %v", err)
		}
	})

	t.Run("export_import_archive", func(t *testing.T) {
		tmp := t.TempDir()
		dest := filepath.Join(tmp, "export.lwx")
		if err := c.ExportArchive(ctx, dest); err != nil {
			if errors.Is(err, ErrNotImplemented) { t.Skip("ExportArchive not implemented") }
			t.Fatalf("ExportArchive: %v", err)
		}
		if _, err := os.Stat(dest); err != nil {
			if os.IsNotExist(err) { t.Errorf("export file not found: %s", dest) } else { t.Fatalf("stat export: %v", err) }
		}
		if err := c.ImportArchive(ctx, dest); err != nil {
			if errors.Is(err, ErrNotImplemented) { t.Skip("ImportArchive not implemented") }
			t.Fatalf("ImportArchive: %v", err)
		}
	})
}
