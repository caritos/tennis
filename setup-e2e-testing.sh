#!/bin/bash

# E2E Testing Setup Script
# This script sets up a complete E2E testing environment for the Tennis app

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎾 Setting up E2E Testing Environment${NC}"
echo "=================================="

# Add Maestro to PATH for this session
export PATH="$PATH":"$HOME/.maestro/bin"

# 1. Check Prerequisites
echo -e "\n${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v maestro &> /dev/null; then
    echo -e "${RED}❌ Maestro not found in PATH${NC}"
    echo "Run: export PATH=\"\$PATH\":\"\$HOME/.maestro/bin\""
    exit 1
else
    echo -e "${GREEN}✅ Maestro CLI found${NC}"
fi

if ! command -v xcrun &> /dev/null; then
    echo -e "${RED}❌ Xcode command line tools not found${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Xcode tools found${NC}"
fi

# 2. Setup iOS Simulator
echo -e "\n${YELLOW}📱 Setting up iOS Simulator...${NC}"

# Find available simulators
SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone 16 Pro" | head -1 | grep -o '([^)]*)' | tr -d '()')

if [ -z "$SIMULATOR_ID" ]; then
    echo -e "${RED}❌ No suitable iPhone simulator found${NC}"
    echo "Please install iOS Simulator via Xcode"
    exit 1
fi

echo -e "${GREEN}✅ Using iPhone 16 Pro: $SIMULATOR_ID${NC}"

# Boot simulator if not running
if ! xcrun simctl list devices booted | grep -q "$SIMULATOR_ID"; then
    echo "🚀 Booting simulator..."
    xcrun simctl boot "$SIMULATOR_ID"
    sleep 5
fi

# Open Simulator app
open -a Simulator

# 3. Create Testing Environment
echo -e "\n${YELLOW}🏗️  Creating testing environment...${NC}"

# Create screenshots directory
mkdir -p tests/integration/screenshots
echo -e "${GREEN}✅ Screenshots directory created${NC}"

# Create a simple test runner script
cat > run-e2e-simple.sh << 'EOF'
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
EOF

chmod +x run-e2e-simple.sh
echo -e "${GREEN}✅ Simple test runner created${NC}"

# 4. Test Maestro Setup
echo -e "\n${YELLOW}🧪 Testing Maestro setup...${NC}"

# Create a minimal test to verify Maestro works
cat > test-simulator-connection.yaml << 'EOF'
appId: com.apple.calculator
---
# Minimal test to verify Maestro can control the simulator

- launchApp
- waitForAnimationToEnd: 
    timeout: 3000
- assertVisible: 
    text: "Calculator"
    optional: true
- takeScreenshot: calculator-test
EOF

# Run the test
if maestro test test-simulator-connection.yaml > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Maestro can control the simulator${NC}"
    rm test-simulator-connection.yaml
else
    echo -e "${YELLOW}⚠️  Maestro test had issues, but setup continues${NC}"
    rm -f test-simulator-connection.yaml
fi

# 5. Display available tests
echo -e "\n${YELLOW}📁 Available E2E Tests:${NC}"
echo "====================="

if [ -d "tests/integration/flows" ]; then
    ls tests/integration/flows/*.yaml | head -10 | while read test; do
        basename "$test" .yaml
    done | sort | while read test; do
        echo "  • $test"
    done
    
    total_tests=$(ls tests/integration/flows/*.yaml | wc -l | tr -d ' ')
    echo -e "\n📊 Total tests available: $total_tests"
fi

# 6. Create quick commands
echo -e "\n${YELLOW}⚡ Quick Commands:${NC}"
echo "=================="
echo -e "Run a test:     ${GREEN}./run-e2e-simple.sh 00-simple-navigation${NC}"
echo -e "List all tests: ${GREEN}ls tests/integration/flows/*.yaml${NC}"
echo -e "Full test suite: ${GREEN}npm run e2e${NC}"

# 7. Alternative Setup Info
echo -e "\n${YELLOW}🔄 Alternative Setups:${NC}"
echo "====================="
echo "For development builds (more reliable but complex):"
echo -e "  ${GREEN}npx expo run:ios${NC} (requires Xcode setup)"
echo ""
echo "For Expo Go (limited but quick):"
echo -e "  ${GREEN}npm start${NC} + install Expo Go on simulator"

echo -e "\n${GREEN}🎉 E2E Testing Environment Ready!${NC}"
echo "================================="
echo ""
echo "Next steps:"
echo "1. If using Expo Go: npm start (then install Expo Go in simulator)"
echo "2. If using dev build: npx expo run:ios"
echo "3. Run tests: ./run-e2e-simple.sh <test-name>"
echo ""
echo -e "${BLUE}Happy Testing! 🚀${NC}"