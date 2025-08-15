# Tasks Checklist

Use this as a running list. Convert items into GitHub issues as you go.

## Repo & Ops
- [ ] Fill maintainer contact in `CODE_OF_CONDUCT.md`
- [ ] Add SECURITY.md with vulnerability reporting channel
- [ ] Enable PR and Issue templates in repository settings

## Processing Server
- [ ] Define `server.config.json` schema and validator
- [ ] Implement HTTP server (localhost default), auth, rate limiting
- [ ] Implement endpoint dispatch and script runtime with timeout
- [ ] Structured logs + artifact directories

## Core-Go
- [ ] Implement scrypt/AES-GCM with vectors
- [ ] SQLite storage, migrations, indices, media store
- [ ] API: Create/Get/Query/Export/Import
- [ ] gomobile AAR pipeline (later)

## Core-JS
- [ ] API parity with core-go (crypto, CRUD, query)
- [ ] Electron main-process module with secure IPC
- [ ] Export/Import

## Core-Py
- [ ] Crypto wrappers and validators
- [ ] Entry validation and import/export helpers
- [ ] Package as wheel

## Client-Android (MVP)
- [ ] Profile create/unlock with backoff
- [ ] Add entry + media
- [ ] Search & filter
- [ ] Export/Import
- [ ] Process With… (local server)

## Client-Desktop (MVP)
- [ ] Profile create/unlock
- [ ] Add entry + media
- [ ] Search & filter
- [ ] Export/Import
- [ ] Process With…

## Tests & Conformance
- [ ] Seed crypto vectors under `spec-and-tests/crypto-vectors/`
- [ ] Add conformance tests for cross-port parity

## Docs
- [ ] Expand per-project SPEC acceptance criteria with concrete thresholds
- [ ] Record default scrypt params per platform
