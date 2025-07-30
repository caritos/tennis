# Device Matrix Testing for App Store Submission

This directory contains Maestro test flows for comprehensive device testing across different iPhone and iPad screen sizes, as required for App Store submission.

## Overview

Based on **GitHub Issue #65**, this testing suite ensures the app works correctly across all supported iOS devices. Apple may reject apps that don't render properly on iPads, even if the app doesn't specifically target tablets.

## Device Coverage

### iPhone Testing (Required)
- **iPhone SE (3rd gen)** - 4.7" (1334×750) - Smallest screen
- **iPhone 14/15** - 6.1" (2532×1170) - Standard size  
- **iPhone 14/15 Pro Max** - 6.7" (2778×1284) - Largest iPhone

### iPad Testing (Critical for App Store Approval)
- **iPad (10th gen)** - 10.9" (2360×1640)
- **iPad Air (5th gen)** - 10.9" (2360×1640)
- **iPad Pro 11"** - 11" (2388×1668)
- **iPad Pro 12.9"** - 12.9" (2732×2048)

## Test Files

### Core Tests
- `device-matrix-test.yaml` - General device compatibility test
- `iphone/iphone-se-test.yaml` - Small screen specific tests
- `iphone/iphone-pro-max-test.yaml` - Large screen specific tests  
- `ipad/ipad-landscape-test.yaml` - iPad-specific layout tests

## Usage

### Run All Device Tests
```bash
./scripts/run-device-tests.sh
```

### Run Specific Device Categories
```bash
# Test iPhone SE (smallest screen)
./scripts/run-device-tests.sh se

# Test standard iPhone sizes
./scripts/run-device-tests.sh iphone

# Test large iPhone sizes  
./scripts/run-device-tests.sh pro-max

# Test iPad compatibility
./scripts/run-device-tests.sh ipad
```

### Run Individual Tests
```bash
# Using the existing e2e script
./scripts/run-e2e-tests.sh device-testing/device-matrix-test
./scripts/run-e2e-tests.sh device-testing/iphone/iphone-se-test
./scripts/run-e2e-tests.sh device-testing/ipad/ipad-landscape-test
```

## What Each Test Verifies

### Layout and Rendering
- All UI elements are fully visible
- Text is readable at appropriate sizes
- Images and icons scale correctly
- No content overflow or clipping

### Touch Interaction
- All buttons are appropriately sized for touch
- Form fields are accessible without overlap
- Navigation elements work correctly
- Scrolling behavior is smooth

### Device-Specific Checks
- **iPhone SE**: Content fits on small screen without scrolling issues
- **iPhone Pro Max**: Content utilizes large screen space efficiently
- **iPad**: Layout adapts properly to tablet form factor

### Critical App Store Requirements
- App launches successfully on all devices
- Core functionality works on iPads (even if not targeting tablets)
- No crashes or rendering failures
- Proper keyboard handling across screen sizes

## Screenshots and Debug Output

Test results and screenshots are saved to:
```
tests/integration/screenshots/device-testing/[device-name]/
```

Each test generates screenshots at key interaction points to help verify proper rendering across devices.

## Integration with CI/CD

Add to your GitHub Actions or CI pipeline:
```yaml
- name: Run Device Matrix Tests
  run: ./scripts/run-device-tests.sh
```

## App Store Submission Checklist

Before submitting to the App Store, ensure:
- ✅ All iPhone sizes pass tests
- ✅ All iPad sizes pass tests (critical!)
- ✅ No layout breaking or content overflow
- ✅ Touch targets are appropriately sized
- ✅ App launches successfully on all devices

## Notes

- iPad testing is **mandatory** even for iPhone-only apps
- Apple may reject apps with iPad compatibility issues
- Test on actual devices when possible for final validation
- Update device list as new iOS devices are released