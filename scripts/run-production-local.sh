#!/bin/bash

# Script to run the app locally with production database
# USE WITH CAUTION - This connects to your production database!

echo "⚠️  WARNING: Running with PRODUCTION database!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Set production environment
export EXPO_PUBLIC_APP_ENV=production

# Load production environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Start Expo
npm start