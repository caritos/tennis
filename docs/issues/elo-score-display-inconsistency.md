# ELO Score Display Inconsistency Issue

## 🐛 **Problem Description**

ELO scores are displayed inconsistently between different tabs in the club view:

- **Members Tab**: Shows `1200` for new players
- **Matches Tab**: Shows `New Player` for the same users

## 📸 **Evidence**

User screenshot shows:
- Match invitation: `1200 • New Player` 
- Match results: Player shows different rating format

## 🔍 **Root Cause Analysis**

### **Members Tab Display** (`ClubMembers.tsx:177`)
```typescript
<ThemedText style={[styles.rankScore, { color: colors.tint }]}>
  {member.eloRating || 1200}{' '}  // ❌ Shows 1200 as fallback
</ThemedText>
```

### **Matches Tab Display** (`DoublesMatchParticipants.tsx:61`)
```typescript
const formatEloRating = (rating?: number, gamesPlayed?: number) => {
  if (!rating) {
    return { 
      rating: getInitialRating(), 
      tier: 'New Player',        // ✅ Shows "New Player" text
      color: '#2196F3', 
      provisionalText: ' (New)' 
    };
  }
  // ... rest of formatting logic
};
```

### **The Issue**
- **Members tab**: Uses simple fallback `|| 1200`
- **Matches tab**: Uses proper `formatEloRating()` function with tier labels

## 📊 **Data Flow**

1. **New users** have `elo_rating: null` in database
2. **Members tab** converts `null` to `1200` number
3. **Matches tab** converts `null` to `"New Player"` text
4. **Inconsistent display** confuses users

## 🔧 **Solution Options**

### **Option 1: Standardize on formatEloRating() (Recommended)**
Update `ClubMembers.tsx` to use the same formatting function:

```typescript
// Import the formatting utility
import { formatEloRating } from '@/utils/eloRating';

// Replace simple fallback with proper formatting
const eloInfo = formatEloRating(member.eloRating, member.gamesPlayed);

// Display with tier information
<ThemedText style={[styles.rankScore, { color: eloInfo.color }]}>
  {eloInfo.rating} • {eloInfo.tier}{eloInfo.provisionalText}
</ThemedText>
```

### **Option 2: Create Centralized ELO Display Component**
```typescript
// components/EloRating.tsx
export function EloRating({ rating, gamesPlayed, style }) {
  const eloInfo = formatEloRating(rating, gamesPlayed);
  return (
    <ThemedText style={[style, { color: eloInfo.color }]}>
      {eloInfo.rating} • {eloInfo.tier}{eloInfo.provisionalText}
    </ThemedText>
  );
}
```

## 🎯 **Files to Update**

1. **`components/club/ClubMembers.tsx`** - Main fix location
2. **`utils/eloRating.ts`** - Ensure consistent formatting
3. **Other components** - Audit for similar inconsistencies:
   - `components/MatchInvitationForm.tsx`
   - `components/ClubRankings.tsx`
   - Any other ELO display locations

## ⚡ **Priority**

**Medium Priority** - User experience issue but not blocking functionality

## 🧪 **Testing Required**

- [ ] Verify consistent display in Members tab
- [ ] Verify consistent display in Matches tab  
- [ ] Test with new users (no matches played)
- [ ] Test with provisional users (< 5 matches)
- [ ] Test with established users (5+ matches)

## 📝 **Acceptance Criteria**

- [ ] All tabs show same format for ELO ratings
- [ ] New players consistently show "New Player" designation
- [ ] Provisional players show "(Provisional)" indicator
- [ ] Colors match between different views
- [ ] No hardcoded fallback to `1200` without context