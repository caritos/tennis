# Test-Driven Development (TDD) Guide

This guide provides comprehensive instructions for implementing TDD practices in the Tennis Club application.

## Table of Contents

1. [TDD Principles](#tdd-principles)
2. [Testing Infrastructure](#testing-infrastructure)
3. [Test Structure](#test-structure)
4. [TDD Workflow](#tdd-workflow)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

## TDD Principles

### Red-Green-Refactor Cycle

TDD follows a strict three-phase cycle:

1. **RED**: Write a failing test first
2. **GREEN**: Write the minimum code to make the test pass
3. **REFACTOR**: Improve the code while keeping tests passing

### Key Benefits

- **Design by Contract**: Tests define what the code should do
- **Living Documentation**: Tests serve as executable specifications
- **Regression Protection**: Changes can't break existing functionality
- **Confidence**: Every line of code is tested and working

## Testing Infrastructure

### Directory Structure

```
tests/
├── setup/
│   ├── testUtils.tsx          # Test utilities and mocks
│   ├── testFactories.ts       # Test data factories
│   └── testDatabase.ts        # Database test utilities
├── unit/
│   ├── components/            # Component unit tests
│   ├── services/             # Service unit tests
│   ├── hooks/                # Custom hook tests
│   └── utils/                # Utility function tests
└── integration/
    ├── flows/                # Complete user flow tests
    └── services/             # Service integration tests
```

### Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch
npm run test:unit:watch
npm run test:integration:watch

# Run with coverage
npm run test:coverage

# Debug failing tests
npm run test:debug
```

## Test Structure

### Test File Naming

- Unit tests: `ComponentName.test.tsx` or `serviceName.test.ts`
- Integration tests: `featureName.integration.test.ts`
- End-to-end tests: `flowName.e2e.test.ts`

### Test Organization

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks and test state
  });

  describe('Feature Group', () => {
    it('should do specific thing when condition exists', () => {
      // Test implementation
    });
  });
});
```

### Describe Block Structure

- Top level: Component/Service/Feature name
- Second level: Feature groups or user stories
- Test names: Should be descriptive and specific

## TDD Workflow

### 1. Write Failing Test (RED)

Start with a failing test that describes the desired behavior:

```typescript
// 1. RED: Write failing test
describe('TennisScoreValidator', () => {
  it('should validate standard tennis scores', () => {
    expect(validateTennisScore('6-4,6-3')).toBe(true);
    expect(validateTennisScore('8-6,6-3')).toBe(false);
  });
});
```

Run the test to confirm it fails:
```bash
npm run test:unit -- --testNamePattern="should validate standard tennis scores"
```

### 2. Make Test Pass (GREEN)

Write the minimum code to make the test pass:

```typescript
export function validateTennisScore(score: string): boolean {
  if (!score) return false;
  
  const sets = score.split(',');
  if (sets.length < 2) return false;
  
  return sets.every(set => {
    const [p1, p2] = set.trim().split('-').map(Number);
    return p1 <= 7 && p2 <= 7 && Math.abs(p1 - p2) <= 2;
  });
}
```

Run the test to confirm it passes:
```bash
npm run test:unit -- --testNamePattern="should validate standard tennis scores"
```

### 3. Refactor (REFACTOR)

Improve the code while keeping tests passing:

```typescript
export function validateTennisScore(score: string): boolean {
  if (!score?.trim()) return false;
  
  const sets = score.split(',').map(s => s.trim());
  if (sets.length < 2) return false;
  
  return sets.every(validateSingleSet);
}

function validateSingleSet(set: string): boolean {
  const [p1, p2] = set.split('-').map(Number);
  if (isNaN(p1) || isNaN(p2)) return false;
  
  // Standard set validation
  if (p1 <= 6 && p2 <= 6) {
    return Math.abs(p1 - p2) >= 2 || (p1 === 6 && p2 === 6);
  }
  
  // 7-x sets (tiebreak scenario)
  if (p1 === 7 || p2 === 7) {
    return Math.abs(p1 - p2) >= 2;
  }
  
  return false;
}
```

Run all tests to ensure nothing broke:
```bash
npm run test:unit
```

### 4. Add More Tests

Continue the cycle by adding more test cases:

```typescript
describe('TennisScoreValidator', () => {
  it('should validate standard tennis scores', () => {
    expect(validateTennisScore('6-4,6-3')).toBe(true);
    expect(validateTennisScore('8-6,6-3')).toBe(false);
  });

  it('should validate tiebreak scores', () => {
    expect(validateTennisScore('7-6,6-4')).toBe(true);
    expect(validateTennisScore('6-7,6-4')).toBe(true);
  });

  it('should reject incomplete matches', () => {
    expect(validateTennisScore('6-4')).toBe(false);
    expect(validateTennisScore('')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(validateTennisScore('6-4,4-6,6-2')).toBe(true);
    expect(validateTennisScore('7-6,7-6')).toBe(true);
  });
});
```

## Best Practices

### Test Quality Guidelines

1. **Tests Should Be FIRST**:
   - **Fast**: Run quickly
   - **Independent**: Don't depend on other tests
   - **Repeatable**: Same result every time
   - **Self-Validating**: Clear pass/fail
   - **Timely**: Written just before implementation

2. **Clear Test Names**: Use descriptive, specific names
   ```typescript
   // Good
   it('should save match to database and return match ID when all data is valid')
   
   // Bad
   it('should save match')
   ```

3. **Arrange-Act-Assert Pattern**:
   ```typescript
   it('should calculate winner correctly for 2-set match', () => {
     // Arrange
     const score = '6-4,6-3';
     
     // Act
     const winner = calculateTennisWinner(score);
     
     // Assert
     expect(winner).toBe('player1');
   });
   ```

### Mock Strategy

1. **Mock External Dependencies**: Services, APIs, databases
2. **Don't Mock What You're Testing**: Test the actual implementation
3. **Use Test Factories**: Generate consistent test data

```typescript
// Use factories for consistent test data
const testMatch = createMatch({
  scores: '6-4,6-3',
  match_type: 'singles',
});

// Mock external services
jest.mock('@/services/supabase');
```

### Database Testing

1. **Use Test Database**: Isolated from development/production
2. **Reset State**: Clean database before each test
3. **Test Real Queries**: Don't mock database layer

```typescript
beforeEach(async () => {
  await setupTestDatabase();
});

afterEach(async () => {
  await teardownTestDatabase();
});
```

## Common Patterns

### Component Testing Pattern

```typescript
describe('MatchRecordingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should submit valid match data', async () => {
    // Arrange
    const mockOnSubmit = jest.fn();
    render(<MatchRecordingForm onSubmit={mockOnSubmit} />);
    
    // Act
    fireEvent.changeText(screen.getByPlaceholderText('Your score'), '6');
    fireEvent.changeText(screen.getByPlaceholderText('Opponent score'), '4');
    fireEvent.press(screen.getByText('Save Match'));
    
    // Assert
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        scores: '6-4',
        // ... other expected data
      });
    });
  });
});
```

### Service Testing Pattern

```typescript
describe('MatchService', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  it('should save match and return ID', async () => {
    // Arrange
    const matchData = createMatch();
    
    // Act
    const result = await matchService.createMatch(matchData);
    
    // Assert
    expect(result.id).toBeTruthy();
    
    // Verify in database
    const saved = await matchService.getMatch(result.id);
    expect(saved.scores).toBe(matchData.scores);
  });
});
```

### Integration Testing Pattern

```typescript
describe('Match Recording Integration', () => {
  it('should record match end-to-end', async () => {
    // Arrange
    const dbManager = await setupTestDatabase();
    render(<MatchRecordingForm clubId="test-club" />);
    
    // Act - Complete form
    fireEvent.press(screen.getByText('Select Opponent'));
    fireEvent.press(screen.getByText('John Doe'));
    // ... complete form
    fireEvent.press(screen.getByText('Save Match'));
    
    // Assert - Check database
    await waitFor(() => {
      const matches = dbManager.getData('matches');
      expect(matches).toHaveLength(1);
      expect(matches[0].opponent2_name).toBe('John Doe');
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **Tests Are Slow**
   - Check for unnecessary database operations
   - Ensure proper mocking of external services
   - Use test factories instead of real API calls

2. **Tests Are Flaky**
   - Add proper `waitFor` for async operations
   - Clear mocks and state between tests
   - Check for race conditions

3. **Mocks Not Working**
   - Ensure mocks are defined before imports
   - Check mock file paths are correct
   - Verify Jest configuration includes all mock patterns

### Debugging Tests

```bash
# Run specific test with debug info
npm run test:debug -- --testNamePattern="specific test name"

# Run with verbose output
npm test -- --verbose

# Run single test file
npm test -- tests/unit/components/MatchHistoryView.test.tsx
```

### Coverage Goals

- **Statements**: 70%+
- **Branches**: 70%+
- **Functions**: 70%+
- **Lines**: 70%+

Critical areas should have higher coverage:
- Business logic: 90%+
- Utility functions: 95%+
- Data validation: 95%+

## Continuous Integration

Tests run automatically on:
- Every commit
- Pull requests
- Before deployment

All tests must pass before code can be merged.

### Pre-commit Hooks

```bash
# Install pre-commit hooks
npm install husky --save-dev

# Add to package.json
{
  "scripts": {
    "pre-commit": "npm run lint && npm test"
  }
}
```

## Next Steps

1. **Write Tests First**: Always start with failing tests
2. **Keep Tests Simple**: One assertion per test when possible
3. **Test Edge Cases**: Error conditions, boundary values
4. **Maintain Tests**: Update tests when requirements change
5. **Review Test Coverage**: Regularly check coverage reports

Remember: Good tests are your safety net. Invest time in writing comprehensive, maintainable tests that will save time and prevent bugs in the long run.