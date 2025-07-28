# Automated Checks & Git Hooks

This document describes the comprehensive automated checking system implemented with Git hooks to enforce code quality and prevent problematic commits/pushes.

## 🚨 Zero Tolerance Policy

**ALL checks must pass. No exceptions.**

- ❌ **Commits are blocked** if pre-commit checks fail
- ❌ **Pushes are blocked** if pre-push checks fail  
- ✅ **Green builds only** - no compromises on quality

## 📋 Check Types

### Pre-Commit Checks (Fast Feedback)
Runs on every `git commit` - designed for immediate feedback:

1. **ESLint** - Code quality and style
2. **TypeScript** - Type checking
3. **Unit Tests** - Fast component and utility tests

**Estimated time: 30-60 seconds**

### Pre-Push Checks (Comprehensive)
Runs on every `git push` - comprehensive validation:

1. **ESLint** - Code quality and style
2. **TypeScript** - Type checking  
3. **Unit Tests** - Fast component and utility tests
4. **Integration Tests** - Database and service integration
5. **E2E Tests** - End-to-end user flows (if Maestro available)

**Estimated time: 2-5 minutes**

## 🛠️ Available NPM Scripts

### Quick Checks
```bash
npm run checks:quick      # Lint + TypeScript only
npm run checks:fix        # Auto-fix linting issues + TypeScript
```

### Full Validation
```bash
npm run checks:pre-commit # Pre-commit level checks
npm run checks:pre-push   # Pre-push level checks  
npm run checks:all        # All checks including E2E
```

### Individual Components
```bash
npm run lint              # ESLint check
npm run lint:fix          # ESLint auto-fix
npm run type-check        # TypeScript validation
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:all          # Unit + Integration tests
npm run e2e               # E2E tests
npm run e2e:check         # Check if E2E is available
```

## 🔧 Hook Management

### Verify Installation
```bash
npm run verify:hooks      # Check hook installation and test
```

### Manual Hook Testing
```bash
# Test pre-commit checks without committing
npm run checks:pre-commit

# Test pre-push checks without pushing  
npm run checks:pre-push
```

## 📁 File Structure

```
.husky/
├── pre-commit           # Fast feedback on commit
├── pre-push            # Comprehensive checks on push
└── _/                  # Husky internals

scripts/
├── check-maestro.sh    # Verify E2E test availability
├── verify-hooks.sh     # Test hook installation
└── run-e2e-tests.sh   # Run E2E tests (existing)
```

## 🚀 Getting Started

### First Time Setup
```bash
# Install dependencies (includes husky)
npm install

# Hooks are automatically installed via 'prepare' script
# Verify installation
npm run verify:hooks
```

### Daily Workflow

#### Before Committing
```bash
# Optional: Run quick checks manually
npm run checks:quick

# Make your commit - hooks run automatically
git commit -m "Your message"
```

#### Before Pushing
```bash
# Optional: Run full checks manually
npm run checks:pre-push

# Push - hooks run automatically
git push
```

## 🔍 Troubleshooting

### Commit Blocked
```bash
❌ Pre-commit checks FAILED. Commit blocked.

# Fix issues automatically where possible
npm run checks:fix

# Or fix manually and retry
git commit -m "Your message"
```

### Push Blocked
```bash
❌ Pre-push checks FAILED. Push blocked.

# Run full check suite to see all issues
npm run checks:all

# Fix issues and retry
git push
```

### E2E Tests Failing
```bash
# Check if Maestro is properly set up
npm run e2e:check

# Start simulator/emulator first
npx expo run:ios     # or run:android

# Verify E2E tests manually
npm run e2e
```

### Skip Hooks (Emergency Only)
```bash
# Skip pre-commit (NOT RECOMMENDED)
git commit --no-verify -m "Emergency fix"

# Skip pre-push (NOT RECOMMENDED)  
git push --no-verify
```

**⚠️ Use `--no-verify` only in genuine emergencies. Fix issues properly in follow-up commits.**

## 📊 Check Details

### ESLint Rules
- Code style consistency
- Best practices enforcement
- React/React Native specific rules
- TypeScript integration

### TypeScript Validation
- Strict type checking
- No implicit any
- Proper interface definitions
- Import/export validation

### Unit Tests
- Component rendering
- Hook behavior  
- Utility functions
- Service layer logic

### Integration Tests
- Database operations
- API service calls
- Component interactions
- State management

### E2E Tests  
- Complete user workflows
- Authentication flows
- Match recording
- Club management

## 🎯 Benefits

### For Developers
- **Immediate feedback** - catch issues before they reach CI/CD
- **Consistent quality** - automated enforcement of standards
- **Reduced debugging** - fewer integration issues
- **Confidence** - know your code works before pushing

### For Team
- **Reliable builds** - master branch always stable
- **Faster reviews** - pre-validated code
- **Reduced CI costs** - fewer failed builds
- **Better collaboration** - consistent code style

## 📈 Performance

### Pre-Commit (Fast)
- **Target**: < 60 seconds
- **Optimized for**: Developer workflow
- **Runs**: Essential checks only

### Pre-Push (Thorough)  
- **Target**: < 5 minutes
- **Optimized for**: Comprehensive validation
- **Runs**: Full test suite

### Caching
- Jest test caching enabled
- TypeScript incremental compilation
- ESLint cache for faster linting

## 🔒 Enforcement

### Zero Tolerance Policy
1. **No bypassing** without explicit emergency justification
2. **All checks must pass** - no partial success
3. **Immediate blocking** - fail fast on first error
4. **Clear feedback** - detailed error reporting

### Exception Handling
- **Emergency bypasses** logged and tracked
- **Follow-up required** for any bypassed checks
- **Team notification** for --no-verify usage

## 📝 Maintenance

### Adding New Checks
1. Add npm script in `package.json`
2. Update pre-commit or pre-push hook
3. Test with `npm run verify:hooks`
4. Update this documentation

### Modifying Existing Checks
1. Test changes locally first
2. Update relevant npm scripts
3. Test with team before merging
4. Monitor hook performance

---

**Remember: These hooks are your safety net. Embrace them for higher code quality! 🚀**