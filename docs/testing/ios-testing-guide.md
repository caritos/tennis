# iOS Simulator Testing Guide

## Overview

This guide provides comprehensive instructions for testing the Tennis Club app on iOS simulator, including setup, testing procedures, and troubleshooting.

## Prerequisites

### Required Software
1. **Xcode**: Latest version with iOS Simulator
2. **Node.js**: Version 18 or higher
3. **Expo CLI**: `npm install -g @expo/cli`
4. **React Native development environment**

### iOS Simulator Setup
1. Open Xcode
2. Install iOS Simulator (if not already installed)
3. Launch iPhone 15 Pro simulator (recommended)
4. Verify simulator is running: `xcrun simctl list devices`

## Development Build Setup

### Starting the App
```bash
# MANDATORY: Use development build (not Expo Go)
npx expo run:ios --device "iPhone 15 Pro"

# Alternative: Specify device by ID
npx expo run:ios --device FD7E3187-DD49-4ED6-98B5-A877992FDC6D

# Clean build if needed
npx expo run:ios --clean
```

### Why Development Build?
- ✅ Full native functionality
- ✅ E2E testing compatibility (Maestro)
- ✅ Real-world performance
- ✅ All React Native components work
- ❌ **Avoid Expo Go**: Limited functionality, E2E testing issues

## Core Feature Testing

### 1. Authentication Testing

#### Sign Up Form Testing:
1. **Navigate**: Launch app → Get Started → Sign Up → Sign up with email
2. **Test keyboard interactions**:
   - Full Name: Words capitalization, validation
   - Email: Email keyboard, validation
   - Password: Secure entry, no autofill
   - Phone: Phone pad keyboard
3. **Test form validation**:
   - Submit empty form → See validation errors
   - Invalid email → Email validation error
   - Password mismatch → Password error
4. **Test checkbox**: Terms agreement checkbox
5. **Test submission**: Valid form → Success

#### Key Testing Points:
- Keyboard appears and dismisses properly
- Form scrolls with keyboard open
- Validation provides clear feedback
- Success/error states work correctly

### 2. Match Recording Testing

#### Access Match Recording:
1. **Navigate**: Clubs Tab → Record Match (top-right)
2. **Test form inputs**:
   - Match type radio buttons
   - Player search with suggestions
   - Date picker interaction
   - Score entry with tennis validation
   - Notes multi-line input

#### Tennis Score Testing:
1. **Add sets**: Tap "Add Set" button
2. **Enter scores**: 
   - Valid: 6-4, 7-5, 6-3
   - Tiebreak: 7-6 (triggers tiebreak input)
   - Invalid: 8-6 (should show error)
3. **Verify calculations**: Match winner determined correctly

#### Key Testing Points:
- All text inputs work with iOS keyboard
- Dropdown suggestions appear correctly
- Score validation follows tennis rules
- Save functionality works offline

### 3. Club Discovery & Details

#### Club List Testing:
1. **Navigate**: Clubs Tab
2. **Test interactions**:
   - Club card touch interactions
   - Join club buttons
   - Pull-to-refresh functionality
   - Search club functionality

#### Club Details Testing:
1. **Navigate**: Tap any club card
2. **Test sections**:
   - Rankings list scrolling
   - Recent matches display
   - Challenge button interactions
   - Member list functionality

### 4. Challenge System Testing

#### Creating Challenges:
1. **Navigate**: Club Details → Member ranking → Tap challenge icon
2. **Test modal**:
   - Modal slide-up animation
   - Match type selection (Singles/Doubles)
   - Player selection checkboxes
   - Time options grid
   - Message text input
3. **Test submission**: Send challenge → Success notification

#### Key Testing Points:
- Modal presentation works smoothly
- All form elements interactive
- Validation prevents invalid submissions
- Success/error feedback clear

## Offline Testing

### Simulating Offline Mode
```bash
# Set simulator to offline mode
xcrun simctl status_bar "iPhone 15 Pro" override --operatorName "No Service" --cellularMode searching

# Reset to normal
xcrun simctl status_bar "iPhone 15 Pro" clear
```

### Offline Functionality Tests:
1. **Match recording**: Should save locally
2. **Club operations**: Should queue for sync
3. **Navigation**: All screens should work
4. **Data integrity**: No data loss when offline

### Network Reconnection Tests:
1. Go offline → Record match → Go online
2. Verify automatic sync occurs
3. Check sync status indicators
4. Test manual retry of failed operations

## Performance Testing

### Startup Performance:
- **Development build**: ~15-20 seconds (normal)
- **Navigation**: Should be smooth (<16ms frames)
- **Memory usage**: Monitor in Xcode Instruments
- **CPU usage**: Normal for React Native app

### Stress Testing:
1. **Large data sets**: Many matches, clubs, members
2. **Long sessions**: Keep app open for extended periods
3. **Memory pressure**: Test with low memory simulation
4. **Network conditions**: Test with slow/unreliable network

## Troubleshooting

### Common Issues

#### App Won't Start:
```bash
# Clear cache and restart
npx expo start --clear

# Clean build
npx expo run:ios --clean

# Reset Metro bundler
npx expo start --reset-cache
```

#### Keyboard Issues:
- **Problem**: Keyboard not appearing
- **Solution**: Use development build, not Expo Go
- **Testing**: CMD+K to toggle simulator keyboard

#### Build Errors:
```bash
# Clean Xcode build
cd ios && xcodebuild clean && cd ..

# Delete node_modules and reinstall
rm -rf node_modules && npm install

# Clear Expo cache
expo r -c
```

#### Simulator Performance:
- **Slow performance**: Increase simulator RAM
- **Touch issues**: Enable "Slow Animations" temporarily
- **Network issues**: Check host network connectivity

### Debug Tools

#### React Native Debugger:
- Shake simulator → Debug Remote JS
- Chrome DevTools integration
- Redux DevTools (if used)

#### Xcode Instruments:
- Profile app performance
- Memory leak detection
- CPU usage monitoring

#### Simulator Menu Options:
- **Device → Shake Gesture**: Access debug menu
- **Hardware → Keyboard**: Toggle hardware keyboard
- **I/O → Screenshot**: Capture test screenshots

## E2E Testing with Maestro

### Setup Maestro Testing:
```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Test installation
maestro --version

# Run existing flows
maestro test e2e/flows/signup-flow.yaml
```

### Recording New Tests:
```bash
# Start Maestro Studio
maestro studio

# Use browser interface to record interactions
# Export as YAML to e2e/flows/
```

### Key Testing Flows:
- User registration and login
- Match recording end-to-end
- Club joining and discovery
- Challenge creation and response

## Testing Checklist

### Before Each Testing Session:
- [ ] iOS Simulator running (iPhone 15 Pro recommended)
- [ ] Development build started (`npx expo run:ios`)
- [ ] Network connectivity verified
- [ ] Debug tools ready (if needed)

### Core Functionality Tests:
- [ ] Authentication (sign up, login, logout)
- [ ] Match recording (all input types)
- [ ] Club operations (join, browse, details)
- [ ] Challenge system (create, respond)
- [ ] Tennis scoring (validation, display)
- [ ] Offline functionality
- [ ] Data synchronization

### UI/UX Tests:
- [ ] All text inputs work with iOS keyboard
- [ ] Navigation smooth and responsive
- [ ] Error states provide clear feedback
- [ ] Success states confirm actions
- [ ] Loading states show during async operations

### Performance Tests:
- [ ] App startup time acceptable
- [ ] Navigation performance smooth
- [ ] Memory usage stable
- [ ] Battery usage reasonable (on device)

## Best Practices

### Development Workflow:
1. Always use development builds for testing
2. Test on multiple simulator devices (iPhone SE, iPhone 15 Pro Max)
3. Test both light and dark modes
4. Test with various network conditions
5. Document any iOS-specific behaviors

### Bug Reporting:
1. Include iOS version and device model
2. Provide steps to reproduce
3. Include screenshots/screen recordings
4. Note any console errors or warnings
5. Test on both simulator and physical device when possible

### Performance Optimization:
1. Profile with Xcode Instruments regularly
2. Monitor memory usage in long sessions
3. Test with realistic data sets
4. Optimize for iPhone SE (smaller screen/memory)

## Automated Testing Integration

### CI/CD Integration:
```yaml
# Example GitHub Actions iOS testing
- name: Test iOS Build
  run: |
    npx expo run:ios --configuration Release
    maestro test e2e/flows/
```

### Testing Reports:
- Generate screenshots for test documentation
- Export Maestro test results
- Monitor performance metrics over time
- Track test coverage across features

## Conclusion

This guide provides a comprehensive framework for testing the Tennis Club app on iOS simulator. Regular testing following these procedures ensures a high-quality iOS user experience and catches issues early in development.

For questions or issues, refer to the project documentation or create GitHub issues with detailed testing information.