# Project Specification: **LogWayss**

## 1) Project Overview

**Title:** LogWayss
**Mission:** Build a fully open-source, end-to-end encrypted, self-hosted ecosystem for documenting, archiving, and analyzing personal life data — easy to set up, private by default, powerful for power users.

**Problem:** Existing lifelogging tools are usually closed-source, require payments, lack true E2EE, rely on third‑party clouds, and don’t offer deep/custom analysis.

**Solution:** LogWayss provides a cross‑platform, offline‑first stack with strong encryption and a modular architecture. Heavy analysis runs on a self‑hosted processing server. Everything remains under the user’s control. _(Note: No cloud or Telegram usage in v1; export/import is used for portability.)_

**Guiding Principles:**

- **Privacy first** (zero‑knowledge, E2EE everywhere).
- **Offline‑first**.
- **Open-source** and **extensible via local scripts**.
- **Simple setup**, sane defaults.
- **Composable core** shared across all clients.

---

## 2) Target Audience

- **Primary:** Individuals who want a secure, self‑hosted, customizable lifelog with strong privacy.
- **Secondary:** Developers/researchers interested in quantified‑self analytics, local processing, and privacy-preserving tooling.

---

## 3) Core Architecture

### 3.1 Core Ports

The Core is implemented as language‑specific ports that expose a **uniform API**:

- **core‑go (Go)** — high‑performance, primary reference implementation; targeted for Android native integration and server‑side use.
- **core‑js (TypeScript/JavaScript)** — for Electron desktop clients and JS environments.

### 3.2 Core Responsibilities

- Entry creation/update, retrieval, search, tagging.
- User profile lifecycle (create, lock/unlock, key derivation checks).
- Full crypto pipeline (encrypt/decrypt, key rotation utilities).
- Data import/export, schema validation, and migrations.
- Cross‑port test vectors and canonical formats.

### 3.3 Cross‑Core Consistency & Testing

- **Shared Feature Spec**: A single, versioned spec documents APIs, data types, error codes, and edge cases.
- **Conformance Tests**: A language‑agnostic end‑to‑end test suite simulates client behavior ("client parity tests"). All ports must pass.
- **Unit Tests**: Port‑specific unit tests.
- **Test Vectors**: Canonical crypto I/O fixtures ensure identical results across ports.
- **Schema Versioning**: `schema_version` field baked into all persisted data.

---

## 4) Clients & Platforms

### 4.1 Android Client

- The Android client will be developed using **Expo** and the **`core-js`** library. This approach prioritizes a faster development cycle and a consistent JavaScript-based stack across the mobile and desktop clients. Native integration with `core-go` via `gomobile` may be explored post-MVP if performance limitations are identified.

### 4.2 Desktop Clients (Windows, Linux/Ubuntu)

- **Electron** app using **core‑js**.
- If native feel/perf becomes an issue, consider a later migration to Flutter while keeping the Core boundary unchanged.

### 4.3 Self‑Hosted Processing Server

- Go service using **core‑go** for crypto and data access.
- **Lightweight HTTP server** with default endpoints defined via a JSON config.

  - Users/devs add new endpoints by specifying an `endpoint_name` and a `script_path`; when the endpoint is hit, the server executes the script and returns the result.
  - Scripts receive an input payload (e.g., selected entry IDs and parameters) and may emit new/updated entries or analysis artifacts.

- Initial client UX: select/long‑press entries → **“Process with…”** → choose a configured endpoint. (More thorough UX will be specified later.)
- Linux‑first design; portable to Windows.

### 4.4 Client–Core Relationship

- Each client talks to the **native‑language core** for logic and crypto.
- Avoid cross‑language overhead except at the UI edge.
- Ensures consistent behavior and identical crypto across platforms.

---

## 5) Features & Functionality

### 5.1 MVP

- **End‑to‑End Encryption**: AES‑256‑GCM; keys derived from a single master password via **scrypt**.
- **Encrypted User Profile File**: Stores profile metadata and acts as the password/key check.
- **Cross‑Platform Clients**: Android + Desktop (Win/Linux).
- **Client‑Side Data Collection (not telemetry):** opt‑in and granular. The **client collects data locally for its own on‑device processing/analysis**; nothing is transmitted externally unless the user explicitly exports it. Example data types: screen time, app usage, notifications, chat logs (where technically feasible and permitted).
- **Offline‑First**: All core functions work offline.
- **Portability (Export/Import)**: Encrypted archive export/import for moving data between devices until a formal sync design is introduced.
- **Media Entries**: Add media to entries or create media‑only entries (image, video, voice note).
- **Self‑Hosted Processing Server (scripts-based)**: Local heavy tasks (LLM optional, batch image ops, analysis) invoked via HTTP endpoints mapped to local scripts.
- **Analysis & Dashboard**: Basic charts, timelines, summaries generated locally.

- **Android client (MVP)**: No background data collection; manual journaling and media only.
- **Updates**: No automatic updates. Optional, opt‑out version checker that reads a small JSON release manifest from GitHub; no telemetry, clear network indicator, and local toggle.
- **Processing scripts (MVP)**: Local, user‑owned scripts with no sandboxing in v1 (documented risk for later hardening).

### 5.2 Future

- Additional data sources (e.g., location, calendar, wearables).
- Richer web-based dashboard.

### 5.3 Scope Exclusions

- **No costs**: free & open-source; no subscriptions.
- **No cloud storage** in v1.
- **No third‑party processing**: all processing is local/on self‑hosted server.
- **No plugin system in v1** (extend only via processing server scripts).

### 5.4 UX Philosophy & Principles

- **Premium feel**: Cohesive visual system, restrained palette, high legibility, and purposeful motion. Interactions feel tactile and responsive.
- **Proactive but sincere**: Surface meaningful reflections and gentle prompts without nagging. Tone is warm and honest, never corporate or gimmicky.
- **Habit‑forming, respectful**: Lightweight daily touchpoints and ambient summaries that invite return, not demand it. No dark patterns.
- **Consistency**: Predictable patterns across platforms; shared components and identical terminology create trust.
- **Offline‑first transparency**: Explicit indicators when performing local processing; no hidden network calls.
- **Accessibility & comfort**: Scalable typography, motion‑reduction modes, and contrast compliance targets.
- **Micro‑interactions**: Fast feedback and progressive disclosure for advanced capabilities.
- **Journal‑first ergonomics**: Frictionless entry creation, media attachment, and tagging in a single, fast flow.

---

## 6) Data & Storage

### 6.1 Data Model

- **Entry (Node)**: flexible envelope with typed payloads.

  - Common fields: `id` (ULID), `type`, `created_at`, `updated_at`, `schema_version`, `encryption_meta`, `tags`, `source`, `device_id`.
  - Payload variants: `text`, `markdown`, `metrics` (key→value), `media_ref` (images/videos/audio), `event` (time‑bounded), `log` (system/app events), etc.
  - Metadata envelope (`meta`): optional fields like `confidence`, `locale`, `redacted`, `visibility`, `sensitivity`, and `relations` ({ `parents[]`, `refs[]` }).

  - **Relationships**: parent/child, references, threads (for conversations), and collections.
  - **Indices**: timestamps, type, device_id, and tags (via FTS5) for efficient queries.
  
- **Entry Validation**: All cores enforce strict validation of entry fields:
  - Entry types are restricted to: `text`, `markdown`, `metrics`, `media_ref`, `event`, `log`
  - Maximum of 20 tags per entry, with each tag limited to 50 characters
  - Source field limited to 50 characters
  - Device ID limited to 100 characters
  - Meta fields validated for correct types and values where applicable
  - Payload is required and cannot be empty

### 6.2 Storage Strategy

- **Local-first**: recent data cached locally on each device (SQLite/FS as appropriate).
- **Portability**: encrypted export/import archives.
- **No cloud**: v1 avoids any external cloud services.
- **SQLite pragmas (indicative)**: WAL=ON; synchronous=NORMAL (desktop) / FULL (mobile); page_size tuned to storage medium; FTS5 enabled for search tables.
- **Media layout**: content‑addressed store under the app data directory; filenames by SHA‑256; optional sidecar JSON for media metadata.

### 6.3 Migration

- `schema_version` field present from day one.
- Core provides migration helpers; clients trigger migrations safely (idempotent, resumable).

### 6.4 Data Governance (Self‑Hosted)

- **Scope**: local/device‑level reliability; no cloud or remote sync promised.
- **Backups (recommended, optional)**:
  - Encrypted export archives produced via in‑app Export.
  - User‑managed rotation and location (e.g., removable media), outside the app’s purview.
- **Restore**: Import validates manifest and per‑file checksums; partial restore supported per collection.
- **Integrity**: SHA‑256 per file in export manifest; fail‑closed on mismatch; optional periodic manifest verification.
- **Corruption handling**: Enter read‑only mode on detection; guide users to re‑import from last known good export.

---

## 7) Encryption Protocol

- **Algorithm**: **AES‑256‑GCM** (12‑byte IV, 16‑byte tag).
- **KDF**: **scrypt** with per‑profile random salt (32 bytes). Parameters stored in profile header for future tuning.
  - Defaults: Desktop N=2^15, r=8, p=1; Android N=2^14, r=8, p=1. User‑tunable tiers: Basic (default), Hardened (+1 N step), Custom (advanced).
- **Per‑record IV**: unique IV for every encryption operation.
- **Auth**: GCM tag stored alongside ciphertext.
- **Bundle Layout**: `salt || iv || tag || ciphertext` (exact byte layout specified in shared spec).
- **Profile File**: created on first run; encrypted using derived key. Decrypting this file with the entered password is the unlock check.
- **Key Rotation**: supported by core (re‑encrypt profile + all payloads using a new key).
- **Zero‑Knowledge**: no raw password stored; no plaintext leaves the device; exports remain encrypted end‑to‑end.
- **Associated Data (AAD)**: include `schema_version`, `entry.id`, and `entry.type` to prevent type confusion and bind context.

---

## 8) Developer Experience & Repos

### 8.1 Repository Layout (multi‑repo)

- `core‑go/` — reference core; exports Go API; Go Mobile bindings for Android.
- `core‑js/` — TS implementation for Electron; published as an npm package.
- `client‑android/` — Android app built with Expo and `core-js`.
- `client‑desktop/` — Electron app (Windows/Linux).
- `processing‑server/` — Go HTTP server with configurable endpoints; contains `scripts/` for local processing scripts and a JSON config mapping endpoints → scripts.
- `spec‑and‑tests/` — shared API spec, schemas, conformance tests, crypto vectors.
- `docs/` — user/dev docs, security notes, tutorials.

### 8.2 Local Setup

- **Core packages**: build/install each core locally (e.g., `npm link` for `core‑js`).
- **Desktop**: install `core‑js` from git/registry.
- **Processing server**: build and run the Go server; edit JSON config to register endpoints; drop scripts into `processing‑server/scripts/`.

### 8.3 Build & Release (industry‑standard)

- **Android**: Expo builds (EAS); code-signing; CI via GitHub Actions.
- **Electron**: `electron-builder`; code‑signing on Windows; no auto‑updates in v1.
- **Server**: Go build; optional systemd service for local host; no third-party cloud dependencies.
- **Versioning**: SemVer across repos; bump `schema_version` only with migrations; migration scripts versioned.
- **Updates Policy**: Optional, version checker that fetches a single JSON release manifest from GitHub; on by default, strictly no telemetry.

### 8.4 Open‑Source Workflow (quick primer)

- **Issues**: create descriptive issues for bugs/features; use labels (bug, enhancement, good first issue).
- **Branches**: work in feature branches (`feature/xyz`), not on `main`.
- **Pull Requests (PRs)**: open a PR to merge your branch into `main`; the PR description should say what/why and link to issues.
- **Reviews**: PRs are reviewed (even self‑review if solo) before merge.
- **Commits**: small, focused commits with clear messages.
- **Releases**: tag versions (e.g., `v0.1.0`), publish release notes.
- **CODEOWNERS & CONTRIBUTING.md**: include basic guidelines to help newcomers.

---

## 9) Security & Privacy

- **Threat model**: honest‑but‑curious adversaries; device compromise considered but mitigated via device‑level security and encrypted at‑rest data.
- **No telemetry** by default.
- **Permissions**: request only what’s needed for selected data sources.
- **Secure coding**: constant‑time comparisons for secrets; lockout/backoff on repeated unlock failures (client policy).
- **Attestation**: optional local integrity checks (hash trees) for stored archives.
- **Server authentication (MVP)**:
  - Single `MASTER_PASSWORD` loaded from `.env`.
  - Bind to `localhost` by default; explicit config required to listen on LAN.
  - Rate‑limit and exponential backoff on auth failures; temporary lockout window after threshold.
  - Secrets never logged; environment file permissions checked on startup.
- **Sandboxing**: deferred. Scripts are user‑trusted and run locally; isolation is a post‑MVP hardening item.
- **Roadmap (post‑MVP)**: out‑of‑band approval flow (e.g., device notification or one‑time code), supply‑chain hardening (SBOM, pinning, signature verification).

---

## 10) Data Analysis & Visualization

- **Dashboards**: timeframe filters, daily/weekly/monthly aggregates, app usage charts, notification trends, screen‑time breakdowns.
- **Reports**: lightweight, exportable summaries; manual journaling views.
- **Server jobs**: scheduled summarization, embeddings generation (local if user provides models), deduplication and media indexing.
- **Proactive summaries**: daily/weekly cards surfaced locally that highlight meaningful changes or patterns; strictly offline or via the local server.

---

## 11) Timeline & Milestones

**Phase 1 — Planning & Architecture**

- Finalize this spec; define shared API & schema docs; set up repos and CI skeletons.

**Phase 2 — Development**

1. **core‑go** (reference) + crypto/migration modules + conformance tests.
2. **Android client MVP** (Expo + `core-js`). No background data collection in v1.
3. **Self‑hosted processing server** (core‑go) with scripts-based endpoints and `.env` `MASTER_PASSWORD` auth, localhost by default.
4. **Desktop client MVP** (Electron + core‑js). No auto‑updates; optional local version checker.

**Phase 3 — Testing & Release**

- Alpha: internal testing across devices, fix critical bugs, perf passes.
- Beta: public OSS release, docs, contribution guides.
- v1.0: stable APIs, migration story locked, dashboards shipped.
- Post‑MVP Security Track: out‑of‑band auth flow, optional sandboxing for scripts, supply‑chain checks.

---

## 12) Long‑Term Vision

- Richer automation via server scripts and optional local models.
- Wearables and additional sensors.
- Deeper local‑only analysis packaged as optional scripts.
- Community standards for personal data archiving built around LogWayss.
