# LogWayss Core (Go) — SPEC

## Scope & Responsibilities

The Go core is the reference implementation of the LogWayss core functionality. It provides:

- Entry creation/update, retrieval, search, tagging with strict validation
- User profile lifecycle (create, lock/unlock, key derivation checks)
- Full crypto pipeline (encrypt/decrypt, key rotation utilities)
- Data import/export, schema validation, and migrations
- Cross-port test vectors and canonical formats

## Public API Surface

The public API provides methods for:

- Profile management (CreateProfile, UnlockProfile, Lock, IsUnlocked)
- Entry management (CreateEntry, GetEntry, Query)
- Archive management (ExportArchive, ImportArchive)

All methods are safe for concurrent use.

## Storage Access Strategy

- SQLite database with WAL mode enabled
- FTS5 table for efficient tag searching
- Content-addressed media store under app data directory
- Schema versioning for migration support

## Crypto Integration

- AES-256-GCM encryption with 12-byte IV and 16-byte tag
- Scrypt key derivation with configurable parameters
- Associated Data (AAD) includes schema_version, entry.id, and entry.type
- Zero-knowledge: no raw password stored; no plaintext leaves the device

## Migration & schema_version

- Schema versioning baked into all persisted data
- Migration helpers provided by core
- Idempotent and resumable migration operations

## Conformance & Tests

- Shared feature spec documents APIs, data types, error codes, and edge cases
- Conformance tests simulate client behavior ("client parity tests")
- Unit tests for port-specific functionality
- Test vectors ensure identical crypto results across ports

## Performance Targets

- 50k text entries: simple tag/time query p95 < 150ms on desktop reference
- Efficient memory usage with connection pooling
- Optimized database queries with proper indexing

## Build & Release (gomobile AAR)

- Built with gomobile bind to produce Android AAR
- Thin Kotlin layer sample provided
- Reproducible builds on CI with cacheable artifacts

## Open Questions & Risks

- Key rotation performance for large datasets
- Cross-platform consistency verification
- Migration path for future schema changes

---

## Implementation Checklist (Pseudocode)

- [x] Crypto
  - [x] DeriveKey(password, salt, params{scrypt N,r,p}) → key
  - [x] Encrypt(aad, plaintext) → {iv12, tag16, ciphertext}
  - [x] Decrypt(aad, iv, tag, ciphertext) → plaintext
  - [ ] KeyRotation(old→new): resumable batches, integrity verify
- [x] Storage (SQLite + FS)
  - [x] OpenDB(path): set WAL ON; sync NORMAL desktop / FULL mobile
  - [x] Migrate(schema_version): apply idempotent steps
  - [x] Entries: Create/Read/Update/Delete with schema validation
  - [x] Indices: created_at DESC, type, device_id, tags (FTS5 table)
  - [x] Media store: content-addressed (sha256) under app data dir
- [x] API Surface
  - [x] CreateEntry(entry) with validation
  - [x] GetEntry(id)
  - [x] Query(filter{time, type, tags}, pagination)
  - [x] ExportArchive(dest)
  - [x] ImportArchive(src)
- [x] Test Vectors & Conformance
  - [x] AES-GCM bundle layout matches vectors
  - [x] Cross-port parity tests pass
- [x] Tooling
  - [x] gomobile bind → AAR; thin Kotlin layer sample

## Acceptance Criteria

- [x] KATs: crypto vectors pass byte-for-byte
- [x] 50k text entries: simple tag/time query p95 < 150ms on desktop ref
- [x] Export/Import roundtrip yields identical logical dataset
- [x] Migrations are idempotent; interrupted migration resumes safely
- [x] AAR builds reproducibly on CI (cacheable artifacts)
- [x] Entry validation enforces all schema constraints
- [x] All entry types supported with appropriate payloads
