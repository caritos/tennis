# Test Coverage Guide

This guide explains how to achieve and maintain 100% test coverage using the comprehensive testing system.

## Quick Start

```bash
# Analyze current coverage
npm run coverage:analyze

# Start monitoring for real-time updates
npm run coverage:monitor

# Run tests with 100% coverage requirement
npm run test:100-coverage

# Generate coverage gate report for CI/CD
npm run coverage:gateway
```

## Understanding Coverage Metrics

### Coverage Types

1. **Statement Coverage**: Percentage of executed statements
2. **Branch Coverage**: Percentage of executed branches (if/else, switch, etc.)
3. **Function Coverage**: Percentage of called functions
4. **Line Coverage**: Percentage of executed lines

### Quality Score

Beyond percentage coverage, the system calculates a quality score:

- **Coverage Level** (40%): Raw coverage percentage
- **Consistency** (20%): How evenly coverage is distributed across files
- **Branch Coverage** (30%): Quality of conditional logic testing
- **Test Distribution** (10%): Percentage of files with any tests

## Achieving 100% Coverage

### Step 1: Baseline Assessment

```bash
# Set initial baseline
npm run coverage:baseline

# Analyze current state
npm run coverage:analyze
```

Review the generated reports to identify:
- Files with low coverage
- Missing branch coverage
- Untested functions
- Quality improvement areas

### Step 2: Address Coverage Gaps

The system identifies problem areas automatically:

```javascript
// Example coverage gap identification
{
  "problemAreas": [
    {
      "type": "low_coverage",
      "file": "/components/PlayerCard.tsx", 
      "coverage": "67.5",
      "severity": "major"
    },
    {
      "type": "metric_specific",
      "file": "/services/matchService.ts",
      "metric": "branches", 
      "coverage": "45.2",
      "severity": "critical"
    }
  ]
}
```

### Step 3: Write Targeted Tests

#### Component Testing Example

```typescript
// tests/unit/components/PlayerCard.test.tsx
describe('PlayerCard', () => {
  // Test all props combinations
  it('renders with minimal props', () => {
    render(<PlayerCard player={mockPlayer} />);
    expect(screen.getByText(mockPlayer.name)).toBeTruthy();
  });

  // Test conditional rendering
  it('shows looking to play indicator when available', () => {
    const availablePlayer = { ...mockPlayer, isLookingToPlay: true };
    render(<PlayerCard player={availablePlayer} />);
    expect(screen.getByText('🎾 Looking to play')).toBeTruthy();
  });

  // Test error handling
  it('handles missing stats gracefully', () => {
    const playerWithoutStats = { ...mockPlayer, stats: undefined };
    render(<PlayerCard player={playerWithoutStats} />);
    expect(screen.getByText('No matches played yet')).toBeTruthy();
  });

  // Test interactions
  it('calls onPress when card is pressed', () => {
    const mockOnPress = jest.fn();
    render(<PlayerCard player={mockPlayer} onPress={mockOnPress} />);
    fireEvent.press(screen.getByTestId('player-card'));
    expect(mockOnPress).toHaveBeenCalledWith(mockPlayer);
  });
});
```

#### Service Testing Example

```typescript
// tests/unit/services/matchService.test.ts
describe('matchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test successful operations
  it('records match successfully', async () => {
    mockSupabase.from.mockReturnValue(mockChain);
    mockChain.insert.mockResolvedValue({ data: mockMatch, error: null });
    
    const result = await matchService.recordMatch(matchData);
    
    expect(result).toEqual(mockMatch);
    expect(mockChain.insert).toHaveBeenCalledWith(matchData);
  });

  // Test error scenarios
  it('throws error when database fails', async () => {
    mockChain.insert.mockResolvedValue({ 
      data: null, 
      error: { message: 'Database error' } 
    });
    
    await expect(
      matchService.recordMatch(matchData)
    ).rejects.toThrow('Database error');
  });

  // Test edge cases
  it('prevents self-match recording', async () => {
    const selfMatchData = {
      ...matchData,
      player1Id: 'user-1',
      player2Id: 'user-1'
    };
    
    await expect(
      matchService.recordMatch(selfMatchData)
    ).rejects.toThrow('Cannot record match against yourself');
  });
});
```

### Step 4: Monitor Progress

Use real-time monitoring to track improvement:

```bash
# Start monitoring
npm run coverage:monitor

# Make changes to code/tests
# Monitor will automatically analyze changes
```

## Coverage Strategies

### 1. Component Coverage

**Target Areas**:
- All prop combinations
- Conditional rendering logic
- User interactions (onPress, onChange, etc.)
- Error states and loading states
- Accessibility features

**Example Checklist**:
- [ ] Renders with required props
- [ ] Renders with optional props
- [ ] Handles missing/null props
- [ ] Shows loading state
- [ ] Shows error state
- [ ] Handles user interactions
- [ ] Accessibility labels work
- [ ] Responsive behavior

### 2. Service Coverage

**Target Areas**:
- All public methods
- Error handling paths
- Edge cases and validation
- Different parameter combinations
- Authentication scenarios

**Example Checklist**:
- [ ] Success scenarios
- [ ] Database errors
- [ ] Network failures
- [ ] Invalid parameters
- [ ] Authentication failures
- [ ] Permission denials
- [ ] Concurrent operations

### 3. Hook Coverage

**Target Areas**:
- State changes
- Effect cleanup
- Different parameter values
- Loading and error states
- Custom hook interactions

### 4. Integration Coverage

**Target Areas**:
- Complete user workflows
- Service integration points
- Real-time features
- Data consistency
- Error propagation

## Common Coverage Challenges

### Challenge 1: Async Operations

```typescript
// ❌ Incomplete coverage - missing error case
it('loads data successfully', async () => {
  const result = await loadData();
  expect(result).toBeDefined();
});

// ✅ Complete coverage - success and error cases
describe('loadData', () => {
  it('loads data successfully', async () => {
    mockApi.get.mockResolvedValue({ data: mockData });
    const result = await loadData();
    expect(result).toEqual(mockData);
  });

  it('handles loading errors', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));
    await expect(loadData()).rejects.toThrow('Network error');
  });
});
```

### Challenge 2: Conditional Logic

```typescript
// ❌ Missing branch coverage
const getPlayerStatus = (player) => {
  if (player.isActive) {
    return 'active';
  }
  return 'inactive';
};

// ✅ Complete branch coverage
describe('getPlayerStatus', () => {
  it('returns active for active players', () => {
    expect(getPlayerStatus({ isActive: true })).toBe('active');
  });

  it('returns inactive for inactive players', () => {
    expect(getPlayerStatus({ isActive: false })).toBe('inactive');
  });
});
```

### Challenge 3: Complex State Logic

```typescript
// Test all state transitions
describe('useChallenge', () => {
  it('transitions through all states', () => {
    const { result } = renderHook(() => useChallenge());
    
    // Initial state
    expect(result.current.status).toBe('idle');
    
    // Loading state
    act(() => {
      result.current.createChallenge(challengeData);
    });
    expect(result.current.status).toBe('loading');
    
    // Success state
    act(() => {
      // Trigger success
    });
    expect(result.current.status).toBe('success');
    
    // Error state
    act(() => {
      result.current.createChallenge(invalidData);
    });
    expect(result.current.status).toBe('error');
  });
});
```

## Monitoring and Maintenance

### Daily Monitoring

```bash
# Check coverage health
npm run coverage:analyze

# Review any regressions
npm run coverage:gateway
```

### Weekly Review

1. Analyze coverage trends
2. Review quality score changes
3. Address any persistent coverage gaps
4. Update coverage baselines if needed

### Before Releases

```bash
# Full coverage validation
npm run test:orchestrate:release

# Ensure no regressions
npm run coverage:gateway
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Coverage Gate
on: [push, pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Run Tests with Coverage
        run: npm run test:coverage
        
      - name: Coverage Analysis
        run: npm run coverage:analyze
        
      - name: Coverage Gate
        run: npm run coverage:gateway
        
      - name: Upload Coverage Reports
        uses: actions/upload-artifact@v3
        with:
          name: coverage-reports
          path: tests/reports/coverage/
```

### Coverage Badge

Add to README.md:
```markdown
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
```

## Troubleshooting

### Issue: Coverage Appears Stuck

```bash
# Clear coverage cache
rm -rf coverage/
npm run test:coverage

# Check for excluded files
# Review jest.config.js collectCoverageFrom
```

### Issue: Quality Score Low Despite High Coverage

Review the quality factors:
- **Consistency**: Some files have 100%, others have 0%
- **Branch Coverage**: Focus on conditional logic testing
- **Test Distribution**: Ensure all files have some tests

### Issue: Flaky Coverage Results

```bash
# Use monitoring to identify patterns
npm run test:monitor

# Check for race conditions in tests
# Review async/await usage
```

## Advanced Techniques

### Property-Based Testing

```typescript
import fc from 'fast-check';

it('validates all possible inputs', () => {
  fc.assert(
    fc.property(fc.string(), fc.integer(), (name, score) => {
      const result = validatePlayer({ name, score });
      expect(typeof result).toBe('boolean');
    })
  );
});
```

### Mutation Testing

```bash
# Install mutation testing
npm install --save-dev stryker-js

# Run mutation tests to verify test quality
npx stryker run
```

### Coverage Exclusions

```javascript
// In code - exclude from coverage
/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}

// In jest config - exclude files
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/test-utils/**',
]
```

## Conclusion

100% coverage is achievable with:

1. **Systematic approach**: Use the monitoring tools to identify gaps
2. **Quality focus**: Aim for meaningful tests, not just coverage
3. **Continuous monitoring**: Watch for regressions in real-time  
4. **Strategic testing**: Cover all paths, states, and interactions
5. **Team discipline**: Make coverage a team responsibility

The comprehensive testing system provides all the tools needed to achieve and maintain 100% coverage with high quality.