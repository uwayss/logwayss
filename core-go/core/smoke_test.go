package core

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strings"
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
			Type:    EntryTypeText,
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

		results, err := c.Query(ctx, QueryFilter{Type: EntryTypeText}, Pagination{Limit: 10})
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

	t.Run("D_Entry_Validation", func(t *testing.T) {
		if err := c.UnlockProfile(ctx, dir, pass); err != nil {
			t.Fatalf("UnlockProfile failed: %v", err)
		}
		defer c.Lock()

		// Test valid entry
		payloadBytes, _ := json.Marshal(map[string]interface{}{"text": "valid entry"})
		validEntry := NewEntry{
			Type:    EntryTypeText,
			Payload: payloadBytes,
		}

		_, err := c.CreateEntry(ctx, validEntry)
		if err != nil {
			t.Fatalf("CreateEntry failed for valid entry: %v", err)
		}

		// Test invalid entry type
		invalidTypeEntry := NewEntry{
			Type:    "invalid_type",
			Payload: payloadBytes,
		}

		_, err = c.CreateEntry(ctx, invalidTypeEntry)
		if err == nil {
			t.Fatal("CreateEntry should have failed for invalid entry type")
		}

		// Test entry with too many tags
		tooManyTags := make([]string, 25)
		for i := range tooManyTags {
			tooManyTags[i] = fmt.Sprintf("tag%d", i)
		}

		tooManyTagsEntry := NewEntry{
			Type:    EntryTypeText,
			Tags:    tooManyTags,
			Payload: payloadBytes,
		}

		_, err = c.CreateEntry(ctx, tooManyTagsEntry)
		if err == nil {
			t.Fatal("CreateEntry should have failed for entry with too many tags")
		}

		// Test entry with tag too long
		longTagEntry := NewEntry{
			Type:    EntryTypeText,
			Tags:    []string{strings.Repeat("a", 55)},
			Payload: payloadBytes,
		}

		_, err = c.CreateEntry(ctx, longTagEntry)
		if err == nil {
			t.Fatal("CreateEntry should have failed for entry with tag too long")
		}

		// Test entry with source too long
		longSourceEntry := NewEntry{
			Type:    EntryTypeText,
			Source:  strings.Repeat("a", 55),
			Payload: payloadBytes,
		}

		_, err = c.CreateEntry(ctx, longSourceEntry)
		if err == nil {
			t.Fatal("CreateEntry should have failed for entry with source too long")
		}

		// Test entry with device_id too long
		longDeviceIDEntry := NewEntry{
			Type:     EntryTypeText,
			DeviceID: strings.Repeat("a", 105),
			Payload:  payloadBytes,
		}

		_, err = c.CreateEntry(ctx, longDeviceIDEntry)
		if err == nil {
			t.Fatal("CreateEntry should have failed for entry with device_id too long")
		}

		// Test entry with invalid meta confidence
		invalidMetaEntry := NewEntry{
			Type:    EntryTypeText,
			Meta:    map[string]any{"confidence": 1.5},
			Payload: payloadBytes,
		}

		_, err = c.CreateEntry(ctx, invalidMetaEntry)
		if err == nil {
			t.Fatal("CreateEntry should have failed for entry with invalid meta confidence")
		}

		// Test entry with invalid meta visibility
		invalidVisibilityEntry := NewEntry{
			Type:    EntryTypeText,
			Meta:    map[string]any{"visibility": "invalid"},
			Payload: payloadBytes,
		}

		_, err = c.CreateEntry(ctx, invalidVisibilityEntry)
		if err == nil {
			t.Fatal("CreateEntry should have failed for entry with invalid meta visibility")
		}

		// Test entry with invalid meta sensitivity
		invalidSensitivityEntry := NewEntry{
			Type:    EntryTypeText,
			Meta:    map[string]any{"sensitivity": "invalid"},
			Payload: payloadBytes,
		}

		_, err = c.CreateEntry(ctx, invalidSensitivityEntry)
		if err == nil {
			t.Fatal("CreateEntry should have failed for entry with invalid meta sensitivity")
		}

		// Test entry without payload
		noPayloadEntry := NewEntry{
			Type: EntryTypeText,
		}

		_, err = c.CreateEntry(ctx, noPayloadEntry)
		if err == nil {
			t.Fatal("CreateEntry should have failed for entry without payload")
		}
	})

	t.Run("E_Export_Import_Archive", func(t *testing.T) {
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

		// Get the IDs of the original entries before creating a new one
		originalEntries, _ := c.Query(ctx, QueryFilter{}, Pagination{})
		originalIDs := make(map[string]bool)
		for _, entry := range originalEntries {
			originalIDs[entry.ID] = true
		}

		_, err = c.CreateEntry(ctx, NewEntry{Type: EntryTypeText, Payload: []byte(`{}`), DeviceID: "temp-device"})
		if err != nil {
			t.Fatalf("Failed to create temporary entry: %v", err)
		}

		if err := c.ImportArchive(ctx, dest); err != nil {
			t.Fatalf("ImportArchive failed: %v", err)
		}

		entries, err := c.Query(ctx, QueryFilter{}, Pagination{})
		if err != nil {
			t.Fatalf("Query after import failed: %v", err)
		}

		// After import, we should have the same number of entries as before the temporary entry was added
		if len(entries) != len(originalIDs) {
			t.Fatalf("DB state not restored after import: expected %d entries, got %d entries", len(originalIDs), len(entries))
		}

		// All original entries should still be present
		for _, entry := range entries {
			if !originalIDs[entry.ID] {
				t.Fatalf("DB state not restored after import: unexpected entry ID %s", entry.ID)
			}
		}
	})

	t.Run("F_All_Entry_Types", func(t *testing.T) {
		if err := c.UnlockProfile(ctx, dir, pass); err != nil {
			t.Fatalf("UnlockProfile failed: %v", err)
		}
		defer c.Lock()

		// Test all entry types
		entryTypes := []EntryType{
			EntryTypeText,
			EntryTypeMarkdown,
			EntryTypeMetrics,
			EntryTypeMediaRef,
			EntryTypeEvent,
			EntryTypeLog,
		}

		for _, entryType := range entryTypes {
			var payload json.RawMessage
			switch entryType {
			case EntryTypeText:
				payload, _ = json.Marshal(map[string]interface{}{"text": "sample text"})
			case EntryTypeMarkdown:
				payload, _ = json.Marshal(map[string]interface{}{"markdown": "# Header\n\nContent"})
			case EntryTypeMetrics:
				payload, _ = json.Marshal(map[string]interface{}{"steps": 1000, "calories": 50})
			case EntryTypeMediaRef:
				payload, _ = json.Marshal(map[string]interface{}{"ref": "abc123", "type": "image"})
			case EntryTypeEvent:
				payload, _ = json.Marshal(map[string]interface{}{"title": "Meeting", "start": "2023-01-01T10:00:00Z"})
			case EntryTypeLog:
				payload, _ = json.Marshal(map[string]interface{}{"source": "app", "message": "App started", "level": "info"})
			}

			entry := NewEntry{
				Type:    entryType,
				Payload: payload,
			}

			createdEntry, err := c.CreateEntry(ctx, entry)
			if err != nil {
				t.Fatalf("CreateEntry failed for type %s: %v", entryType, err)
			}
			if createdEntry.Type != entryType {
				t.Fatalf("Created entry type mismatch: got %s, want %s", createdEntry.Type, entryType)
			}
		}
	})
}
