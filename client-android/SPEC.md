# LogWayss Android Client — SPEC

## MVP Scope (no background collection)

## Architecture & Core Boundary (Expo Modules vs native)

## Go AAR Integration & JNI Bridge

## UX Flows (create profile, unlock, add entry, export/import, process-with)

## Permissions & Policies

## Build Variants, ABI Splits, Signing

## Open Questions & Risks

---

## Implementation Checklist (Pseudocode)

- [ ] Project Setup
  - [ ] Expo Modules wrapper + native module scaffolding
  - [ ] Integrate core-go via AAR (gomobile bind) or stub API for MVP
- [ ] UX Flows (MVP)
  - [ ] Create Profile (set password → derive key → write profile file)
  - [ ] Unlock (password → scrypt → decrypt profile) with exponential backoff
  - [ ] Add Entry (text/markdown) with tags in single flow
  - [ ] Attach Media (image/video/audio) → store in content-addressed store
  - [ ] Search & Filter (type, tags, timeframe)
  - [ ] Export/Import archive
  - [ ] Process With… (send selected entries to local server endpoint)
- [ ] Storage
  - [ ] SQLite config: WAL ON, sync FULL
  - [ ] Media path under app data; filenames by SHA-256
- [ ] Version Checker (optional)
  - [ ] Fetch JSON manifest from GitHub; show non-blocking prompt; opt-out toggle
- [ ] Permissions
  - [ ] Request only media/storage as needed; no background data collection
- [ ] Telemetry
  - [ ] None

## Acceptance Criteria

- [ ] Cold unlock < 800ms on mid-tier device with default scrypt params
- [ ] Entry create p95 < 200ms without media
- [ ] Export/Import succeeds and preserves logical dataset
- [ ] No background data collection (verified by code paths and settings)
- [ ] “Process With…” reaches localhost server and handles error envelope
