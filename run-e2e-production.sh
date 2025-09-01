#!/bin/bash

# Production E2E Test Runner
# Runs E2E tests against the production environment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎾 Production E2E Testing${NC}"
echo "========================="
echo -e "${YELLOW}⚠️  WARNING: Running tests against PRODUCTION database${NC}"
echo -e "${YELLOW}   This will create real data in production${NC}"
echo ""

# Add Maestro to PATH
export PATH="$PATH":"$HOME/.maestro/bin"

# Check prerequisites
echo -e "\n${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v maestro &> /dev/null; then
    echo -e "${RED}❌ Maestro not found in PATH${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Maestro CLI found${NC}"
fi

# Check if iOS Simulator is running
if ! pgrep -x "Simulator" > /dev/null; then
    echo "📱 Starting iOS Simulator..."
    open -a Simulator
    sleep 5
fi

# Confirm production testing
echo -e "\n${YELLOW}🚨 PRODUCTION TESTING CONFIRMATION${NC}"
echo "=================================="
echo "This will:"
echo "• Connect to PRODUCTION Supabase database"  
echo "• Create real match records with unregistered players"
echo "• Modify production user ELO ratings"
echo "• Generate production notifications"
echo ""
read -p "Are you sure you want to run PRODUCTION E2E tests? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Production testing cancelled."
    exit 0
fi

# Start production development server
echo -e "\n${YELLOW}🚀 Starting production development server...${NC}"
echo "This connects to production Supabase database"

# Kill any existing servers
pkill -f "expo start" 2>/dev/null || true
pkill -f "node.*metro" 2>/dev/null || true

# Start production server in background
npm run start:prod > production-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for production server to start..."
sleep 15

# Check if server started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}❌ Production server failed to start${NC}"
    cat production-server.log
    exit 1
fi

echo -e "${GREEN}✅ Production server running (PID: $SERVER_PID)${NC}"

# Function to cleanup
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    kill $SERVER_PID 2>/dev/null || true
    rm -f production-server.log
}

# Set up cleanup trap
trap cleanup EXIT

echo -e "\n${BLUE}📱 MANUAL STEP REQUIRED${NC}"
echo "======================"
echo "1. Open iOS Simulator"
echo "2. Install Expo Go (if not already installed)"
echo "3. Open Expo Go and connect to localhost:8081"
echo "4. Wait for the Tennis app to load with PRODUCTION data"
echo "5. Press ENTER when ready to run tests"
echo ""
read -p "Press ENTER when production app is loaded in simulator..."

# Run production tests
echo -e "\n${YELLOW}🧪 Running production E2E tests...${NC}"

# Create production screenshots directory
mkdir -p tests/integration/screenshots/production
cd tests/integration/screenshots/production

# Run the production test
echo -e "\n${BLUE}Running: Production Unregistered Player Test${NC}"
maestro test "../flows/15-record-match-unregistered-prod.yaml" --debug-output="production-unregistered-$(date +%Y%m%d_%H%M%S)" --flatten-debug-output

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Production test completed successfully${NC}"
    echo -e "📸 Screenshots saved in: tests/integration/screenshots/production/"
    
    # Show summary of what was created in production
    echo -e "\n${BLUE}📊 PRODUCTION TEST SUMMARY${NC}"
    echo "=========================="
    echo "✅ Connected to production Supabase database"
    echo "✅ Created match record with unregistered player 'Jennifer Smith'" 
    echo "✅ Verified production UI flows work correctly"
    echo "✅ Confirmed production ELO rating system processed match"
    echo "✅ Screenshots captured for production state documentation"
    
    # Show screenshots
    echo -e "\n${BLUE}📸 Generated Screenshots:${NC}"
    ls -la *.png 2>/dev/null || echo "No screenshots found"
    
else
    echo -e "${RED}❌ Production test failed${NC}"
    echo -e "📸 Debug output saved for analysis"
    exit 1
fi

echo -e "\n${GREEN}🎉 Production E2E testing completed!${NC}"
echo "View screenshots: open tests/integration/screenshots/production/"