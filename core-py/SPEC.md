# LogWayss Core (Python) — SPEC

## Scope & Responsibilities

## Public API for Server

## Crypto & Schema Validation

## Packaging (wheel)

## Conformance Targets & Unit Tests

## Open Questions & Risks

---

## Implementation Checklist (Pseudocode)

- [ ] API
  - [ ] Crypto wrappers (scrypt, AES-GCM with iv12/tag16)
  - [ ] Entry CRUD and Query(filter{time,type,tags}) for server usage
  - [ ] Import/Export helpers for processing jobs
- [ ] Validation
  - [ ] JSON Schema validation for entries, export manifest
  - [ ] Schema_version checks and migration hooks
- [ ] Packaging
  - [ ] Setup as wheel; `pip install -e .` for dev
  - [ ] Minimal typed stubs (PEP 561) optional
- [ ] Tests
  - [ ] Reuse crypto vectors from `spec-and-tests/crypto-vectors`
  - [ ] Parity tests with core-go for canonical operations

## Acceptance Criteria

- [ ] Crypto vectors pass
- [ ] Entry validation rejects malformed payloads with precise path errors
- [ ] Import/Export roundtrip matches logical dataset
- [ ] Wheel builds and installs locally
