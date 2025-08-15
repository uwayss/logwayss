package core

import (
	"context"
	"errors"
	"testing"
)

func TestCoreAPISurface_NotImplemented(t *testing.T) {
	c := New()
	ctx := context.Background()

	if _, err := c.CreateEntry(ctx, Entry{}); !errors.Is(err, ErrNotImplemented) {
		t.Fatalf("CreateEntry error = %v, want ErrNotImplemented", err)
	}
	if _, err := c.GetEntry(ctx, "id"); !errors.Is(err, ErrNotImplemented) {
		t.Fatalf("GetEntry error = %v, want ErrNotImplemented", err)
	}
	if _, err := c.Query(ctx, QueryFilter{}, Pagination{}); !errors.Is(err, ErrNotImplemented) {
		t.Fatalf("Query error = %v, want ErrNotImplemented", err)
	}
	if err := c.ExportArchive(ctx, "/tmp/out"); !errors.Is(err, ErrNotImplemented) {
		t.Fatalf("ExportArchive error = %v, want ErrNotImplemented", err)
	}
	if err := c.ImportArchive(ctx, "/tmp/in"); !errors.Is(err, ErrNotImplemented) {
		t.Fatalf("ImportArchive error = %v, want ErrNotImplemented", err)
	}
}
