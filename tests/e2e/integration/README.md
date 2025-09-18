# End-to-End Tests with Maestro

This directory contains automated end-to-end tests for the Tennis app using Maestro.

## Setup

1. **Install Maestro** (already done):
   ```bash
   curl -fsSL "https://get.maestro.mobile.dev" | bash
   ```

2. **Add to PATH** (add to your ~/.zshrc or ~/.bash_profile):
   ```bash
   export PATH="$PATH":"$HOME/.maestro/bin"
   ```

## Recording Tests

1. **Start your iOS Simulator** with your app running:
   ```bash
   npm run ios
   ```

2. **Launch Maestro Studio** to record actions:
   ```bash
   maestro studio
   ```
   This opens a web interface where you can:
   - See your device screen
   - Record actions by clicking on elements
   - Add assertions and waits
   - Export flows as YAML files

3. **Save recorded flows** to the `flows/` directory

## Running Tests

Run a single test:
```bash
maestro test flows/login-flow.yaml
```

Run all tests:
```bash
maestro test flows/
```

Run with detailed output:
```bash
maestro test flows/login-flow.yaml --debug
```

## Test Structure

Each test flow is a YAML file with:
- `appId`: Your app bundle identifier
- `name`: Test name
- Steps: Actions like tap, scroll, assert

Example flow:
```yaml
appId: com.yourcompany.tennis
name: Login Flow
---
- launchApp
- tapOn: "Sign In"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "password123"
- tapOn: "Login"
- assertVisible: "Welcome"
```

## Best Practices

1. **Use meaningful test names** that describe the user journey
2. **Add waits** for async operations
3. **Use assertions** to verify expected states
4. **Keep flows focused** - one user journey per file
5. **Use variables** for test data that might change

## Continuous Integration

Add to your CI pipeline:
```bash
maestro test flows/ --format junit --output test-results.xml
```