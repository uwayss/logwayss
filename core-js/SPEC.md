# LogWayss Core (TypeScript/JS) — SPEC

## Scope & Responsibilities

## API Parity with core-go

## Node/Electron Integration Notes

## Storage & Performance Considerations

## Packaging & Versioning

## Tests & Fixtures

## Open Questions & Risks

---

## Implementation Checklist (Pseudocode)

- [ ] API Parity
  - [ ] Crypto wrappers mirror core-go signatures (aad, iv12, tag16)
  - [ ] Entry CRUD and Query(filter{time,type,tags}, pagination)
  - [ ] Export/Import archive (streamed IO where possible)
- [ ] Storage
  - [ ] SQLite binding (e.g., better-sqlite3) with WAL ON
  - [ ] FTS5 table for tags/text
  - [ ] Media store under user data dir (hash-named)
- [ ] Electron Integration
  - [ ] Main-process module exposing IPC-safe APIs
  - [ ] No secrets in renderer; use secure IPC channels
- [ ] Tests
  - [ ] Reuse vectors from `spec-and-tests/crypto-vectors`
  - [ ] Conformance parity with core-go

## Acceptance Criteria

- [ ] Parity tests with core-go pass for crypto and CRUD
- [ ] Simple tag/time queries p95 < 150ms on desktop ref dataset
- [ ] No secret material reachable from renderer context
- [ ] Export/Import roundtrip matches logical dataset
