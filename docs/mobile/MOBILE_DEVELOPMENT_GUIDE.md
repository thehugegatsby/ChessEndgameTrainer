# Mobile Development Guide

This guide covers the setup, development, and deployment of the Chess Endgame Trainer mobile application using React Native.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Development Workflow](#development-workflow)
5. [Platform-Specific Considerations](#platform-specific-considerations)
6. [Testing](#testing)
7. [Performance Optimization](#performance-optimization)
8. [Deployment](#deployment)

## Overview

The Chess Endgame Trainer mobile app shares 80% of its codebase with the web version, utilizing React Native for cross-platform development. The app targets both iOS and Android platforms.

### Current Status
- **Implementation**: 0% (Structure prepared)
- **React Native Version**: 0.73 (prepared)
- **Target Platforms**: iOS 13+, Android 6+

## Architecture

### Code Sharing Strategy

```
/
├── shared/              # 80% shared code
│   ├── components/      # Platform-agnostic components
│   ├── hooks/          # Business logic hooks
│   ├── services/       # Service abstractions
│   └── utils/          # Utility functions
├── app/mobile/         # React Native specific
│   ├── components/     # Mobile-specific UI
│   ├── navigation/     # React Navigation setup
│   └── platform/       # Platform implementations
└── pages/              # Web-only (Next.js)
```

### Platform Abstraction

```typescript
// shared/services/platform/types.ts
interface PlatformService {
  storage: StorageAdapter;
  notification: NotificationAdapter;
  worker: WorkerAdapter;
  file: FileSystemAdapter;
}
```

## Setup Instructions

### Prerequisites

1. **Development Environment**
   - Node.js 18+
   - React Native CLI
   - Xcode 14+ (macOS only for iOS)
   - Android Studio with SDK 31+
   - Java 11+

2. **Platform-Specific Setup**

   **iOS (macOS only):**
   ```bash
   # Install CocoaPods
   sudo gem install cocoapods
   
   # Install iOS dependencies
   cd app/mobile/ios && pod install
   ```

   **Android:**
   ```bash
   # Set environment variables
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/ChessEndgameTrainer.git
cd ChessEndgameTrainer

# Install dependencies
npm install

# Navigate to mobile app
cd app/mobile

# Install mobile dependencies
npm install

# iOS specific (macOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Development Workflow

### Project Structure

```typescript
// app/mobile/App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { ChessGameProvider } from '../../shared/contexts/ChessGameContext';
import { MainNavigator } from './navigation/MainNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <ChessGameProvider>
        <MainNavigator />
      </ChessGameProvider>
    </NavigationContainer>
  );
}
```

### Shared Component Usage

```typescript
// Use shared components with mobile-specific styling
import { ChessBoard } from '../../shared/components/ChessBoard';
import { useChessGame } from '../../shared/hooks/useChessGame';

export const MobileGameScreen = () => {
  const game = useChessGame();
  
  return (
    <View style={styles.container}>
      <ChessBoard 
        position={game.fen}
        onMove={game.move}
        // Mobile-specific props
        squareSize={calculateSquareSize()}
        touchHandling="native"
      />
    </View>
  );
};
```

### Platform-Specific Implementations

```typescript
// app/mobile/platform/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class MobileStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }
  
  async set(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }
}
```

## Platform-Specific Considerations

### iOS Considerations

1. **Stockfish Integration**
   ```objective-c
   // iOS requires native module for Stockfish
   // app/mobile/ios/StockfishBridge.m
   @interface StockfishBridge : NSObject <RCTBridgeModule>
   @end
   ```

2. **Memory Management**
   - iOS may terminate background workers
   - Implement state restoration
   - Maximum 1 engine instance

3. **Touch Handling**
   - Minimum touch target: 44px
   - Support for 3D Touch/Haptic feedback

### Android Considerations

1. **Stockfish Integration**
   ```java
   // Android native module
   // app/mobile/android/.../StockfishModule.java
   public class StockfishModule extends ReactContextBaseJavaModule {
     // Implementation
   }
   ```

2. **Performance**
   - Enable Hermes for better performance
   - ProGuard configuration for release builds

3. **Permissions**
   ```xml
   <!-- AndroidManifest.xml -->
   <uses-permission android:name="android.permission.WAKE_LOCK" />
   ```

## Testing

### Unit Tests

```bash
# Run shared tests
npm test

# Run mobile-specific tests
cd app/mobile && npm test
```

### E2E Testing with Detox

```bash
# iOS
npm run e2e:ios

# Android
npm run e2e:android
```

### Platform Testing Matrix

| Feature | iOS 13+ | Android 6+ |
|---------|---------|------------|
| Stockfish Engine | ✓ | ✓ |
| Touch Gestures | ✓ | ✓ |
| Offline Mode | ✓ | ✓ |
| Background Analysis | Limited | ✓ |
| Haptic Feedback | ✓ | ✓ |

## Performance Optimization

### Memory Constraints

```typescript
// Mobile-specific constants
export const MOBILE_CONSTRAINTS = {
  MAX_ENGINE_INSTANCES: 1,
  MAX_CACHE_SIZE: 100, // Reduced from 200
  WORKER_MEMORY_LIMIT: 20 * 1024 * 1024, // 20MB
  DEBOUNCE_DELAY: 500, // Increased from 300ms
};
```

### Bundle Optimization

1. **Code Splitting**
   ```javascript
   // Use dynamic imports for heavy components
   const ChessEngine = lazy(() => import('./ChessEngine'));
   ```

2. **Asset Optimization**
   - Use .webp for images
   - Minimize Stockfish binary size
   - Remove unused libraries

3. **React Native Specific**
   ```javascript
   // metro.config.js
   module.exports = {
     transformer: {
       minifierConfig: {
         keep_fnames: true,
         mangle: {
           keep_fnames: true,
         },
       },
     },
   };
   ```

## Deployment

### iOS Deployment

1. **Configuration**
   ```bash
   # Set bundle identifier
   # Update app/mobile/ios/ChessEndgameTrainer/Info.plist
   ```

2. **Build & Archive**
   ```bash
   cd ios
   xcodebuild -workspace ChessEndgameTrainer.xcworkspace \
     -scheme ChessEndgameTrainer \
     -configuration Release \
     -archivePath ./build/ChessEndgameTrainer.xcarchive \
     archive
   ```

3. **App Store Submission**
   - Use Xcode Organizer
   - Ensure all permissions are documented
   - Add required screenshots

### Android Deployment

1. **Generate Signed APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Configure build.gradle**
   ```gradle
   android {
     defaultConfig {
       versionCode 1
       versionName "1.0.0"
     }
     signingConfigs {
       release {
         // Add signing configuration
       }
     }
   }
   ```

3. **Google Play Submission**
   - Upload APK/AAB
   - Fill store listing
   - Set up release tracks

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   # Clear cache
   npx react-native start --reset-cache
   ```

2. **iOS build failures**
   ```bash
   # Clean build
   cd ios && xcodebuild clean && pod install
   ```

3. **Android build issues**
   ```bash
   # Clean and rebuild
   cd android && ./gradlew clean && ./gradlew assembleDebug
   ```

## Future Enhancements

1. **Offline Functionality**
   - Local tablebase storage
   - Downloadable scenario packs
   - Sync when online

2. **Native Features**
   - Push notifications for daily puzzles
   - Widget support
   - Share functionality

3. **Performance**
   - Native Stockfish integration
   - GPU acceleration for analysis
   - Background processing

---

For questions or issues specific to mobile development, please refer to the [React Native documentation](https://reactnative.dev/) or open an issue in the repository.