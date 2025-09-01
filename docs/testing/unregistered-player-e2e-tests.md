# Unregistered Player E2E Tests

## Overview

Two comprehensive E2E tests for recording matches with unregistered players - a core feature that allows users to record matches against people who haven't joined the app yet.

## Test Files

### 1. Complete Flow Test
**File**: `15-record-match-unregistered-player.yaml`
**Duration**: ~5-7 minutes
**Coverage**: Comprehensive testing

**Features Tested**:
- Singles match with unregistered opponent
- Doubles match with multiple unregistered players
- Full UI flow validation
- Score entry with tiebreaks
- Match history verification
- Both navigation patterns

### 2. Quick Test
**File**: `15-record-match-unregistered-quick.yaml`  
**Duration**: ~2-3 minutes
**Coverage**: Core functionality

**Features Tested**:
- Singles match recording
- Unregistered opponent addition
- Basic score entry
- Save verification

## How to Run

### Prerequisites
```bash
# 1. Start the development server
npm start

# 2. Make sure iOS Simulator is running
open -a Simulator

# 3. Install Expo Go on simulator and connect to localhost:8081
```

### Run Tests
```bash
# Quick test (recommended for development)
./run-e2e-simple.sh 15-record-match-unregistered-quick

# Complete test (for comprehensive validation)
./run-e2e-simple.sh 15-record-match-unregistered-player

# Run with full debug output
export PATH="$PATH":"$HOME/.maestro/bin"
maestro test tests/integration/flows/15-record-match-unregistered-quick.yaml --debug-output=unregistered-test
```

## Key User Flow Tested

### 1. Navigation to Match Recording
- From home screen to My Clubs
- Select a club
- Access Record Match form

### 2. Unregistered Player Addition
- Search for opponent by name
- See "Add [Name] as unregistered player" option
- Confirm addition
- Verify player appears in form

### 3. Match Score Entry
- Enter tennis scores (e.g., 6-3, 6-4)
- Handle tiebreak scenarios (7-6)
- Validate score format

### 4. Save and Verification
- Save match successfully
- Return to club details
- Verify match appears in Recent Matches
- Check match history

## Expected Behavior

### Successful Test Indicators
- ✅ "Add [Name] as unregistered player" button appears
- ✅ Unregistered player name shows in form after addition
- ✅ Match saves without errors
- ✅ Match appears in Recent Matches with player name
- ✅ Score displays correctly (e.g., "6-3, 6-4")

### Screenshots Generated
1. `match-form-opened`: Match recording form initial state
2. `unregistered-opponent-added`: After adding unregistered player
3. `scores-entered`: After entering match scores
4. `match-saved-success`: Final verification screen

## Test Data

### Singles Match Example
- **Opponent**: "Mike Thompson" (unregistered)
- **Score**: 6-3, 6-4 (user wins)
- **Match Type**: Singles

### Doubles Match Example  
- **Partner**: "Sam Wilson" (unregistered)
- **Opponents**: "Maria Garcia" & "David Lee" (both unregistered)
- **Score**: 6-4, 4-6, 7-6(7-4) (user team wins)

## Business Value

### Why This Test Matters
1. **Critical User Journey**: Many matches are played with unregistered players
2. **Onboarding Flow**: Helps users build match history before opponents join
3. **Data Integrity**: Ensures unregistered player data is stored correctly
4. **Feature Adoption**: Core differentiator allowing partial participation

### Coverage Areas
- **Database Operations**: Storing matches with unregistered player names
- **UI Interactions**: Search, add, and form validation
- **Score Validation**: Tennis scoring rules and edge cases
- **Navigation Flow**: Complete user journey from start to finish

## Troubleshooting

### Common Issues

**Test fails at opponent selection**
- Check if opponent search input has correct testID
- Ensure "Select Opponent" text is visible
- Try tapping search input directly

**"Add as unregistered player" not appearing**
- Make sure you typed a name that doesn't match existing users
- Wait for search to complete before expecting the button
- Check that search text is not empty

**Score entry fails**
- Verify score input fields have correct testIDs
- Use simple valid scores (6-0, 6-1, 6-2, 6-3, 6-4, 7-5, 7-6)
- Allow time for validation between set entries

**Match doesn't save**
- Ensure all required fields are filled
- Check that scores are valid tennis scores
- Allow extra time for save operation (use longer timeout)

### Debug Commands
```bash
# View test screenshots
open tests/integration/screenshots/

# Check specific test results
cd tests/integration/screenshots/15-record-match-unregistered-quick
ls -la

# Re-run with verbose output
maestro test tests/integration/flows/15-record-match-unregistered-quick.yaml --flatten-debug-output
```

## Integration with Development Workflow

### When to Run These Tests
- **After match recording changes**: Any MatchRecordingForm.tsx modifications
- **Before releases**: Ensure core functionality works
- **Bug verification**: Reproduce unregistered player issues
- **Feature development**: Test new match-related features

### CI/CD Integration
```bash
# Add to automated testing pipeline
npm run e2e 15-record-match-unregistered-quick

# Or include in full regression suite
npm run e2e
```

## Related Documentation
- [Match Recording Feature Guide](../features/match-recording.md)
- [Match Claiming System](../features/match-claiming-system.md)
- [E2E Testing Guide](./e2e-testing-guide.md)
- [E2E Quick Reference](./e2e-quick-reference.md)