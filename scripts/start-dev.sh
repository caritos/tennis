#!/bin/bash
# Start Expo in development mode without Expo Go

echo "Starting Expo development server..."
npx expo start --localhost --ios

# This will use your development build instead of Expo Go
# Or you can use: npx expo run:ios