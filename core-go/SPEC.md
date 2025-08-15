# LogWayss Core (Go) — SPEC

## Scope & Responsibilities

## Public API Surface

## Storage Access Strategy

## Crypto Integration

## Migration & schema_version

## Conformance & Tests

## Performance Targets

## Build & Release (gomobile AAR)

## Open Questions & Risks

---

## Implementation Checklist (Pseudocode)

- [ ] Crypto
  - [ ] DeriveKey(password, salt, params{scrypt N,r,p}) → key
  - [ ] Encrypt(aad, plaintext) → {iv12, tag16, ciphertext}
  - [ ] Decrypt(aad, iv, tag, ciphertext) → plaintext
  - [ ] KeyRotation(old→new): resumable batches, integrity verify
- [ ] Storage (SQLite + FS)
  - [ ] OpenDB(path): set WAL ON; sync NORMAL desktop / FULL mobile
  - [ ] Migrate(schema_version): apply idempotent steps
  - [ ] Entries: Create/Read/Update/Delete with schema validation
  - [ ] Indices: created_at DESC, type, device_id, tags (FTS5 table)
  - [ ] Media store: content-addressed (sha256) under app data dir
- [ ] API Surface
  - [ ] CreateEntry(entry)
  - [ ] GetEntry(id)
  - [ ] Query(filter{time, type, tags}, pagination)
  - [ ] ExportArchive(dest)
  - [ ] ImportArchive(src)
- [ ] Test Vectors & Conformance
  - [ ] AES-GCM bundle layout matches vectors
  - [ ] Cross-port parity tests pass
- [ ] Tooling
  - [ ] gomobile bind → AAR; thin Kotlin layer sample

## Acceptance Criteria

- [ ] KATs: crypto vectors pass byte-for-byte
- [ ] 50k text entries: simple tag/time query p95 < 150ms on desktop ref
- [ ] Export/Import roundtrip yields identical logical dataset
- [ ] Migrations are idempotent; interrupted migration resumes safely
- [ ] AAR builds reproducibly on CI (cacheable artifacts)
