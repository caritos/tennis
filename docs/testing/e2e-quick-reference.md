# E2E Testing Quick Reference

## 🚀 Quick Start

```bash
# Start development build (REQUIRED)
npx expo run:ios

# Run all tests
npm run e2e

# Run specific test
maestro test tests/e2e/flows/01-signup-complete.yaml

# Record new test
npm run e2e:record
```

## ⚠️ Critical Requirements

- **ALWAYS use development builds** (`npx expo run:ios`)
- **NEVER use Expo Go** for E2E testing
- **Include testID props** in all interactive components
- **Use field clearing patterns** to prevent text bleeding

## 🎯 Component Standards

### Buttons
```typescript
// ✅ Use native Button
<Button title="Submit" testID="submit-btn" />

// ✅ Or Pressable for custom styling  
<Pressable testID="custom-btn">
```

### Checkboxes
```typescript
// ✅ ONLY use expo-checkbox
import Checkbox from 'expo-checkbox';
<Checkbox value={checked} testID="terms-checkbox" />
```

### TextInputs
```typescript
// ✅ Always include testID
<TextInput testID="email-input" accessibilityLabel="Email" />
```

## 🔧 Text Input Clearing (CRITICAL)

```yaml
# Clear field before new input
- longPressOn:
    id: "email-input"
- tapOn: "Select All"
- eraseText
- waitForAnimationToEnd
- inputText: "new@example.com"
```

## 📝 Test Template

```yaml
appId: com.caritos.tennis
name: "Test Description"
---

- launchApp:
    clearState: true
- waitForAnimationToEnd

- tapOn:
    id: "element-id"
- takeScreenshot: checkpoint
- assertVisible: "Expected Text"
```

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| TextInput not updating | Use development build |
| Text bleeding | Use field clearing patterns |
| Button not tappable | Use native Button/Pressable |
| Element not found | Add testID to component |

## 📁 Directory Structure

```
tests/e2e/flows/
├── 00-navigation.yaml      # Basic flows
├── 01-signup.yaml          # Authentication  
├── 02-validation.yaml      # Form validation
└── 99-debug.yaml          # Debug utilities
```

## 🎬 Best Practices

- Start tests with `clearState: true`
- Add `waitForAnimationToEnd` after navigation
- Take screenshots at key points
- Use descriptive test names
- Handle optional elements with `optional: true`
- Test both success and error scenarios

---
📖 **Full Guide**: `/docs/testing/e2e-testing-guide.md`