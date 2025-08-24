package core

import (
	"encoding/json"
	"errors"
	"time"
)

var (
	ErrInvalidEntryType     = errors.New("invalid entry type")
	ErrInvalidEntryTags     = errors.New("invalid entry tags")
	ErrInvalidEntrySource   = errors.New("invalid entry source")
	ErrInvalidEntryDeviceID = errors.New("invalid entry device_id")
	ErrInvalidEntryMeta     = errors.New("invalid entry meta")
	ErrInvalidEntryPayload  = errors.New("invalid entry payload")
)

// EntryType represents the type of an entry
type EntryType string

const (
	EntryTypeText     EntryType = "text"
	EntryTypeMarkdown EntryType = "markdown"
	EntryTypeMetrics  EntryType = "metrics"
	EntryTypeMediaRef EntryType = "media_ref"
	EntryTypeEvent    EntryType = "event"
	EntryTypeLog      EntryType = "log"
)

// NewEntry is used to create a new entry. The core is responsible
// for generating the ID and timestamps.
type NewEntry struct {
	Type     EntryType       `json:"type"`
	Tags     []string        `json:"tags,omitempty"`
	Source   string          `json:"source,omitempty"`
	DeviceID string          `json:"device_id,omitempty"`
	Meta     map[string]any  `json:"meta,omitempty"`
	Payload  json.RawMessage `json:"payload"`
}

// Validate validates the NewEntry fields
func (ne *NewEntry) Validate() error {
	if ne.Type == "" {
		return ErrInvalidEntryType
	}

	// Validate entry type
	validTypes := map[EntryType]bool{
		EntryTypeText:     true,
		EntryTypeMarkdown: true,
		EntryTypeMetrics:  true,
		EntryTypeMediaRef: true,
		EntryTypeEvent:    true,
		EntryTypeLog:      true,
	}

	if !validTypes[ne.Type] {
		return ErrInvalidEntryType
	}

	// Validate tags
	if len(ne.Tags) > 20 {
		return ErrInvalidEntryTags
	}
	for _, tag := range ne.Tags {
		if len(tag) > 50 {
			return ErrInvalidEntryTags
		}
	}

	// Validate source
	if len(ne.Source) > 50 {
		return ErrInvalidEntrySource
	}

	// Validate device_id
	if len(ne.DeviceID) > 100 {
		return ErrInvalidEntryDeviceID
	}

	// Validate meta
	if ne.Meta != nil {
		if confidence, ok := ne.Meta["confidence"]; ok {
			if c, ok := confidence.(float64); !ok || c < 0 || c > 1 {
				return ErrInvalidEntryMeta
			}
		}
		
		if visibility, ok := ne.Meta["visibility"]; ok {
			if v, ok := visibility.(string); ok {
				valid := map[string]bool{
					"public":  true,
					"private": true,
					"friends": true,
				}
				if !valid[v] {
					return ErrInvalidEntryMeta
				}
			}
		}
		
		if sensitivity, ok := ne.Meta["sensitivity"]; ok {
			if s, ok := sensitivity.(string); ok {
				valid := map[string]bool{
					"low":    true,
					"medium": true,
					"high":   true,
				}
				if !valid[s] {
					return ErrInvalidEntryMeta
				}
			}
		}
	}

	// Validate payload is not empty
	if len(ne.Payload) == 0 {
		return ErrInvalidEntryPayload
	}

	return nil
}

type Entry struct {
	ID            string          `json:"id"`
	Type          EntryType       `json:"type"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
	SchemaVersion int             `json:"schema_version"`
	Tags          []string        `json:"tags,omitempty"`
	Source        string          `json:"source,omitempty"`
	DeviceID      string          `json:"device_id,omitempty"`
	Meta          map[string]any  `json:"meta,omitempty"`
	Payload       json.RawMessage `json:"payload"`
}

type QueryFilter struct {
	From *time.Time `json:"from,omitempty"`
	To   *time.Time `json:"to,omitempty"`
	Type EntryType  `json:"type,omitempty"`
	Tags []string   `json:"tags,omitempty"`
}

type Pagination struct {
	Limit  int `json:"limit,omitempty"`
	Offset int `json:"offset,omitempty"`
}