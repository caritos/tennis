#!/bin/bash

# Device Matrix Testing Script for App Store Submission
# Based on GitHub Issue #65 - Comprehensive device testing with Maestro

# Add Maestro to PATH
export PATH="$PATH":"$HOME/.maestro/bin"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📱 Device Matrix Testing for App Store Submission"
echo "================================================"
echo "Testing core functionality across different device sizes"
echo ""

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo -e "${RED}❌ Maestro is not installed or not in PATH${NC}"
    echo "Please install Maestro: curl -fsSL 'https://get.maestro.mobile.dev' | bash"
    exit 1
fi

# Device configurations
declare -A DEVICES=(
    ["iPhone SE (3rd gen)"]="iPhone SE (3rd generation)"
    ["iPhone 14"]="iPhone 14"
    ["iPhone 14 Pro Max"]="iPhone 14 Pro Max"
    ["iPhone 15"]="iPhone 15"
    ["iPhone 15 Pro Max"]="iPhone 15 Pro Max"
    ["iPad (10th gen)"]="iPad (10th generation)"
    ["iPad Air (5th gen)"]="iPad Air (5th generation)"
    ["iPad Pro 11-inch"]="iPad Pro (11-inch) (4th generation)"
    ["iPad Pro 12.9-inch"]="iPad Pro (12.9-inch) (6th generation)"
)

# Test files for different device categories
declare -A TEST_FILES=(
    ["iphone-se"]="tests/integration/device-testing/iphone/iphone-se-test.yaml"
    ["iphone-standard"]="tests/integration/device-testing/device-matrix-test.yaml"
    ["iphone-large"]="tests/integration/device-testing/iphone/iphone-pro-max-test.yaml"
    ["ipad"]="tests/integration/device-testing/ipad/ipad-landscape-test.yaml"
)

# Function to start specific device simulator
start_device() {
    local device_name=$1
    echo -e "${BLUE}📱 Starting $device_name...${NC}"
    
    # Close any existing simulators
    killall "Simulator" 2>/dev/null || true
    sleep 2
    
    # Start the specific device
    xcrun simctl boot "$device_name" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Device $device_name not found, using default${NC}"
        return 1
    }
    
    # Open Simulator app
    open -a Simulator
    sleep 3
    
    # Wait for device to be ready
    local timeout=30
    local count=0
    while [ $count -lt $timeout ]; do
        if xcrun simctl list devices | grep "$device_name" | grep -q "Booted"; then
            echo -e "${GREEN}✅ $device_name is ready${NC}"
            return 0
        fi
        sleep 1
        ((count++))
    done
    
    echo -e "${YELLOW}⚠️  Timeout waiting for $device_name${NC}"
    return 1
}

# Function to run test on specific device
run_device_test() {
    local device_display_name=$1
    local device_sim_name=$2
    local test_category=$3
    local test_file=${TEST_FILES[$test_category]}
    
    echo -e "\n${BLUE}🧪 Testing: $device_display_name${NC}"
    echo "Test category: $test_category"
    echo "Test file: $test_file"
    echo "-------------------------------------------"
    
    # Start the device simulator
    if ! start_device "$device_sim_name"; then
        echo -e "${RED}❌ Failed to start $device_sim_name${NC}"
        return 1
    fi
    
    # Ensure test file exists
    if [ ! -f "$test_file" ]; then
        echo -e "${RED}❌ Test file not found: $test_file${NC}"
        return 1
    fi
    
    # Create device-specific screenshot directory
    local device_safe_name=$(echo "$device_display_name" | sed 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]')
    local screenshots_dir="tests/integration/screenshots/device-testing/$device_safe_name"
    mkdir -p "$screenshots_dir"
    
    # Run the test
    local abs_test_file="$(pwd)/$test_file"
    if (cd "$screenshots_dir" && maestro test "$abs_test_file" --debug-output="device-test" --flatten-debug-output); then
        echo -e "${GREEN}✅ $device_display_name: PASSED${NC}"
        echo -e "📸 Screenshots: $screenshots_dir"
        return 0
    else
        echo -e "${RED}❌ $device_display_name: FAILED${NC}"
        echo -e "📸 Debug output: $screenshots_dir"
        return 1
    fi
}

# Main testing function
run_device_matrix() {
    local failed_devices=0
    local total_devices=0
    
    echo -e "${YELLOW}Starting comprehensive device testing...${NC}"
    echo ""
    
    # Test iPhone SE (smallest screen)
    ((total_devices++))
    if ! run_device_test "iPhone SE (3rd gen)" "${DEVICES["iPhone SE (3rd gen)"]}" "iphone-se"; then
        ((failed_devices++))
    fi
    
    # Test standard iPhone sizes
    for device in "iPhone 14" "iPhone 15"; do
        ((total_devices++))
        if ! run_device_test "$device" "${DEVICES[$device]}" "iphone-standard"; then
            ((failed_devices++))
        fi
    done
    
    # Test large iPhone sizes
    for device in "iPhone 14 Pro Max" "iPhone 15 Pro Max"; do
        ((total_devices++))
        if ! run_device_test "$device" "${DEVICES[$device]}" "iphone-large"; then
            ((failed_devices++))
        fi
    done
    
    # Test iPad sizes (critical for App Store approval)
    for device in "iPad (10th gen)" "iPad Air (5th gen)" "iPad Pro 11-inch" "iPad Pro 12.9-inch"; do
        ((total_devices++))
        if ! run_device_test "$device" "${DEVICES[$device]}" "ipad"; then
            ((failed_devices++))
        fi
    done
    
    # Summary
    echo -e "\n${BLUE}📊 Device Testing Summary${NC}"
    echo "=========================="
    echo "Total devices tested: $total_devices"
    echo -e "Passed: ${GREEN}$((total_devices - failed_devices))${NC}"
    echo -e "Failed: ${RED}${failed_devices}${NC}"
    
    if [ $failed_devices -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All device tests passed! Ready for App Store submission.${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Some device tests failed. Fix issues before App Store submission.${NC}"
        exit 1
    fi
}

# Parse command line arguments
case "${1:-all}" in
    "se"|"iphone-se")
        run_device_test "iPhone SE (3rd gen)" "${DEVICES["iPhone SE (3rd gen)"]}" "iphone-se"
        ;;
    "iphone"|"standard")
        run_device_test "iPhone 14" "${DEVICES["iPhone 14"]}" "iphone-standard"
        ;;
    "pro-max"|"large")
        run_device_test "iPhone 14 Pro Max" "${DEVICES["iPhone 14 Pro Max"]}" "iphone-large"
        ;;
    "ipad")
        run_device_test "iPad (10th gen)" "${DEVICES["iPad (10th gen)"]}" "ipad"
        ;;
    "all"|*)
        run_device_matrix
        ;;
esac