#!/bin/bash

# Setup iOS Simulator for E2E testing
# Disables password autofill to prevent test failures

echo "🔧 Setting up iOS Simulator for E2E testing..."

# Get the active simulator device ID
DEVICE_ID=$(xcrun simctl list devices | grep "Booted" | grep -E "iPhone|iPad" | awk -F "[()]" '{print $2}' | head -1)

if [ -z "$DEVICE_ID" ]; then
    echo "❌ No booted iOS simulator found. Please start a simulator first."
    exit 1
fi

echo "📱 Found booted simulator: $DEVICE_ID"

# Disable password autofill
echo "🔐 Disabling password autofill..."
xcrun simctl spawn "$DEVICE_ID" defaults write com.apple.springboard PasswordManagerDisabled -bool YES

# Disable keyboard autocorrection and other features that interfere with testing
echo "⌨️ Disabling keyboard features..."
xcrun simctl spawn "$DEVICE_ID" defaults write com.apple.Preferences KeyboardAutocorrection -bool NO
xcrun simctl spawn "$DEVICE_ID" defaults write com.apple.Preferences KeyboardPrediction -bool NO
xcrun simctl spawn "$DEVICE_ID" defaults write com.apple.Preferences KeyboardAllowPaddle -bool NO

# Restart SpringBoard to apply changes
echo "🔄 Restarting SpringBoard..."
xcrun simctl spawn "$DEVICE_ID" launchctl stop com.apple.SpringBoard

echo "✅ iOS Simulator setup complete!"
echo "📝 Note: Run this script before running E2E tests to ensure proper test execution"