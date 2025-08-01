#!/bin/bash
# Expo start with logging

# Create logs directory if it doesn't exist
mkdir -p logs

# Generate filename with timestamp
LOG_FILE="logs/expo-$(date +%Y%m%d-%H%M%S).log"

echo "Starting Expo with logging to: $LOG_FILE"
echo "You can tail the log with: tail -f $LOG_FILE"
echo "----------------------------------------"

# Start expo and log output
npx expo start 2>&1 | tee "$LOG_FILE"