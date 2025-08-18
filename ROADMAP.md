# Roadmap

## Phase 1 — Planning & Architecture

- [ ] Finalize specification.md updates
- [ ] Seed SPEC.md skeletons per sub-project
- [ ] Decide scrypt params per platform and document vectors

## Phase 2 — Development (MVP)

- core-go
  - [ ] Crypto + storage + API
  - [ ] Conformance vectors
- client-android
  - [ ] MVP flows (no background collection)
  - [ ] Go AAR integration
- processing-server
  - [ ] Endpoints + MASTER_PASSWORD auth + local-only
- client-desktop
  - [ ] MVP flows; optional version checker
- core-js
  - [ ] API parity for desktop/server

## Phase 3 — Testing & Release

- [ ] Alpha: internal test across devices
- [ ] Beta: public OSS release, docs, contribution guides
- [ ] v1.0: stable APIs, migration story locked, dashboards shipped

## Post-MVP Security Track

- [ ] Out-of-band approval flow for server
- [ ] Optional script sandboxing
- [ ] Supply-chain hardening (SBOM, pinning)
