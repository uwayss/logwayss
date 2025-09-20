# LogWayss Android Client

Android client for LogWayss built with Expo and React Native, using the **shared @logwayss/core library**.

## Architecture

This client uses the **single, centralized core library** approach with **zero code duplication**:

```
client-android/
├── src/
│   ├── core/                    # Re-exports from @logwayss/core (no duplication!)
│   ├── platform/                # Expo-specific platform adapter
│   ├── screens/                 # UI screens (Welcome, Lock, Journal)
│   ├── navigation/              # Navigation system
│   └── App.tsx                  # Main application
├── node_modules/
│   └── @logwayss/core           # Shared core library (symlink to ../core-js)
└── package.json                 # Links to shared core

core-js/                         # Shared core library (platform-agnostic)
├── src/
│   ├── index.ts                 # Main Core class
│   ├── platform.ts              # Platform interface definitions
│   ├── crypto.ts                # Cryptographic functions
│   ├── types.ts                # Data types and validation
│   └── ...                      # Other core modules
```

## Key Features

### Zero Code Duplication
- **No core logic copied**: All core functionality comes from `@logwayss/core`
- **Single source of truth**: Changes to core logic instantly affect all platforms
- **Consistent behavior**: Identical functionality across all clients

### Platform Adapter Pattern
The client implements only the platform-specific adapter:

```typescript
// Platform adapter (Expo-specific)
const completeExpoPlatform: Platform = {
  fs: new CompleteExpoFileSystem(),
  crypto: new CompleteExpoCrypto(),
  dbFactory: new CompleteExpoDatabaseFactory()
};

// Core usage (shared logic)
const core = new Core(completeExpoPlatform);
```

### Shared Core Functionality
The `@logwayss/core` library provides:

- **End-to-end encryption** (AES-256-GCM)
- **Profile management** (create, unlock, lock)
- **Entry management** (create, retrieve, query)
- **Data validation** (strict schema enforcement)
- **Import/Export** (encrypted archives)
- **Tagging system** (full-text search support)

## Current Status

✅ **Core Integration**: Successfully imports and uses `@logwayss/core`  
✅ **Platform Adapter**: Expo-specific implementation working  
✅ **Basic Functionality**: Profile creation, entry management, querying  
✅ **Build System**: Compiles successfully with TypeScript  
✅ **No Duplication**: Zero core logic copied to client  
✅ **Crypto Foundation**: scrypt key derivation implemented  
✅ **Frontend UI**: Complete user interface with multiple screens  
✅ **Navigation**: Proper screen navigation with React Navigation  
⚠️ **Full Crypto**: AES-GCM encryption needs proper implementation  

## UI Implementation

### Welcome Screen
- First-time user experience
- Secure profile creation with password
- Security notes and guidance

### Lock Screen
- Profile unlock with password
- Secure authentication flow

### Journal Screen
- Main journaling interface
- Text entry creation with tagging
- Recent entries display
- Profile lock functionality

## Navigation Flow

1. **Welcome Screen** → (Profile Created) → **Lock Screen**
2. **Lock Screen** → (Password Correct) → **Journal Screen**
3. **Journal Screen** → (Lock Pressed) → **Lock Screen**

## Crypto Implementation Status

### ✅ Implemented
- **scrypt key derivation** using `scrypt-js` library
- **Random byte generation** using `expo-crypto`
- **File system operations** using `expo-file-system`
- **Database operations** using `expo-sqlite`

### ⚠️ Partially Implemented
- **AES-GCM encryption/decryption**: Currently using simple XOR for demo
- **Authenticated encryption**: Currently using fake authentication tag

### 🔧 To-Do for Full Compliance
1. Replace XOR encryption with proper AES-GCM implementation
2. Implement proper authentication tag handling
3. Add support for Additional Authenticated Data (AAD)
4. Verify compatibility with Node.js core implementation

## How It Works

1. **Shared Core**: All clients use the exact same `@logwayss/core` library
2. **Platform Adapters**: Each platform implements its specific adapter
3. **Unified Interface**: Core interacts with platform through defined interfaces
4. **Consistent Behavior**: Identical functionality guaranteed by shared code

## Development

```bash
# Install dependencies
npm install

# Build the project
npx tsc

# Run the app
npm start
```

## Benefits of This Approach

1. **Zero Duplication**: Core logic never copied between platforms
2. **Instant Consistency**: Bug fixes and features propagate to all platforms
3. **Simplified Testing**: One test suite covers core functionality for all platforms
4. **Reduced Maintenance**: Single codebase to maintain
5. **Cross-Platform Parity**: Identical behavior guaranteed by design

This architecture perfectly implements the LogWayss specification requirement for a "uniform API" across all ports.

## Next Steps

To achieve full specification compliance:

1. **Find or implement AES-GCM library** for Expo/React Native
2. **Replace demo encryption** with proper AES-GCM implementation
3. **Test compatibility** with Node.js core implementation
4. **Add proper error handling** for crypto operations
5. **Implement performance optimizations** for mobile devices
6. **Add more entry types** (media, metrics, etc.)
7. **Implement background data collection** (as per specification)

The foundation is complete and follows the specification architecture perfectly.