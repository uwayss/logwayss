//go:build !sqlite
// +build !sqlite

package storage

import (
	"context"
	"database/sql"
	"errors"
)

// OpenDB is a stub when the 'sqlite' build tag is not set.
// It returns an error to indicate SQLite support wasn't compiled in.
func OpenDB(_ context.Context, _ string, _ bool) (*sql.DB, error) {
	return nil, errors.New("sqlite support not enabled (build with -tags sqlite)")
}
