#!/bin/bash

# Add Maestro to PATH
export PATH="$PATH":"$HOME/.maestro/bin"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 Running E2E Test: $1"

if [ -z "$1" ]; then
    echo -e "${RED}Usage: ./run-e2e-simple.sh <test-name>${NC}"
    echo "Example: ./run-e2e-simple.sh 00-simple-navigation"
    echo "Production: ./run-e2e-simple.sh 15-record-match-unregistered-prod"
    exit 1
fi

TEST_FILE="tests/integration/flows/$1.yaml"

if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}Test file not found: $TEST_FILE${NC}"
    exit 1
fi

# Check if this is a production test
if [[ "$1" == *"-prod"* ]]; then
    echo -e "${YELLOW}⚠️  WARNING: This is a PRODUCTION test${NC}"
    echo "This will create real data in production database"
    read -p "Continue? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Production test cancelled."
        exit 0
    fi
    
    # Create production screenshots directory
    mkdir -p tests/integration/screenshots/production
    SCREENSHOTS_DIR="tests/integration/screenshots/production"
else
    # Create regular screenshots directory  
    mkdir -p tests/integration/screenshots
    SCREENSHOTS_DIR="tests/integration/screenshots"
fi

# Get absolute path to test file
ABS_TEST_FILE="$(pwd)/$TEST_FILE"

# Run test with debug output from screenshots directory
cd "$SCREENSHOTS_DIR"
maestro test "$ABS_TEST_FILE" --debug-output="$1" --flatten-debug-output

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test passed: $1${NC}"
    echo -e "📸 Screenshots saved in: $SCREENSHOTS_DIR/$1/"
else
    echo -e "${RED}❌ Test failed: $1${NC}"
    echo -e "📸 Debug output in: $SCREENSHOTS_DIR/$1/"
fi
