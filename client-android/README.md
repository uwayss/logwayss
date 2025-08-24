# LogWayss Android Client

Android client for LogWayss built with Expo and React Native.

## Implementation Details

This client implements the LogWayss specification for Android devices using:

- **Expo** for cross-platform development
- **React Native** for the UI
- **@logwayss/core** for the core functionality (when fully implemented)
- **expo-sqlite** for local storage
- **expo-file-system** for file operations

## Current Status

The client currently implements a basic version of the core functionality with:

- Profile creation and management
- Entry creation, retrieval, and querying
- Archive export/import functionality
- Support for all entry types (text, markdown, metrics, media_ref, event, log)

## Future Improvements

Planned improvements include:

1. Full integration with @logwayss/core for end-to-end encryption
2. Background data collection for selected data sources
3. Media attachment support
4. Tagging and search functionality
5. UI/UX improvements following the LogWayss design philosophy

## Development

To run the client in development mode:

```bash
npm start
```

To build for Android:

```bash
npm run android
```

## Architecture

The client follows the LogWayss specification with a clear separation between:

- **UI Layer**: React Native components
- **Core Layer**: @logwayss/core implementation
- **Platform Layer**: Expo modules for device-specific functionality

This architecture ensures consistency with other LogWayss clients while leveraging React Native's cross-platform capabilities.