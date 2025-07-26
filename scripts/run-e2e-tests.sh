#!/bin/bash

# Add Maestro to PATH
export PATH="$PATH":"$HOME/.maestro/bin"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🎾 Running Tennis App E2E Tests with Maestro"
echo "============================================"

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo -e "${RED}❌ Maestro is not installed or not in PATH${NC}"
    echo "Please install Maestro: curl -fsSL 'https://get.maestro.mobile.dev' | bash"
    exit 1
fi

# Check if iOS Simulator is running
if ! pgrep -x "Simulator" > /dev/null; then
    echo "📱 Starting iOS Simulator..."
    open -a Simulator
    sleep 5
fi

# Function to run a single test
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file" .yaml)
    
    echo -e "\n🧪 Running test: ${test_name}"
    echo "----------------------------"
    
    if maestro test "$test_file"; then
        echo -e "${GREEN}✅ ${test_name} passed${NC}"
        return 0
    else
        echo -e "${RED}❌ ${test_name} failed${NC}"
        return 1
    fi
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    # Run all tests
    echo "Running all tests in e2e/flows/"
    
    failed_tests=0
    total_tests=0
    
    for test in e2e/flows/*.yaml; do
        if [ -f "$test" ]; then
            ((total_tests++))
            if ! run_test "$test"; then
                ((failed_tests++))
            fi
        fi
    done
    
    echo -e "\n📊 Test Summary"
    echo "=============="
    echo "Total tests: $total_tests"
    echo -e "Passed: ${GREEN}$((total_tests - failed_tests))${NC}"
    echo -e "Failed: ${RED}${failed_tests}${NC}"
    
    if [ $failed_tests -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed!${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Some tests failed${NC}"
        exit 1
    fi
else
    # Run specific test
    test_path="e2e/flows/$1"
    if [[ ! "$1" =~ \.yaml$ ]]; then
        test_path="${test_path}.yaml"
    fi
    
    if [ -f "$test_path" ]; then
        run_test "$test_path"
    else
        echo -e "${RED}❌ Test file not found: $test_path${NC}"
        exit 1
    fi
fi