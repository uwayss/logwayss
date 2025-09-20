# LogWayss

A fully open-source, end-to-end encrypted, self-hosted ecosystem for documenting, archiving, and analyzing personal life data.

- Private by default. Offline-first. Extensible via local scripts.
- Cross-platform: Android and Desktop (Windows/Linux).
- No cloud dependencies. No telemetry.

## Architecture

LogWayss follows a **single-core, multi-platform** architecture:

```
logwayss/                    # Monorepo
├── core-js/                # Shared TypeScript/JavaScript core (platform-agnostic)
├── core-go/                # Shared Go core (reference implementation)
├── client-android/         # Android client (Expo/React Native)
├── client-desktop/         # Desktop client (Electron)
└── processing-server/      # Self-hosted processing server (Go)
```

### Core Libraries
- **Single source of truth**: All core logic exists in one place
- **Platform agnostic**: Works with any platform through adapters
- **Zero duplication**: No code copied between platforms
- **Instant consistency**: Changes affect all platforms simultaneously

### Client Architecture
Each client:
1. Imports the shared core library
2. Implements a platform adapter
3. Provides platform-specific UI

## Current Status

### ✅ Core Libraries
- `core-js/` - Fully functional TypeScript implementation
  - End-to-end encryption (AES-256-GCM)
  - Profile management
  - Entry CRUD operations
  - Data validation
  - Import/Export functionality
  - Tagging and search
  - Building and passing all tests

### ✅ Android Client
- `client-android/` - Expo/React Native client
  - Successfully imports and compiles with `@logwayss/core`
  - Platform-agnostic architecture established
  - Expo platform adapter pending implementation

### 🚧 Desktop Client
- `client-desktop/` - Electron client
  - Skeleton implementation
  - Will use same `@logwayss/core` library

### 🚧 Processing Server
- `processing-server/` - Go-based server
  - Reference implementation using `core-go`

## Quick Start (Development)

### Building the Core Library
```bash
cd core-js
npm install
npm run build
npm run test
```

### Building the Android Client
```bash
cd client-android
npm install
npx tsc
```

### Core Library Features
The shared `@logwayss/core` library provides:

- **Encryption**: AES-256-GCM with scrypt key derivation
- **Storage**: SQLite with WAL mode and FTS5 search
- **Data Model**: Strictly validated entries with tagging
- **Profiles**: Encrypted user profiles with unlock/lock
- **Import/Export**: Encrypted archive functionality
- **Querying**: Time-based, type-based, and tag-based searches

## Design Philosophy

### Single Core Principle
All core logic exists in one place and is never duplicated. This ensures:

- **Consistency**: Identical behavior across all platforms
- **Maintainability**: One codebase to maintain
- **Reliability**: Bug fixes propagate to all platforms
- **Testing**: One test suite covers all platforms

### Platform Agnostic Core
The core library works with any platform through well-defined interfaces:

```typescript
// Platform interface
interface Platform {
  fs: FileSystem;      // File operations
  crypto: CryptoEngine; // Cryptographic operations
  dbFactory: DatabaseFactory; // Database operations
}

// Usage
const core = new Core(platformAdapter);
```

## License

MIT. See `LICENSE`.