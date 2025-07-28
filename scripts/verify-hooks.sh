#!/bin/bash

# Script to verify that Git hooks are properly installed and working
# This helps developers test the hooks without making actual commits

echo "🔍 Verifying Git Hooks Installation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a file exists and is executable
check_hook() {
    local hook_name="$1"
    local hook_path=".husky/$hook_name"
    
    if [ -f "$hook_path" ]; then
        if [ -x "$hook_path" ]; then
            echo -e "✅ $hook_name: ${GREEN}Installed and executable${NC}"
            return 0
        else
            echo -e "⚠️  $hook_name: ${YELLOW}Installed but not executable${NC}"
            echo "   Run: chmod +x $hook_path"
            return 1
        fi
    else
        echo -e "❌ $hook_name: ${RED}Not found${NC}"
        return 1
    fi
}

# Function to test hook execution
test_hook() {
    local hook_name="$1"
    local hook_path=".husky/$hook_name"
    
    echo ""
    echo "🧪 Testing $hook_name execution..."
    echo "────────────────────────────────────────"
    
    if [ -f "$hook_path" ] && [ -x "$hook_path" ]; then
        # Create a test environment
        echo "Running $hook_name in test mode..."
        
        # For pre-commit, we can run the checks directly
        if [ "$hook_name" = "pre-commit" ]; then
            if npm run checks:pre-commit; then
                echo -e "✅ $hook_name test: ${GREEN}PASSED${NC}"
                return 0
            else
                echo -e "❌ $hook_name test: ${RED}FAILED${NC}"
                return 1
            fi
        # For pre-push, we can run the checks directly
        elif [ "$hook_name" = "pre-push" ]; then
            if npm run checks:pre-push; then
                echo -e "✅ $hook_name test: ${GREEN}PASSED${NC}"
                return 0
            else
                echo -e "❌ $hook_name test: ${RED}FAILED${NC}"
                return 1
            fi
        fi
    else
        echo -e "❌ Cannot test $hook_name: ${RED}Hook not found or not executable${NC}"
        return 1
    fi
}

# Check Husky installation
echo "1. Checking Husky installation..."
if [ -d ".husky" ]; then
    echo -e "✅ Husky directory: ${GREEN}Found${NC}"
else
    echo -e "❌ Husky directory: ${RED}Not found${NC}"
    echo "   Run: npx husky init"
    exit 1
fi

# Check npm scripts
echo ""
echo "2. Checking npm scripts..."
if npm run 2>/dev/null | grep -q "checks:pre-commit"; then
    echo -e "✅ NPM scripts: ${GREEN}Properly configured${NC}"
else
    echo -e "❌ NPM scripts: ${RED}Missing required scripts${NC}"
    echo "   Available scripts:"
    npm run 2>/dev/null | head -10
    exit 1
fi

# Check individual hooks
echo ""
echo "3. Checking individual hooks..."
check_hook "pre-commit"
check_hook "pre-push"

# Test hooks (optional, ask user)
echo ""
echo "4. Hook testing (optional)..."
echo "⚠️  Testing hooks will run actual checks and may take time."
read -p "Do you want to test hook execution? (y/N): " test_hooks

if [[ $test_hooks =~ ^[Yy]$ ]]; then
    test_hook "pre-commit"
    echo ""
    test_hook "pre-push"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Hook Verification Summary:"
echo ""
echo "Pre-Commit Hook: Runs on every commit"
echo "  - ESLint (code quality)"
echo "  - TypeScript (type checking)"  
echo "  - Unit tests"
echo ""
echo "Pre-Push Hook: Runs on every push"
echo "  - All pre-commit checks"
echo "  - Integration tests"
echo "  - E2E tests (if available)"
echo ""
echo "💡 To manually run checks:"
echo "  npm run checks:pre-commit  # Quick checks"
echo "  npm run checks:pre-push    # Full checks"
echo "  npm run checks:all         # All including E2E"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"