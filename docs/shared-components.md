# Shared Components Specification

This document defines all reusable components to follow DRY principles across the tennis app wireframes.

## Form Components

### FormHeader
**Usage**: Consistent header for all form screens
**Files**: All form wireframes (record-match, challenge-modal, etc.)

```typescript
interface FormHeaderProps {
  title: string;
  onBack: () => void;
  rightAction?: React.ReactNode; // Optional settings/help button
}
```

**Examples**:
- `< Back    Record Match`
- `< Back    Challenge`
- `< Back    Edit Profile`

### TextInput
**Usage**: All text input fields across forms
**Files**: authentication-screen, record-match-form, match-invitation-form, etc.

```typescript
interface TextInputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  error?: string;
}
```

### PrimaryButton
**Usage**: All action buttons (Save, Submit, etc.)
**Files**: All wireframes with buttons

```typescript
interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}
```

### AuthButton
**Usage**: Authentication buttons with provider-specific styling
**Files**: authentication-screen

```typescript
interface AuthButtonProps {
  provider: 'email' | 'apple' | 'google';
  onPress: () => void;
  children: string;
}
```

### RadioGroup
**Usage**: Singles/Doubles selection, timing options
**Files**: record-match-form, match-invitation-form, challenge-modal

```typescript
interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  layout?: 'horizontal' | 'vertical';
  title?: string;
}
```

## Tennis-Specific Components

### PlayerCard
**Usage**: Display player with ranking, points, and actions
**Files**: view-all-members, club-details-with-rankings, record-match-form

```typescript
interface PlayerData {
  id: string;
  name: string;
  points: number;
  winRate?: number;
  matchCount?: number;
  isProvisional?: boolean;
}

interface PlayerCardProps {
  player: PlayerData;
  rank?: number;
  showTrophy?: boolean; // For top 3 rankings
  showChallenge?: boolean;
  showStats?: boolean;
  onChallenge?: (playerId: string) => void;
  onPress?: (playerId: string) => void;
}
```

**Visual Examples**:
- `1. [👤] Sarah Wilson 🏆 2,450 pts [Challenge]`
- `4. [👤] Lisa Park 1,620 pts P [Challenge]`

### MatchScoreDisplay
**Usage**: Tennis scores in standard format
**Files**: match-details, record-match-form, profile match history

```typescript
interface MatchSet {
  player1Score: number;
  player2Score: number;
  tiebreak?: string; // e.g., "7-3"
}

interface MatchScoreDisplayProps {
  player1: string;
  player2: string;
  sets: MatchSet[];
  winner?: string;
  editable?: boolean;
  onEdit?: (sets: MatchSet[]) => void;
}
```

**Visual Examples**:
- `6-4, 7-6(7-3)` 
- `3-6, 6-4, 4-6`

### ClubCard
**Usage**: Club display in discovery and member lists
**Files**: club-tab-tennis-focused

```typescript
interface ClubData {
  id: string;
  name: string;
  memberCount: number;
  description?: string;
  distance?: string;
  activityCount?: number;
}

interface ClubCardProps {
  club: ClubData;
  showJoinButton?: boolean;
  showDistance?: boolean;
  activityIndicator?: string; // e.g., "🔴 2 new invitations"
  onPress: (clubId: string) => void;
  onJoin?: (clubId: string) => void;
}
```

**Visual Examples**:
- `🎾 Riverside Tennis Club 0.3 mi`
- `12 members • 🔴 2 new invitations`

### InvitationCard
**Usage**: Challenge invites and "Looking to Play" posts
**Files**: club-details-with-rankings, challenge-modal notifications

```typescript
interface InvitationCardProps {
  type: 'challenge' | 'lookingToPlay';
  fromPlayer: string;
  message?: string;
  matchType: 'singles' | 'doubles';
  date?: string;
  time?: string;
  status: 'pending' | 'accepted' | 'declined' | 'waiting';
  onAccept?: () => void;
  onDecline?: () => void;
  onInterested?: () => void; // For "Looking to Play"
}
```

**Visual Examples**:
- `Challenge from Sarah Wilson`
- `Singles tomorrow - "Want a good match?"`
- `[Decline] [Accept]`

### MatchHistoryItem
**Usage**: Single match in history lists
**Files**: profile-tab-updated, match-details

```typescript
interface MatchData {
  id: string;
  opponent: string;
  result: 'won' | 'lost';
  score: string;
  date: string;
  club: string;
  matchType: 'singles' | 'doubles';
  pointsChange?: number;
}

interface MatchHistoryItemProps {
  match: MatchData;
  showClub?: boolean;
  showDate?: boolean;
  showPoints?: boolean;
  onPress?: (matchId: string) => void;
}
```

**Visual Examples**:
- `vs Sarah Wilson - Won 6-4, 6-2`
- `Riverside Tennis Club • 2 days ago`

## Selection Components

### PlayerSelector
**Usage**: Select players for matches/challenges
**Files**: record-match-form, challenge-modal

```typescript
interface PlayerSelectorProps {
  players: PlayerData[];
  selectedPlayers: string[];
  maxSelections: number;
  allowUnregistered?: boolean;
  onSelectionChange: (playerIds: string[]) => void;
  title?: string;
  subtitle?: string; // e.g., "Teams will be decided when you meet up"
}
```

**Visual Examples**:
- `☑ Lisa Park (auto-selected)`
- `☐ Mike Chen`
- `+ Add Unregistered Opponent`

### ChallengeModal
**Usage**: Complete challenge creation flow
**Files**: challenge-modal

```typescript
interface ChallengeModalProps {
  targetPlayer?: PlayerData; // Pre-selected for singles
  clubMembers: PlayerData[];
  onSendChallenge: (challenge: ChallengeData) => void;
  onCancel: () => void;
  visible: boolean;
}

interface ChallengeData {
  matchType: 'singles' | 'doubles';
  opponents: string[]; // Player IDs
  timing: string;
  message?: string;
}
```

## Status Components

### TrophyIndicator
**Usage**: Top 3 player indicators
**Files**: club-details-with-rankings, view-all-members

```typescript
interface TrophyIndicatorProps {
  rank: number; // 1-3
  size?: 'small' | 'medium' | 'large';
}
```

**Visual Examples**:
- `🏆` (rank 1)
- `🥈` (rank 2) 
- `🥉` (rank 3)

### ProvisionalBadge
**Usage**: "P" indicator for new players
**Files**: view-all-members, club-details-with-rankings

```typescript
interface ProvisionalBadgeProps {
  isProvisional: boolean;
  matchCount?: number; // For tooltip/explanation
}
```

### ActivityIndicator
**Usage**: Activity notifications on clubs
**Files**: club-tab-tennis-focused

```typescript
interface ActivityIndicatorProps {
  count: number;
  type: 'invitations' | 'matches' | 'messages' | 'lookingToPlay';
  color?: 'red' | 'blue' | 'green';
}
```

**Visual Examples**:
- `🔴 2 new invitations`
- `1 looking to play`

## Navigation Components

### HeaderWithBack
**Usage**: Standard header with navigation
**Files**: All screens with back navigation

```typescript
interface HeaderWithBackProps {
  title: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
  showBorder?: boolean;
}
```

### QuickActionButton
**Usage**: Primary action buttons on main screens
**Files**: club-tab-tennis-focused, club-details-with-rankings

```typescript
interface QuickActionButtonProps {
  icon: string;
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'large';
}
```

**Visual Examples**:
- `[+ Record Match]`
- `[+ Looking to Play]`

## Modal Components

### ConfirmationModal
**Usage**: Success/error messages
**Files**: challenge-modal, match recording confirmations

```typescript
interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: string; // ✅ ❌ 🎉
  primaryAction?: {
    title: string;
    onPress: () => void;
  };
  secondaryAction?: {
    title: string;
    onPress: () => void;
  };
  onClose: () => void;
}
```

### StatsCard
**Usage**: Statistics display in grid/list format
**Files**: profile-tab-updated

```typescript
interface StatItem {
  label: string;
  value: string | number;
  subtitle?: string;
}

interface StatsCardProps {
  stats: StatItem[];
  layout?: 'grid' | 'list';
  title?: string;
}
```

**Visual Examples**:
- `Total Points: 2,730`
- `Win Rate: 67% (10-5)`
- `Total Matches: 15`

## Implementation Notes

### Theming Support
All components should support:
- Light/dark mode automatic switching
- Consistent color scheme from `constants/Colors.ts`
- Typography scale for accessibility

### Accessibility
- Proper semantic labels
- Touch target sizes (44px minimum)
- Screen reader support
- Keyboard navigation where applicable

### Tennis Business Logic
Components should understand:
- Tennis scoring system (sets, games, tiebreaks)
- Points calculation and ranking logic
- Honor system permissions (who can edit what)
- Match types (singles vs doubles)

### Testing Requirements
Each component needs:
- Unit tests for all props and states
- Integration tests for user interactions
- Visual regression tests for UI consistency
- Accessibility tests

### Performance Considerations
- Memoization for expensive calculations (ranking displays)
- Lazy loading for large player lists
- Optimized re-renders for live data updates
- Image optimization for player avatars (future)

This shared component library will ensure consistent UI/UX across the entire tennis app while significantly reducing code duplication and maintenance overhead.