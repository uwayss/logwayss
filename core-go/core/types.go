package core

import (
	"encoding/json"
	"time"
)

// NewEntry is used to create a new entry. The core is responsible
// for generating the ID and timestamps.
type NewEntry struct {
	Type     string          `json:"type"`
	Tags     []string        `json:"tags,omitempty"`
	Source   string          `json:"source,omitempty"`
	DeviceID string          `json:"device_id,omitempty"`
	Meta     map[string]any  `json:"meta,omitempty"`
	Payload  json.RawMessage `json:"payload,omitempty"`
}

type Entry struct {
	ID            string          `json:"id"`
	Type          string          `json:"type"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
	SchemaVersion int             `json:"schema_version"`
	Tags          []string        `json:"tags,omitempty"`
	Source        string          `json:"source,omitempty"`
	DeviceID      string          `json:"device_id,omitempty"`
	Meta          map[string]any  `json:"meta,omitempty"`
	Payload       json.RawMessage `json:"payload,omitempty"`
}

type QueryFilter struct {
	From *time.Time `json:"from,omitempty"`
	To   *time.Time `json:"to,omitempty"`
	Type string     `json:"type,omitempty"`
	Tags []string   `json:"tags,omitempty"`
}

type Pagination struct {
	Limit  int `json:"limit,omitempty"`
	Offset int `json:"offset,omitempty"`
}