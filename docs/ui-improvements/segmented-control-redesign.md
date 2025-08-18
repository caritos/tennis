# Segmented Control UI Redesign

## Date: August 18, 2025

## Overview
Fixed visual issues with the segmented control components in the club detail page's Members and Matches tabs. The previous implementation had text overflow issues where button labels were wrapping and extending beyond their boundaries.

## Problem
- Button text was wrapping to multiple lines
- "Ranking" and "Matches" labels were overflowing their containers
- Poor visual separation between buttons
- Inconsistent styling across different filter controls

## Solution

### 1. Visual Improvements
- Added light gray background (`#f5f5f5`) to segmented control containers
- Added subtle border (`#e0e0e0`) around the entire control
- Implemented divider lines between buttons for better visual separation
- Removed individual button borders in favor of right-side dividers

### 2. Text and Sizing Adjustments
- Reduced font size from 12pt to 11pt
- Shortened button labels for better fit:
  - "Ranking" → "Rank"
  - "Matches" → "Games" 
  - "Recent" → "Joined"
- Added `minHeight: 36` to ensure consistent button height
- Reduced padding to optimize space usage
- Added `textAlign: 'center'` to prevent text wrapping

### 3. Color Improvements
- Changed unselected button text from tint color to standard text color
- Maintained white text on selected buttons with tint background
- Improved contrast and readability

## Implementation Details

### Style Changes
```javascript
segmentedControl: {
  flexDirection: 'row',
  borderRadius: 8,
  overflow: 'hidden',
  backgroundColor: '#f5f5f5',
  borderWidth: 1,
  borderColor: '#e0e0e0',
},
segmentButton: {
  flex: 1,
  paddingVertical: 8,
  paddingHorizontal: 8,
  alignItems: 'center',
  justifyContent: 'center',
  borderRightWidth: 1,
  borderRightColor: '#e0e0e0',
  minHeight: 36,
},
segmentButtonText: {
  fontSize: 11,
  fontWeight: '500',
  textAlign: 'center',
},
```

### Component Updates
- Added index mapping to remove right border from last button in each row
- Updated all four segmented controls (member sort, member filter, match type, match date)
- Maintained consistent styling across all filter controls

## Result
The segmented controls now have a clean, iOS-style appearance with proper text containment and improved visual hierarchy. The controls are more compact while remaining easily tappable and readable.

## Files Modified
- `/app/club/[id].tsx` - Updated segmented control styling and labels