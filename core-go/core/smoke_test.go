package core

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"testing"

	ccrypto "logwayss/core-go/internal/crypto"
)

// This smoke test outlines the full client flow per spec.
func TestClientFlow_Smoke(t *testing.T) {
	ctx := context.Background()
	c := New()
	dir := t.TempDir()
	pass := []byte("password")

	// The Core instance is used across subtests to maintain state.
	t.Run("A_Profile_Create", func(t *testing.T) {
		if err := c.CreateProfile(ctx, dir, pass, ccrypto.DesktopScrypt); err != nil {
			t.Fatalf("CreateProfile failed: %v", err)
		}
	})

	t.Run("B_Profile_Unlock_And_Lock", func(t *testing.T) {
		if err := c.UnlockProfile(ctx, dir, pass); err != nil {
			t.Fatalf("UnlockProfile failed: %v", err)
		}
		if !c.IsUnlocked() {
			t.Fatal("IsUnlocked returned false after successful unlock")
		}
		c.Lock()
		if c.IsUnlocked() {
			t.Fatal("IsUnlocked returned true after lock")
		}
	})

	t.Run("C_Entry_CRUD_and_Query", func(t *testing.T) {
		if err := c.UnlockProfile(ctx, dir, pass); err != nil {
			t.Fatalf("UnlockProfile failed: %v", err)
		}
		defer c.Lock()

		payloadMap := map[string]interface{}{"message": "hello, logwayss"}
		payloadBytes, err := json.Marshal(payloadMap)
		if err != nil {
			t.Fatalf("failed to marshal payload map: %v", err)
		}

		newEntry := NewEntry{
			Type:    "text",
			Tags:    []string{"test", "go"},
			Payload: payloadBytes,
		}

		createdEntry, err := c.CreateEntry(ctx, newEntry)
		if err != nil {
			t.Fatalf("CreateEntry failed: %v", err)
		}
		if createdEntry.ID == "" {
			t.Fatal("CreateEntry returned an entry with no ID")
		}
		if createdEntry.CreatedAt.IsZero() {
			t.Fatal("CreateEntry returned an entry with no CreatedAt")
		}

		got, err := c.GetEntry(ctx, createdEntry.ID)
		if err != nil {
			t.Fatalf("GetEntry failed: %v", err)
		}

		var gotPayloadMap map[string]interface{}
		if err := json.Unmarshal(got.Payload, &gotPayloadMap); err != nil {
			t.Fatalf("failed to unmarshal retrieved payload: %v", err)
		}

		if !reflect.DeepEqual(gotPayloadMap, payloadMap) {
			t.Fatalf("GetEntry payload mismatch: got %v, want %v", gotPayloadMap, payloadMap)
		}
		if len(got.Tags) != 2 {
			t.Fatalf("GetEntry tags mismatch: got %d tags, want 2", len(got.Tags))
		}

		results, err := c.Query(ctx, QueryFilter{Type: "text"}, Pagination{Limit: 10})
		if err != nil {
			t.Fatalf("Query failed: %v", err)
		}
		if len(results) != 1 || results[0].ID != createdEntry.ID {
			t.Fatalf("Query result mismatch: got %d results", len(results))
		}

		var queryPayloadMap map[string]interface{}
		if err := json.Unmarshal(results[0].Payload, &queryPayloadMap); err != nil {
			t.Fatalf("failed to unmarshal query payload: %v", err)
		}

		if !reflect.DeepEqual(queryPayloadMap, payloadMap) {
			t.Fatalf("Query payload mismatch: got %v, want %v", queryPayloadMap, payloadMap)
		}
	})

	t.Run("D_Export_Import_Archive", func(t *testing.T) {
		if err := c.UnlockProfile(ctx, dir, pass); err != nil {
			t.Fatalf("UnlockProfile failed: %v", err)
		}
		defer c.Lock()

		dest := filepath.Join(t.TempDir(), "export.lwx")
		if err := c.ExportArchive(ctx, dest); err != nil {
			t.Fatalf("ExportArchive failed: %v", err)
		}

		fi, err := os.Stat(dest)
		if err != nil {
			t.Fatalf("Export file not found or stat failed: %v", err)
		}
		if fi.Size() == 0 {
			t.Fatal("Exported archive is an empty file")
		}

		// Get the ID of the original entry before creating a new one
		originalEntries, _ := c.Query(ctx, QueryFilter{}, Pagination{})
		originalID := originalEntries[0].ID

		_, err = c.CreateEntry(ctx, NewEntry{Type: "text", Payload: []byte(`{}`), DeviceID: "temp-device"})
		if err != nil {
			t.Fatalf("Failed to create second entry: %v", err)
		}

		if err := c.ImportArchive(ctx, dest); err != nil {
			t.Fatalf("ImportArchive failed: %v", err)
		}

		entries, err := c.Query(ctx, QueryFilter{}, Pagination{})
		if err != nil {
			t.Fatalf("Query after import failed: %v", err)
		}
		if len(entries) != 1 || entries[0].ID != originalID {
			t.Fatalf("DB state not restored after import: expected 1 entry with ID %s, got %d entries", originalID, len(entries))
		}
	})
}