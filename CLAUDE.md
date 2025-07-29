# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

[... existing content remains unchanged ...]

## Memories and Notes

- Worked on initial setup of the project with Expo Router and Supabase integration
- Implemented basic authentication flow using Supabase client
- Set up project guidelines and development best practices
- Configured E2E testing with Maestro for critical user journeys
- Added club details screen with rankings and recent matches display
- Fixed multiple authentication and database sync issues
- Implemented professional tennis score display component
- Added new memory about changelog updates and ongoing development progress
- Completed sign-up and solution flow integration with comprehensive onboarding experience, focusing on frictionless user registration and immediate app value

### E2E Testing Experience & Solutions (2025-07-29)

**Critical Issues Discovered and Fixed:**

1. **iOS Password Autofill Interference (Issue #30)**
   - **Problem**: "Automatic Strong Password" overlay blocked E2E text input in secureTextEntry fields
   - **Solution**: Changed TextInput properties: `autoComplete="new-password"` and `textContentType="none"`
   - **Status**: ✅ RESOLVED

2. **Account Creation Navigation Timing (Issue #31)**
   - **Problem**: Users remained on signup form after account creation due to auth state timing
   - **Solution**: Added auth state confirmation before navigation in `email-signup.tsx`
   - **Code**: Wait for `supabase.auth.getSession()` to confirm user exists before `router.replace('/')`
   - **Status**: ✅ RESOLVED

3. **Keyboard Covering Create Account Button**
   - **Problem**: On-screen keyboard hid the submit button after form input
   - **Solution**: Added scroll commands in E2E tests to dismiss keyboard and reveal button
   - **Pattern**: Use `- scroll` between form input and button tap
   - **Status**: ✅ RESOLVED

4. **SecureTextEntry E2E Incompatibility (Issue #35)**
   - **Problem**: Maestro `inputText` doesn't trigger `onChangeText` events in secureTextEntry fields
   - **Root Cause**: Password state remains empty, causing "Passwords do not match" validation errors
   - **Solution**: Conditional secureTextEntry for E2E environments
   - **Code**: `secureTextEntry={!isE2EEnvironment}` where `isE2EEnvironment` detects test data
   - **Status**: ✅ PARTIALLY RESOLVED (text input bleeding between fields remains)

**Key Learnings:**
- **ALWAYS use Development Builds** (`npx expo run:ios`) instead of Expo Go for reliable E2E testing
- **Real React Native components required**: Native Button, Checkbox work better than custom components
- **Maestro limitations**: Text input can bleed between fields in rapid succession
- **Password testing strategy**: Disable secureTextEntry for automated testing environments
- **Form validation timing**: Add delays between field inputs for complex forms

**E2E Test Patterns That Work:**
```yaml
# Proper field input sequence
- tapOn: id: "field-input"
- inputText: "value"
- waitForAnimationToEnd  # Important for secureTextEntry fields

# Keyboard dismissal before button tap
- scroll
- tapOn: id: "submit-button"

# E2E environment detection
# Use test-specific emails/names to trigger non-secure mode
```

**Files Modified:**
- `components/EmailSignUpForm.tsx`: Added E2E environment detection
- `app/email-signup.tsx`: Added auth state confirmation before navigation
- `tests/integration/flows/*.yaml`: Added proper scrolling and timing patterns

### Integration Testing Directory Structure

**MANDATORY: All integration tests must be placed in `/tests/integration/`**

**Directory Structure:**
```
/tests/integration/
├── flows/                     # Maestro E2E test flows (.yaml files)
│   ├── 01-signup-reliable.yaml
│   ├── 02-validation-testing.yaml
│   └── 03-terms-validation-isolated.yaml
├── screenshots/               # Test screenshots and debug output
├── utils/                     # Reusable E2E test patterns
│   └── common-actions.yaml
├── run-all-tests.sh          # Test runner script
└── setup-ios-simulator.sh   # iOS setup script
```

**When Working with Maestro:**
- **All test flows**: Create in `/tests/integration/flows/`
- **Test utilities**: Place in `/tests/integration/utils/`
- **Screenshots**: Automatically saved to `/tests/integration/screenshots/`
- **Test execution**: Use `./scripts/run-e2e-tests.sh` (points to correct directory)

**Running Tests:**
```bash
# Run all integration tests
./scripts/run-e2e-tests.sh

# Run specific test
./scripts/run-e2e-tests.sh signup-reliable

# Run from integration directory
cd tests/integration && maestro test flows/01-signup-reliable.yaml
```

**File Naming Convention:**
- `01-signup-reliable.yaml` - Core user signup flow
- `02-validation-testing.yaml` - Form validation testing
- `03-terms-validation-isolated.yaml` - Specific isolated tests
- Use leading numbers for execution order when needed

## Task Management & Project Organization

**MANDATORY: All tasks, bugs, and features MUST be managed through GitHub Issues.**

### GitHub Issues Workflow

**Creating Issues:**
```bash
# Create new issue
gh issue create --title "Issue title" --body "Description"

# Create issue with labels
gh issue create --title "Fix login bug" --body "Details..." --label "bug"

# Create feature request
gh issue create --title "Add dark mode" --body "User story..." --label "enhancement"
```

**Managing Issues:**
```bash
# List all open issues
gh issue list

# View specific issue
gh issue view #123

# Close completed issue
gh issue close #123

# Assign issue to yourself
gh issue edit #123 --add-assignee @me
```

**Issue Labels:**
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to docs
- `e2e-testing` - End-to-end testing related
- `priority-high` - Critical issues that block development
- `priority-medium` - Important but not blocking
- `priority-low` - Nice to have improvements

### Task Organization Rules

1. **NO TodoWrite Tool**: Never use Claude's TodoWrite tool - rely exclusively on GitHub Issues
2. **Issue Granularity**: Break large features into small, actionable issues
3. **Clear Acceptance Criteria**: Each issue should have clear completion requirements
4. **Link Related Issues**: Use "Related to #123" or "Fixes #456" in descriptions
5. **Status Updates**: Comment on issues with progress updates

### Current Open Issues

Use `gh issue list` to see all current tasks. Key areas being tracked:
- **E2E Testing Reliability** (Issues #35, #37, #38)
- **Authentication Bugs** (Issues #27, #28, #30, #33)
- **Core Infrastructure** (Issues #3, #26, #36)

### Working with Issues

**Before Starting Work:**
1. Check `gh issue list` for current priorities
2. Assign yourself to the issue you're working on
3. Comment on the issue when you start work

**During Development:**
1. Reference issue numbers in commit messages: "Fix password validation (resolves #35)"
2. Update issue with progress or blockers
3. Link any related discoveries or new issues

**After Completion:**
1. Ensure all acceptance criteria are met
2. Close issue with `gh issue close #123`
3. Update any related documentation

This approach ensures all project work is visible, trackable, and collaboratively managed through GitHub's native issue system.
