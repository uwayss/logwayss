# LogWayss Core (TypeScript/JS) — SPEC

## Scope & Responsibilities

The JavaScript core is a full implementation of the LogWayss core functionality for Electron desktop clients. It provides:

- Entry creation/update, retrieval, search, tagging with strict validation
- User profile lifecycle (create, lock/unlock, key derivation checks)
- Full crypto pipeline (encrypt/decrypt, key rotation utilities)
- Data import/export, schema validation, and migrations
- Cross-port test vectors and canonical formats

## API Parity with core-go

The JavaScript core maintains exact API parity with the Go core:

- Identical method signatures and return types
- Consistent error handling and validation
- Matching crypto implementations
- Equivalent storage access patterns

## Node/Electron Integration Notes

- Uses better-sqlite3 for database access
- Secure IPC channels for Electron integration
- No secrets exposed to renderer context
- Main-process module exposing all core APIs

## Storage & Performance Considerations

- SQLite database with WAL mode enabled
- FTS5 table for efficient tag searching
- Content-addressed media store under user data directory
- Schema versioning for migration support
- Optimized queries with proper indexing

## Packaging & Versioning

- Published as an npm package
- TypeScript definitions included
- SemVer versioning aligned with specification
- Reproducible builds

## Tests & Fixtures

- Reuse vectors from `spec-and-tests/crypto-vectors`
- Conformance parity with core-go
- Comprehensive smoke tests covering all functionality
- Validation tests for all entry types and constraints

## Open Questions & Risks

- Performance parity with Go core for large datasets
- Cross-platform consistency verification
- Migration path for future schema changes

---

## Implementation Checklist (Pseudocode)

- [x] API Parity
  - [x] Crypto wrappers mirror core-go signatures (aad, iv12, tag16)
  - [x] Entry CRUD and Query(filter{time,type,tags}, pagination) with validation
  - [x] Export/Import archive (streamed IO where possible)
- [x] Storage
  - [x] SQLite binding (e.g., better-sqlite3) with WAL ON
  - [x] FTS5 table for tags/text
  - [x] Media store under user data dir (hash-named)
- [x] Electron Integration
  - [x] Main-process module exposing IPC-safe APIs
  - [x] No secrets in renderer; use secure IPC channels
- [x] Tests
  - [x] Reuse vectors from `spec-and-tests/crypto-vectors`
  - [x] Conformance parity with core-go
  - [x] Comprehensive validation tests

## Acceptance Criteria

- [x] Parity tests with core-go pass for crypto and CRUD
- [x] Simple tag/time queries p95 < 150ms on desktop ref dataset
- [x] No secret material reachable from renderer context
- [x] Export/Import roundtrip matches logical dataset
- [x] Entry validation enforces all schema constraints
- [x] All entry types supported with appropriate payloads
