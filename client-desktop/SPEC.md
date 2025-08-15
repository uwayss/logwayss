# LogWayss Desktop Client (Electron) — SPEC

## MVP Scope

## Shell Architecture & Core Boundary

## Storage & Offline Behavior

## Updates Policy (no auto-update; optional checker)

## Packaging (electron-builder)

## UX Consistency with Android

## Open Questions & Risks

---

## Implementation Checklist (Pseudocode)

- [ ] Shell Architecture
  - [ ] Electron main process exposes IPC APIs backed by `core-js`
  - [ ] Preload scripts: whitelist channels; contextIsolation ON
  - [ ] Auto-launch prevention; single-instance lock
- [ ] UX Flows (MVP)
  - [ ] Create Profile / Unlock with backoff
  - [ ] Add Entry (text/markdown) with tags
  - [ ] Attach Media; store content-addressed
  - [ ] Search & Filter
  - [ ] Export/Import archive
  - [ ] Process With… (call local processing-server)
- [ ] Storage
  - [ ] SQLite with WAL; user data dir path
  - [ ] Media store under `media/sha256`
- [ ] Version Checker (optional)
  - [ ] Consume `docs/version-checker-manifest.example.json` shape
  - [ ] Non-blocking toast; manual updates only
- [ ] Packaging
  - [ ] `electron-builder` configs (later); dev-run via `electron .`

## Acceptance Criteria

- [ ] Renderer has no direct file or crypto key access; via IPC only
- [ ] Cold unlock < 600ms on reference desktop
- [ ] Entry create p95 < 100ms without media
- [ ] Export/Import preserves logical dataset
- [ ] Version checker can be disabled; never auto-updates
