# E2E Testing with Maestro

This directory contains all end-to-end tests for the Tennis app using Maestro.

## Structure

```
tests/e2e/
├── flows/              # Maestro test YAML files
├── integration/        # Jest integration test files
├── offline-queue/      # Offline queue integration tests
├── screenshots/        # Test screenshots and debug output
├── device-testing/     # Device-specific test configurations
└── utils/             # Test utilities and helpers
```

## Running Tests

### Maestro E2E Tests
```bash
# Run all Maestro E2E tests
npm run e2e

# Run specific Maestro test
npm run e2e 01-signup-complete

# Record new tests
npm run e2e:record
```

### Jest Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Contact sharing integration test
npm run test:contact-sharing

# Watch mode for integration tests
npm run test:integration:watch
```

## Test Categories

### Core User Flows (01-09)
- `01-signup-complete.yaml` - User registration
- `02-signin-flow.yaml` - Authentication
- `03-create-club.yaml` - Club creation
- `04-join-club.yaml` - Club membership
- `05-record-match.yaml` - Match recording

### Feature Tests (10-19)
- `14-contact-sharing-system.yaml` - Contact sharing
- `15-record-match-unregistered-*.yaml` - Unregistered player flows

### Debug/Development (00, 99)
- `00-*.yaml` - Simple test utilities
- `debug-*.yaml` - Debugging helpers

## Best Practices

1. **Always use development builds** - Never Expo Go for E2E
2. **Include testID props** - All interactive components need testIDs
3. **Clear text fields properly** - Use the standard clearing pattern
4. **Take screenshots** - At key checkpoints for debugging

## Common Issues

| Problem | Solution |
|---------|----------|
| TextInput not updating | Use development build, not Expo Go |
| Text bleeding in fields | Use proper field clearing pattern |
| Button not tappable | Use native Button or Pressable |
| Element not found | Add testID to component |

## Field Clearing Pattern

```yaml
# Standard text field clearing
- longPressOn:
    id: "email-input"
- tapOn: "Select All"
- eraseText
- waitForAnimationToEnd
- inputText: "new@example.com"
```