#!/bin/bash

# Check if Maestro is available and E2E tests can run
# This is used by the pre-push hook to conditionally run E2E tests

echo "🎭 Checking Maestro availability..."

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "⚠️  Maestro not found in PATH"
    echo "   Install with: curl -Ls \"https://get.maestro.mobile.dev\" | bash"
    exit 1
fi

# Check if simulator/emulator is available
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - check for iOS Simulator
    if ! xcrun simctl list devices | grep -q "Booted"; then
        echo "⚠️  No iOS Simulator is currently running"
        echo "   Start simulator with: npx expo run:ios"
        exit 1
    fi
else
    # Linux/Windows - check for Android emulator
    if ! adb devices | grep -q "device"; then
        echo "⚠️  No Android device/emulator connected"
        echo "   Start emulator with: npx expo run:android"
        exit 1
    fi
fi

# Check if E2E test files exist
if [ ! -d "tests/e2e/flows" ] || [ -z "$(ls -A tests/e2e/flows/*.yaml 2>/dev/null)" ]; then
    echo "⚠️  No E2E test files found in tests/e2e/flows/"
    exit 1
fi

echo "✅ Maestro is available and ready"

# Run a quick E2E test to verify everything works
echo "🧪 Running quick E2E verification..."
./scripts/run-e2e-tests.sh signup-flow