# End-to-End Testing Guide

## Overview

This guide documents the complete E2E testing setup, patterns, and best practices for the Tennis Club app using Maestro. All solutions and patterns documented here have been tested and proven to work reliably.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Build Requirements](#development-build-requirements)
- [Component Compatibility](#component-compatibility)
- [Text Input Solutions](#text-input-solutions)
- [Test Writing Standards](#test-writing-standards)
- [Directory Structure](#directory-structure)
- [Debugging & Troubleshooting](#debugging--troubleshooting)
- [Common Patterns](#common-patterns)

## Quick Start

### Prerequisites
- Maestro CLI installed (`curl -Ls "https://get.maestro.mobile.dev" | bash`)
- Development build running (not Expo Go)
- iOS Simulator or Android Emulator

### Run Tests
```bash
# Run all E2E tests
npm run e2e

# Run specific test
maestro test tests/e2e/flows/01-signup-complete.yaml

# Open Maestro Studio for recording
npm run e2e:record
```

## Development Build Requirements

### ⚠️ CRITICAL: Use Development Builds, NOT Expo Go

**✅ REQUIRED: Development Builds**
```bash
# iOS
npx expo run:ios

# Android  
npx expo run:android
```

**❌ NEVER: Expo Go for E2E Testing**
```bash
# DO NOT USE FOR E2E TESTING
npm start  # or npx expo start
```

### Why Development Builds are Required

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| TextInput State Updates | ❌ Broken | ✅ Works |
| Real Component Interactions | ❌ Limited | ✅ Full Support |
| Performance Testing | ❌ Different | ✅ Production-like |
| Native Module Access | ❌ Restricted | ✅ Complete |
| E2E Test Reliability | ❌ Unreliable | ✅ Reliable |

**Development builds provide the true-to-production environment needed for accurate E2E testing.**

## Component Compatibility

### Button Components

#### ✅ Native Button (RECOMMENDED)
```typescript
import { Button } from 'react-native';

// Works perfectly with Maestro
<Button 
  title="Create Account"
  onPress={handleSubmit}
  testID="create-account-button"
/>
```

```yaml
# Maestro test
- tapOn:
    id: "create-account-button"
```

#### ✅ Pressable (Custom Styling)
```typescript
import { Pressable } from 'react-native';

<Pressable
  onPress={handlePress}
  testID="custom-button"
>
  <Text>Custom Button</Text>
</Pressable>
```

#### ❌ TouchableOpacity (Avoid)
- Limited Maestro compatibility
- Use Pressable instead for custom buttons

### Checkbox Components

#### ✅ Expo Checkbox (REQUIRED)
```typescript
import Checkbox from 'expo-checkbox';

<Checkbox
  value={isChecked}
  onValueChange={setIsChecked}
  testID="terms-checkbox"
  accessibilityLabel="I agree to terms"
/>
```

```yaml
# Maestro test
- tapOn:
    id: "terms-checkbox"
```

**Required Properties:**
- `value`: Boolean state
- `onValueChange`: State setter
- `testID`: Unique identifier for testing
- `accessibilityLabel`: Screen reader support

### TextInput Components

#### ✅ React Native TextInput
```typescript
<TextInput
  style={styles.input}
  value={email}
  onChangeText={setEmail}
  testID="email-input"
  accessibilityLabel="Email Address"
/>
```

**Key Requirements:**
- Always include `testID` for reliable selection
- Use `accessibilityLabel` for better test readability
- Development build required for state updates

## Text Input Solutions

### The Text Bleeding Problem

**Issue**: Rapid text input in E2E tests causes text concatenation
- Input "invalid-email" then "valid@example.com"  
- Result: "invalid-emailvalid@example.com" ❌

### ✅ Solution: Field Clearing Pattern

**Pattern 1: Long Press + Select All + Erase (RECOMMENDED)**
```yaml
# Clear field with existing content
- longPressOn:
    id: "email-input"
- tapOn: "Select All"
- eraseText
- waitForAnimationToEnd
- inputText: "valid@example.com"
- waitForAnimationToEnd
```

**Pattern 2: Direct Erase (For Recent Content)**
```yaml
# Clear field that was just filled
- tapOn:
    id: "confirm-password-input"
- eraseText: 23  # Character count of "DifferentPassword123"
- waitForAnimationToEnd
- inputText: "Password123"
- waitForAnimationToEnd
```

### Reusable Field Clearing Patterns

See `/tests/e2e/utils/field-clearing.yaml` for complete reusable patterns.

## Test Writing Standards

### File Naming Convention
```
tests/e2e/flows/
├── 00-simple-navigation.yaml          # Basic navigation
├── 01-signup-complete.yaml            # Core user flows  
├── 02-validation-testing-working.yaml # Form validation
├── 03-signin-working.yaml             # Authentication
└── 99-debug-*.yaml                    # Debug utilities
```

### Test Structure Template
```yaml
appId: com.caritos.tennis
name: "Descriptive Test Name"
---

# Test description and purpose

# Launch app with clean state
- launchApp:
    clearState: true
- waitForAnimationToEnd

# Test steps with clear comments
- tapOn: "Get Started"
- waitForAnimationToEnd

# Take screenshots at key points
- takeScreenshot: test-checkpoint

# Use specific assertions
- assertVisible:
    id: "expected-element"

# Handle optional elements
- assertVisible:
    text: "Success|Error Message"
    optional: true
```

### Required Elements

**Every Test Must Include:**
1. `appId: com.caritos.tennis`
2. Clear `name` describing the test purpose
3. `clearState: true` for consistent starting conditions
4. `waitForAnimationToEnd` after navigation
5. `takeScreenshot` at key verification points
6. Specific `testID` selectors when available

### Best Practices

**✅ DO:**
- Use descriptive test names and comments
- Clear app state between test sections
- Add proper wait times for animations
- Use `testID` selectors when available
- Take screenshots for debugging
- Test both success and error scenarios

**❌ DON'T:**
- Rely on text selectors for dynamic content
- Skip wait times between actions
- Use overly complex test flows
- Test multiple unrelated features in one file
- Forget to handle optional UI elements

## Directory Structure

```
tests/e2e/
├── flows/                    # Main test files
│   ├── 00-simple-navigation.yaml
│   ├── 01-signup-complete.yaml
│   ├── 02-validation-testing-working.yaml
│   └── 03-signin-working.yaml
├── utils/                    # Reusable patterns
│   ├── field-clearing.yaml
│   └── common-assertions.yaml
└── screenshots/             # Test artifacts
    └── [generated by Maestro]
```

### Test Categories

**00-09: Navigation & Basic Flows**
- App launch, navigation, basic interactions

**10-19: Authentication**  
- Sign up, sign in, password reset

**20-29: Core Features**
- Match recording, club management, challenges

**30-39: Advanced Features**
- Rankings, looking to play, complex workflows

**90-99: Debug & Utilities**
- Debugging tools, test utilities

## Debugging & Troubleshooting

### Common Issues

#### 1. TextInput Not Updating
**Symptoms**: Visual input works but React state doesn't update
**Solution**: Use development build, not Expo Go

#### 2. Text Input Bleeding  
**Symptoms**: "invalid-emailvalid@example.com"
**Solution**: Use field clearing patterns (see above)

#### 3. Button Not Tappable
**Symptoms**: Button visible but tap fails
**Solution**: Use native Button or Pressable components

#### 4. Element Not Found
**Symptoms**: "Element not found" errors
**Solution**: Add `testID` props to components

### Debug Utilities

#### View App State
```yaml
# Take screenshot to see current state
- takeScreenshot: debug-current-state

# Check for multiple possible elements
- assertVisible:
    text: "Option1|Option2|Option3"
    optional: true
```

#### Test Element Visibility
```yaml
# Test what text is actually visible
- assertVisible:
    text: "Expected Text"
    optional: true  # Won't fail if not found
```

### Maestro Studio for Recording

```bash
# Open recording interface
npm run e2e:record

# Then interact with your app to record actions
# Export the recorded flow as YAML
```

## Common Patterns

### Form Validation Testing
```yaml
# Test empty form validation
- tapOn:
    id: "submit-button"
- assertVisible:
    id: "field-error"
- takeScreenshot: validation-errors

# Test with valid data
- tapOn:
    id: "input-field"
- inputText: "valid data"
- tapOn:
    id: "submit-button"
- assertVisible: "Success"
```

### Authentication Flow
```yaml
# Navigate to sign up
- tapOn: "Get Started"
- tapOn:
    id: "email-signup-button"

# Fill form with field clearing
- longPressOn:
    id: "email-input"
- tapOn: "Select All"  
- eraseText
- inputText: "test@example.com"

# Submit and verify
- tapOn:
    id: "create-account-button"
- assertVisible: "My Clubs"
```

### Navigation Testing
```yaml
# Test tab navigation
- tapOn: "Profile"
- assertVisible: "Profile"
- tapOn: "Clubs" 
- assertVisible: "My Clubs"
```

## Performance Testing

### Test Timing Guidelines
- `waitForAnimationToEnd`: After navigation
- `waitForAnimationToEnd: timeout: 5000`: For network operations
- `waitForAnimationToEnd: timeout: 3000`: For form submissions

### Screenshot Strategy
- Before major actions: `pre-action-state`
- After completions: `post-action-result`  
- On errors: `error-state-debug`

## Advanced Topics

### Conditional Testing
```yaml
# Handle optional UI elements
- assertVisible:
    text: "Optional Element"
    optional: true

# Multiple possible outcomes
- assertVisible:
    text: "Success|Error|Loading"
    optional: true
```

### Environment Variables
```yaml
# Use variables for test data
- inputText: "${TEST_EMAIL}"
- inputText: "${TIMESTAMP}"
```

### Error Recovery
```yaml
# Graceful error handling
- tapOn:
    text: "Retry"
    optional: true
- waitForAnimationToEnd
```

## Conclusion

This E2E testing setup provides reliable, maintainable test automation for the Tennis Club app. The key to success is:

1. **Always use development builds**
2. **Follow component compatibility guidelines**  
3. **Use proven field clearing patterns**
4. **Include proper test IDs in components**
5. **Take screenshots for debugging**

For questions or issues, refer to the troubleshooting section or check existing test files for working examples.

---

**Last Updated**: 2025-07-29  
**Maestro Version**: Latest  
**Expo SDK**: 53.0.0