#!/bin/bash

# Pre-build hook to automatically increment build number
echo "🔧 Running pre-build hook: incrementing build number..."

# Run the increment script
node scripts/increment-build.js

echo "✅ Pre-build hook completed"