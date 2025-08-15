package core

import (
	"context"
	"errors"
	
	ccrypto "logwayss/core-go/internal/crypto"
)

var ErrNotImplemented = errors.New("not implemented")

type Core struct{}

func New() *Core { return &Core{} }

func (c *Core) CreateEntry(ctx context.Context, e Entry) (Entry, error) {
	return Entry{}, ErrNotImplemented
}

func (c *Core) GetEntry(ctx context.Context, id string) (Entry, error) {
	return Entry{}, ErrNotImplemented
}

func (c *Core) Query(ctx context.Context, filter QueryFilter, pagination Pagination) ([]Entry, error) {
	return nil, ErrNotImplemented
}

func (c *Core) ExportArchive(ctx context.Context, dest string) error {
	return ErrNotImplemented
}

func (c *Core) ImportArchive(ctx context.Context, src string) error {
	return ErrNotImplemented
}

// Profile & Session lifecycle

// CreateProfile initializes a new encrypted profile file in the given data dir.
func (c *Core) CreateProfile(ctx context.Context, dataDir string, password []byte, params ccrypto.ScryptParams) error {
	return ErrNotImplemented
}

// UnlockProfile opens and verifies the encrypted profile with the provided password.
func (c *Core) UnlockProfile(ctx context.Context, dataDir string, password []byte) error {
	return ErrNotImplemented
}

// Lock clears any in-memory secret material and locks the profile.
func (c *Core) Lock() {}

// IsUnlocked reports whether the profile is currently unlocked in this Core instance.
func (c *Core) IsUnlocked() bool { return false }
