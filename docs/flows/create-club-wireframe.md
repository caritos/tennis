# Create Club Flow - Wireframes (Code-Based)

## Overview
The Create Club flow is accessed from the Discover Clubs section and consists of a single form screen that creates a new tennis club. Based on the actual CreateClubForm.tsx component.

## User Flow Diagram

```
┌─────────────────┐
│   Home Tab      │
│ (Discover       │
│  Clubs)         │
└────────┬────────┘
         │ Tap "Create Club"
         ▼
┌─────────────────┐
│  Create Club    │
│     Form        │
│ (create-club.   │
│     tsx)        │
└────────┬────────┘
         │ Submit/Cancel
         ▼
┌─────────────────┐
│ Back to Home    │
│ Tab with new    │
│ club listed     │
└─────────────────┘
```

---

## Entry Points

### From Home Tab - Discover Clubs Section
The "Create Club" button appears in the Discover Clubs section when users want to create a new tennis community.

---

## Screen 1: Create Club Form (/create-club)

```
┌─────────────────────────────────────┐
│ Status Bar                     9:41 │
├─────────────────────────────────────┤
│  ← Back      Create Club            │
├─────────────────────────────────────┤
│                                     │
│  [General Error Banner if present]  │
│  ┌─────────────────────────────┐   │
│  │ ⚠ You must be signed in to  │   │
│  │   create a club              │   │
│  └─────────────────────────────┘   │
│                                     │
│  Club Name                          │
│  ┌─────────────────────────────┐   │
│  │ Riverside Tennis Club       │   │
│  └─────────────────────────────┘   │
│  [Error: Club name is required]    │
│                                     │
│  Description                        │
│  ┌─────────────────────────────┐   │
│  │ A friendly community club   │   │
│  │ for players of all levels...│   │
│  │                              │   │
│  └─────────────────────────────┘   │
│  [Error: Description is required]  │
│                                     │
│  Zip Code                           │
│  ┌─────────────────────────────┐   │
│  │ 94102                       │   │
│  └─────────────────────────────┘   │
│  [Error: Please enter valid zip]   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        Create Club          │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Components:
- **Header**: Back button (chevron-back icon) + "Create Club" title
- **General Error Banner**: iOS system red background with white text (appears when user not signed in)
- **Form Fields** (iOS HIG Enhanced):
  - **Club Name**: Single line text input with placeholder "Riverside Tennis Club"
    - Auto-capitalizes words, return key type "next"
    - Accessibility hint: "Enter the name of your tennis club"
  - **Description**: Multi-line text area (60px height) with placeholder "A friendly community club for players of all levels..."
    - Auto-capitalizes sentences, return key type "next" 
    - Accessibility hint: "Describe your tennis club and what makes it special"
  - **Zip Code**: Number pad keyboard input with placeholder "94102"
    - Max length 10 characters (5+4 format), return key type "done"
    - Can submit form directly, accessibility hint: "Enter the zip code where your club is located"
- **Button**: Single full-width Create Club button with iOS-native styling (rounded corners, shadow)

---

## Screen 2: Form with Validation Errors

```
┌─────────────────────────────────────┐
│ Status Bar                     9:41 │
├─────────────────────────────────────┤
│  ← Back      Create Club            │
├─────────────────────────────────────┤
│                                     │
│  Club Name                          │
│  ┌─────────────────────────────┐   │
│  │                              │   │ (red border)
│  └─────────────────────────────┘   │
│  ⚠ Club name is required            │
│                                     │
│  Description                        │
│  ┌─────────────────────────────┐   │
│  │                              │   │ (red border)
│  │                              │   │
│  └─────────────────────────────┘   │
│  ⚠ Description is required          │
│                                     │
│  Zip Code                           │
│  ┌─────────────────────────────┐   │
│  │ 123                         │   │ (red border)
│  └─────────────────────────────┘   │
│  ⚠ Please enter a valid zip code    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     Create Club (disabled)  │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Error States (iOS HIG Enhanced):
- **Input borders**: Change to iOS system red (#ff3b30) with 1.5px thickness when validation fails
- **Error text**: iOS system red text below each field with warning icon (⚠)
  - Enhanced accessibility with `accessibilityRole="alert"` and live regions
  - Medium font weight (500) for better readability
- **Submit button**: Disabled (gray with no shadow) when form invalid
- **Error messages**:
  - "Club name is required"
  - "Description is required"  
  - "Please enter a valid zip code"

---

## Screen 3: Loading State

```
┌─────────────────────────────────────┐
│ Status Bar                     9:41 │
├─────────────────────────────────────┤
│  ← Back      Create Club            │
├─────────────────────────────────────┤
│                                     │
│  Club Name                          │
│  ┌─────────────────────────────┐   │
│  │ Riverside Tennis Club       │   │ (grayed out)
│  └─────────────────────────────┘   │
│                                     │
│  Description                        │
│  ┌─────────────────────────────┐   │
│  │ A friendly community club...│   │ (grayed out)
│  └─────────────────────────────┘   │
│                                     │
│  Zip Code                           │
│  ┌─────────────────────────────┐   │
│  │ 94102                       │   │ (grayed out)
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Creating Club...       │   │ (disabled)
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Loading States (iOS HIG Enhanced):
- **Button text**: Changes from "Create Club" to "Creating Club..."
- **Button styling**: Shadow removed during loading state for visual feedback
- **Form disabled**: All inputs become non-interactive
- **Submit button**: Grayed out and disabled during submission
- **Accessibility**: Button announces loading state to screen readers

---

## Screen 4: Success → Navigation Back

After successful club creation, the user is navigated back to the home tab using `router.replace('/(tabs)')` where the new club will appear in their clubs list.

---

## Technical Implementation Details

### Form Validation Rules
Based on `validateForm()` function:

1. **Club Name**
   - Required: `!formData.name.trim()`
   - Error: "Club name is required"

2. **Description**  
   - Required: `!formData.description.trim()`
   - Error: "Description is required"

3. **Zip Code**
   - Required: `!formData.zipCode.trim()`
   - Format: Must match `/^\d{5}(-\d{4})?$/` (5 digits or 5+4 format)
   - Error: "Please enter a valid zip code"

### Location Handling
- **Zip Code Mapping**: Uses `getLocationFromZipCode()` function with hardcoded mappings
- **Known Locations**: San Francisco, LA, NYC, Austin, Dallas, Houston
- **Pattern Matching**: Falls back to regional patterns (e.g., 941* → "San Francisco Bay Area, CA")
- **Fallback**: Shows "Zip Code [zipcode]" if no match found

### Navigation Behavior
- **Back Button**: Calls `onCancel()` → `router.back()`
- **Success**: Calls `onSuccess(club)` → `router.replace('/(tabs)')`

### Styling System (iOS HIG Enhanced)
- Uses `CompactStyles` constants for consistent spacing with iOS-native enhancements
- **Colors**: Based on `useColorScheme()` with light/dark theme support
- **Typography**: iOS standard sizes (17px body text, 15px error text)
- **Input Fields**: 10px border radius, subtle shadows (shadowOpacity: 0.05), 14px vertical padding
- **Error State**: iOS system red (#ff3b30) borders and text for validation errors
- **Button**: 12px border radius, enhanced shadows (shadowOpacity: 0.1), 50px minimum height
- **Disabled State**: Gray background with removed shadows for disabled submit button

### API Integration
- **Service**: Uses `ClubService.createClub(clubData)`
- **Data Structure**:
  ```typescript
  {
    name: string (trimmed),
    description: string (trimmed),
    location: string (derived from zip),
    zipCode: string (trimmed),
    lat: number (user location or NYC default),
    lng: number (user location or NYC default),  
    creator_id: string (current user ID)
  }
  ```

### Accessibility (iOS HIG Enhanced)
- **Labels**: All inputs have `accessibilityLabel` and `accessibilityHint` attributes
- **Error Handling**: Error messages have `accessibilityRole="alert"` and `accessibilityLiveRegion="assertive"`
- **Button States**: Submit button announces loading/disabled states to screen readers
- **Form Navigation**: Proper return key handling for seamless field progression
- **Test IDs**: Back button has `testID="back-button"`

---

## Key Differences from Original Wireframes

1. **No Club Type Field**: The actual form doesn't include Public/Private selection
2. **No Location Services**: No GPS location request - only zip code input
3. **Single Action Button**: Full-width Create Club button, no cancel button
4. **Clean Layout**: No location preview for simpler form
5. **General Error Handling**: iOS system red banner for system-level errors (e.g., not signed in)
6. **Single Screen Flow**: No multi-screen wizard - everything on one form
7. **iOS HIG Enhancements**: Native iOS styling, accessibility, and interaction patterns

---

## Future Enhancement Opportunities

Based on the code structure, potential additions could include:
1. **GPS Location**: Add "Use Current Location" button alongside zip code
2. **Club Privacy**: Add public/private toggle  
3. **Photo Upload**: Club banner or logo selection
4. **Court Information**: Specific court details or facilities
5. **Schedule Setup**: Default meeting times during creation