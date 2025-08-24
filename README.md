# LogWayss

A fully open-source, end-to-end encrypted, self-hosted ecosystem for documenting, archiving, and analyzing personal life data.

- Private by default. Offline-first. Extensible via local scripts.
- Cross-platform: Android and Desktop (Windows/Linux).
- No cloud dependencies. No telemetry.

## Repos/Packages in this monorepo

- `core-go/` — Go implementation of the LogWayss core (reference implementation)
- `core-js/` — TypeScript/JavaScript implementation of the LogWayss core
- `client-android/` — Android client built with Expo and React Native
- `client-desktop/` — Desktop client for Windows/Linux built with Electron
- `processing-server/` — Self-hosted processing server for analysis scripts

## Current Status

### Core Implementations
- `core-js/` — Basic implementation complete, building successfully
- `core-go/` — Reference implementation (see separate documentation)

### Client Implementations
- `client-android/` — MVP implementation with basic functionality, builds successfully
- `client-desktop/` — Skeleton implementation (see SPEC.md)

## Quick Start (Development)

- Read `DEVELOPING.md` for environment setup.
- Read `CONTRIBUTING.md` for workflow (issues → branches → PRs → merge).
- Specs live in `specification.md` and per-package `SPEC.md` files.

### Building the Android Client

```bash
cd client-android
npm install
npm start
```

### Building the Core Library

```bash
cd core-js
npm install
npm run build
```

## License

MIT. See `LICENSE`.