#!/bin/bash

# E2E Test Runner Script
# Runs all E2E tests and captures results

set -e

echo "🎾 Tennis Club E2E Test Suite"
echo "============================"
echo ""

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "❌ Maestro is not installed. Please install it first:"
    echo "curl -Ls https://get.maestro.mobile.dev | bash"
    exit 1
fi

# Directory containing test flows
TEST_DIR="$(dirname "$0")/flows"
RESULTS_DIR="$(dirname "$0")/results"
SCREENSHOTS_DIR="$RESULTS_DIR/screenshots"

# Create results directories
mkdir -p "$RESULTS_DIR"
mkdir -p "$SCREENSHOTS_DIR"

# Results file
RESULTS_FILE="$RESULTS_DIR/test-results-$(date +%Y%m%d-%H%M%S).txt"

# Counter for tests
TOTAL=0
PASSED=0
FAILED=0

echo "📱 Starting iOS Simulator..."
echo ""

# Function to run a single test
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file" .yaml)
    
    echo "🧪 Running: $test_name"
    echo "----------------------------------------" | tee -a "$RESULTS_FILE"
    echo "Test: $test_name" | tee -a "$RESULTS_FILE"
    echo "Time: $(date)" | tee -a "$RESULTS_FILE"
    
    TOTAL=$((TOTAL + 1))
    
    # Run the test and capture output
    if maestro test "$test_file" 2>&1 | tee -a "$RESULTS_FILE"; then
        echo "✅ PASSED: $test_name" | tee -a "$RESULTS_FILE"
        PASSED=$((PASSED + 1))
    else
        echo "❌ FAILED: $test_name" | tee -a "$RESULTS_FILE"
        FAILED=$((FAILED + 1))
        
        # Capture screenshot on failure
        echo "📸 Capturing screenshot for failed test..."
        xcrun simctl io booted screenshot "$SCREENSHOTS_DIR/${test_name}-failure.png" 2>/dev/null || true
    fi
    
    echo "" | tee -a "$RESULTS_FILE"
}

# Run all tests in order
echo "🚀 Running E2E Tests..." | tee "$RESULTS_FILE"
echo "======================" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

for test_file in "$TEST_DIR"/*.yaml; do
    if [ -f "$test_file" ]; then
        run_test "$test_file"
        
        # Small delay between tests
        sleep 2
    fi
done

# Summary
echo "📊 Test Summary" | tee -a "$RESULTS_FILE"
echo "===============" | tee -a "$RESULTS_FILE"
echo "Total Tests: $TOTAL" | tee -a "$RESULTS_FILE"
echo "Passed: $PASSED ✅" | tee -a "$RESULTS_FILE"
echo "Failed: $FAILED ❌" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

if [ $FAILED -gt 0 ]; then
    echo "⚠️  Some tests failed. Check $RESULTS_FILE for details." | tee -a "$RESULTS_FILE"
    echo "📸 Screenshots saved in: $SCREENSHOTS_DIR" | tee -a "$RESULTS_FILE"
    exit 1
else
    echo "🎉 All tests passed!" | tee -a "$RESULTS_FILE"
fi

echo ""
echo "📄 Full results saved to: $RESULTS_FILE"