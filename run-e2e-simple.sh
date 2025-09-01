#!/bin/bash

# Add Maestro to PATH
export PATH="$PATH":"$HOME/.maestro/bin"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🧪 Running E2E Test: $1"

if [ -z "$1" ]; then
    echo -e "${RED}Usage: ./run-e2e-simple.sh <test-name>${NC}"
    echo "Example: ./run-e2e-simple.sh 00-simple-navigation"
    exit 1
fi

TEST_FILE="tests/integration/flows/$1.yaml"

if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}Test file not found: $TEST_FILE${NC}"
    exit 1
fi

# Run test with debug output
cd tests/integration/screenshots
maestro test "../flows/$1.yaml" --debug-output="$1" --flatten-debug-output

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test passed: $1${NC}"
    echo -e "📸 Screenshots saved in: tests/integration/screenshots/$1/"
else
    echo -e "${RED}❌ Test failed: $1${NC}"
    echo -e "📸 Debug output in: tests/integration/screenshots/$1/"
fi
