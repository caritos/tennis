# Expo Workflow Types Explained

## Overview

Expo offers different workflows for React Native development. Understanding these workflows is crucial for production stability and maintenance decisions.

## Workflow Types

### 1. **Managed Workflow** (What We Use Now)

**Definition**: Expo handles all native iOS/Android configuration automatically. You only manage JavaScript/TypeScript code.

**Key Characteristics:**
- **No native directories**: No `ios/` or `android/` folders in your project
- **Configuration via JSON**: All settings controlled through `app.json` or `app.config.js`
- **EAS Build generates native code**: iOS/Android projects created fresh for each build
- **Limited native customization**: Can only use Expo-supported native modules

**Our Project Structure (Managed):**
```
tennis/
├── app/                 # React Native code
├── components/          # UI components  
├── assets/             # Images, fonts, etc.
├── app.json            # ALL configuration (iOS, Android, build settings)
├── eas.json            # Build configuration
└── package.json        # Dependencies
```

**Benefits for Our App:**
- ✅ **Single source of truth**: `app.json` controls everything
- ✅ **No configuration drift**: Can't have iOS vs JSON mismatches
- ✅ **Automatic updates**: Expo handles iOS/Android SDK updates
- ✅ **Smaller repository**: No massive native directories
- ✅ **Production stability**: Less complexity = fewer failure points

### 2. **Bare Workflow** (What We Had Before)

**Definition**: Full access to native iOS/Android projects. You manage native code directly.

**Key Characteristics:**
- **Native directories present**: `ios/` and `android/` folders exist
- **Direct native access**: Can modify Xcode projects, add native modules
- **Manual configuration**: Must sync settings between `app.json` and native files
- **Full customization**: Any native feature or library can be added

**Our Previous Structure (Bare):**
```
tennis/
├── app/                 # React Native code
├── ios/                 # ← Native iOS Xcode project
│   ├── PlayServe.xcodeproj/
│   ├── PlayServe/
│   │   ├── Info.plist   # ← iOS build number was here
│   │   └── ...
├── android/             # ← Native Android project (if we had it)
├── app.json            # ← Build number was also here
└── ...
```

**Problems We Had:**
- ❌ **Configuration conflicts**: `app.json` said build 20250820001, `Info.plist` said 5
- ❌ **Manual sync required**: Had to update multiple files for one change  
- ❌ **Larger repository**: 3,529 deleted files when we removed `ios/`
- ❌ **Complex maintenance**: More places for things to go wrong

### 3. **Development Builds** (Hybrid Approach)

**Definition**: Custom Expo Go app with your native code baked in.

**Use Case**: When you need some native modules but want managed workflow benefits for development.

## Why We Chose Managed Workflow

### **Production Stability Requirements**
Based on our [production stability policy](production-stability-requirements.md):

> "When building the app, nothing experimental should be used. All libraries and processes must be production quality and verified to work reliably for an extended period."

**Managed Workflow Advantages:**
1. **Proven Stability**: Expo's managed workflow has been production-ready for years
2. **Reduced Complexity**: Fewer moving parts = fewer failure points
3. **Automatic Updates**: Expo handles iOS/Android platform updates
4. **Consistent Builds**: Every build starts from a clean, known state

### **Our Specific Problems Solved**

**Before (Bare Workflow Issues):**
- Build number conflicts between `app.json` and `ios/Info.plist`
- EAS builds using wrong configuration source
- Manual maintenance of native iOS project
- App Store rejection due to configuration inconsistencies

**After (Managed Workflow Benefits):**
- ✅ Single configuration source (`app.json`)
- ✅ Build number `20250820001` correctly used
- ✅ No manual iOS project maintenance
- ✅ Consistent App Store builds

## Configuration Comparison

### Managed Workflow (Current)
```json
// app.json - SINGLE SOURCE OF TRUTH
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "20250820001",
      "supportsTablet": true,
      "bundleIdentifier": "com.caritos.tennis"
    }
  }
}
```

### Bare Workflow (Previous)
```json
// app.json
{
  "expo": {
    "ios": {
      "buildNumber": "20250820001"  // ← Was ignored!
    }
  }
}
```

```xml
<!-- ios/PlayServe/Info.plist -->
<key>CFBundleVersion</key>
<string>5</string>  <!-- ← This was actually used -->
```

## Native Module Limitations

**What We Can't Do (Managed Workflow):**
- Add arbitrary native iOS/Android libraries
- Modify Xcode project settings directly
- Use native modules not supported by Expo

**What We Can Do:**
- Use 50+ Expo modules (camera, location, notifications, etc.)
- Use most popular React Native libraries
- Request new native modules from Expo team
- Eject to bare workflow if needed (reversible decision)

## Current Dependencies Check

All our key dependencies work with managed workflow:
- ✅ **Supabase**: JavaScript client, no native code
- ✅ **Expo Router**: Built for managed workflow
- ✅ **React Native Reanimated**: Expo-supported
- ✅ **Gesture Handler**: Expo-supported  
- ✅ **Safe Area Context**: Expo-supported
- ✅ **AsyncStorage**: Expo-supported

## Future Considerations

### When to Consider Bare Workflow
- Need specific native libraries not supported by Expo
- Require deep iOS/Android customization
- Corporate requirements for direct native access

### When to Stay Managed
- Current feature set meets all requirements ✅ (Our case)
- Prioritize stability and maintainability ✅ (Our policy)
- Want automatic platform updates ✅ (Less maintenance)

## Build Process Comparison

### Managed Workflow Build Process (Current)
```
1. EAS receives app.json + JavaScript code
2. EAS generates fresh iOS project from app.json
3. EAS compiles iOS project with our code
4. EAS produces .ipa file for App Store
```

### Bare Workflow Build Process (Previous)
```
1. EAS receives entire iOS project + JavaScript code
2. EAS uses our pre-built iOS project
3. Potential conflicts between iOS project and app.json
4. EAS produces .ipa file (if no conflicts)
```

## Decision Timeline

```
Problem: App Store iPad crash + build number conflicts
Analysis: iOS/app.json configuration mismatches
Solution: Switch to managed workflow (single source of truth)
Result: Clean builds with correct configuration
```

## Monitoring and Maintenance

### What We Need to Monitor
- **Expo SDK Updates**: Regular updates with new features and fixes
- **React Native Version**: Managed by Expo, automatic compatibility
- **Native Module Support**: Check Expo docs for new supported libraries

### What We Don't Need to Worry About
- iOS Xcode project maintenance
- Android Gradle configuration
- Native dependency version conflicts
- Platform-specific build configurations

---

**Summary**: Managed workflow provides the production stability, simplicity, and reliability required for Play Serve while eliminating the configuration complexity that caused our App Store rejection.

*This decision aligns with our core principle: "No experimental features in production" - managed workflow is battle-tested and proven at scale.*