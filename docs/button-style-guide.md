# Button Style Guide

## Standard Button Styles

All buttons in the Tennis Club app should follow these consistent styles:

### Button Properties
- **Border Radius**: 12px
- **Padding**: 
  - Small: 8px vertical, 16px horizontal
  - Medium: 12px vertical, 24px horizontal  
  - Large: 16px vertical, 32px horizontal
- **Font Size**:
  - Small: 14px
  - Medium: 16px
  - Large: 18px
- **Font Weight**: 600 (semi-bold)
- **Active Opacity**: 0.8

### Button Variants

#### Primary Button (Main Actions)
```tsx
<TouchableOpacity
  style={[
    styles.button,
    { backgroundColor: colors.tint }
  ]}
  onPress={handlePress}
  activeOpacity={0.8}
>
  <ThemedText style={styles.buttonText}>
    Button Text
  </ThemedText>
</TouchableOpacity>
```

#### Secondary Button (Alternative Actions)
```tsx
<TouchableOpacity
  style={[
    styles.button,
    styles.secondaryButton,
    { borderColor: colors.tint }
  ]}
  onPress={handlePress}
  activeOpacity={0.8}
>
  <ThemedText style={[styles.buttonText, { color: colors.tint }]}>
    Button Text
  </ThemedText>
</TouchableOpacity>
```

### Standard Button Styles
```tsx
const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.8,
  },
});
```

### Implementation Example

Here's how the "Create Account" button was standardized:

**Before (Native Button):**
```tsx
<Button
  title="Create Account"
  onPress={handleSubmit}
  color={colors.tint}
/>
```

**After (Standardized TouchableOpacity):**
```tsx
<TouchableOpacity
  style={[
    styles.submitButton,
    { backgroundColor: isLoading ? colors.tabIconDefault : colors.tint },
    isLoading && styles.submitButtonDisabled
  ]}
  onPress={handleSubmit}
  disabled={isLoading}
  activeOpacity={0.8}
>
  <ThemedText style={styles.submitButtonText}>
    {isLoading ? 'Creating Account...' : 'Create Account'}
  </ThemedText>
</TouchableOpacity>
```

### Components to Update

The following components need to be updated to use the standard button styles:

1. **WelcomeScreen.tsx** - "Get started" button
2. **SignInScreen.tsx** - "Sign In" button
3. **CreateClubForm.tsx** - "Create Club" and "Cancel" buttons
4. **MatchRecordingForm.tsx** - "Save Match" and "Cancel" buttons
5. **Various modal buttons** - All confirmation/action buttons

### Migration Steps

1. Replace `Button` components with `TouchableOpacity`
2. Apply the standard button styles
3. Use `ThemedText` for button text
4. Add `activeOpacity={0.8}` for consistent press feedback
5. Handle disabled states with opacity changes
6. Ensure minimum height of 56px for large buttons, 48px for medium

### Color Usage

- **Primary Actions**: `colors.tint` background, white text
- **Secondary Actions**: Transparent background, `colors.tint` border and text
- **Disabled State**: `colors.tabIconDefault` with reduced opacity
- **Text Links**: No background, `colors.tint` text with underline

This ensures a consistent, professional look across all interactive elements in the app.