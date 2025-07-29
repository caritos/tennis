# Tennis Club Design System & Component Library

## Overview

This document outlines the complete UI component library and design system for the Tennis Club app. All components follow consistent theming, accessibility standards, and React Native best practices.

## 🎨 Design Principles

### Core Principles
- **Consistency**: Unified visual language across all components
- **Accessibility**: Screen reader support and proper contrast ratios
- **Theming**: Automatic light/dark mode support
- **Performance**: Optimized for smooth mobile experience
- **Reusability**: Modular components that can be composed together

### Color System
Colors are managed through `@/constants/Colors.ts` with automatic theme switching:
- **Primary (Tint)**: Brand color for CTAs and highlights
- **Background**: Main background color
- **Text**: Primary text color
- **Tab Icon Default**: Secondary text and inactive elements

## 📱 Component Categories

### 1. Layout Components

#### ThemedView
**Purpose**: Base container with automatic theme support
**Usage**: Replace standard View for themed backgrounds
```tsx
<ThemedView style={styles.container}>
  {/* Content */}
</ThemedView>
```

#### ThemedText
**Purpose**: Text with automatic theme support and typography variants
**Variants**: default, title, defaultSemiBold, subtitle, link
```tsx
<ThemedText type="title">Main Title</ThemedText>
<ThemedText type="subtitle">Subtitle text</ThemedText>
```

### 2. Form Components

#### FormHeader
**Purpose**: Consistent header pattern with back button and title
**Usage**: Top of forms and detail screens
```tsx
<FormHeader 
  title="Create Account"
  onBack={() => router.back()}
/>
```

#### EmailSignInForm / EmailSignUpForm
**Purpose**: Authentication forms with validation
**Features**: Real-time validation, loading states, accessibility
```tsx
<EmailSignUpForm 
  onSubmit={handleSignUp}
  isLoading={loading}
/>
```

### 3. Tennis-Specific Components

#### TennisScoreDisplay
**Purpose**: Professional tournament-style score display
**Features**: Winner highlighting, tiebreak notation, match completion
```tsx
<TennisScoreDisplay 
  player1Name="John Doe"
  player2Name="Jane Smith"
  sets={matchSets}
  isComplete={true}
  winner="John Doe"
/>
```

#### ScoreBox
**Purpose**: Individual score display with multiple variants
**Variants**: default, outlined, filled
**States**: winner, loser, current set, tiebreak
```tsx
<ScoreBox score="6" isWinner={true} size="large" />
<TiebreakScoreBox score="7" />
<WinnerScoreBox score="6" />
```

#### TennisScoreEntry
**Purpose**: Interactive score entry form
**Features**: Live preview, validation, tiebreak support
```tsx
<TennisScoreEntry 
  player1Name="Player 1"
  player2Name="Player 2"
  onScoreChange={setMatchSets}
  showPreview={true}
/>
```

#### PlayerCard
**Purpose**: Display player information in rankings and lists
**Features**: Rankings, stats, contact options, challenge buttons
```tsx
<PlayerCard 
  player={playerData}
  showRanking={true}
  showStats={true}
  onChallengePress={handleChallenge}
/>
```

### 4. Club & Social Components

#### ClubCard
**Purpose**: Display club information in discovery and lists
**Features**: Member count, location, join/leave functionality
```tsx
<ClubCard 
  club={clubData}
  onJoin={handleJoin}
  showJoinButton={true}
/>
```

#### InvitationCard
**Purpose**: Display challenges and match invitations
**Types**: challenge, looking_to_play, match_invitation
**Features**: Accept/decline actions, status indicators
```tsx
<InvitationCard 
  invitation={invitationData}
  onAccept={handleAccept}
  onDecline={handleDecline}
  showActions={true}
/>
```

#### LookingToPlaySection
**Purpose**: Match invitation functionality within clubs
**Features**: Create invitations, view responses
```tsx
<LookingToPlaySection 
  clubId={club.id}
  onInvitationSent={handleSuccess}
/>
```

#### ClubRankings
**Purpose**: Display ranked member lists with trophy indicators
**Features**: Top 3 highlighting, detailed stats
```tsx
<ClubRankings 
  clubId={club.id}
  maxItems={10}
  showTrophies={true}
/>
```

### 5. Notification Components

#### NotificationBanner
**Purpose**: Animated banner notifications
**Types**: success, error, warning, info
**Features**: Auto-dismiss, action buttons, slide animations
```tsx
// Used via NotificationContext
const { showSuccess, showError } = useNotification();
showSuccess('Match saved!', 'Your match has been recorded.');
showError('Network error', 'Please check your connection.');
```

#### NotificationContext
**Purpose**: Global notification state management
**Usage**: Wrap app with provider, use hook in components
```tsx
// In _layout.tsx
<NotificationProvider>
  <App />
</NotificationProvider>

// In components
const { showNotification } = useNotification();
```

### 6. Modal & Dialog Components

#### ConfirmDialog
**Purpose**: Confirmation dialogs replacing Alert.alert()
**Types**: info, warning, error, success, question
**Variants**: Primary, danger, success confirm buttons
```tsx
<ConfirmDialog 
  visible={showDialog}
  type="warning"
  title="Delete Match?"
  message="This action cannot be undone."
  onConfirm={handleDelete}
  onCancel={() => setShowDialog(false)}
  confirmVariant="danger"
/>

// Convenience components
<DeleteConfirmDialog 
  visible={showDelete}
  title="Delete Club?"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

#### ChallengeFlowModal
**Purpose**: Multi-step challenge creation flow
**Features**: Player selection, match details, confirmation
```tsx
<ChallengeFlowModal 
  visible={show}
  clubId={club.id}
  onClose={handleClose}
  onSuccess={handleSuccess}
/>
```

### 7. Utility Components

#### SyncStatusIndicator
**Purpose**: Show offline queue sync status
**Features**: Pending count, network status, manual retry
```tsx
<SyncStatusIndicator />
```

#### AppleSignInButton
**Purpose**: Native Apple Sign In with consistent styling
**Features**: Platform detection, error handling
```tsx
<AppleSignInButton 
  onSuccess={handleSuccess}
  onError={handleError}
  disabled={loading}
/>
```

## 🛠 Usage Patterns

### Component Composition
Components are designed to work together:
```tsx
<ThemedView style={styles.container}>
  <FormHeader title="Club Rankings" onBack={goBack} />
  
  <PlayerCard 
    player={topPlayer}
    showRanking={true}
    onChallengePress={() => showChallengeModal(player)}
  />
  
  <InvitationCard 
    invitation={pendingChallenge}
    onAccept={acceptChallenge}
    onDecline={declineChallenge}
  />
</ThemedView>
```

### Theming Integration
All components automatically adapt to light/dark themes:
```tsx
const colorScheme = useColorScheme();
const colors = Colors[colorScheme ?? 'light'];

// Components use theme colors automatically
<PlayerCard player={data} /> // Adapts to current theme
```

### Accessibility Standards
- All interactive components have proper ARIA labels
- Touch targets meet minimum 44px requirement
- Screen reader compatibility
- Keyboard navigation support where applicable

### Error Handling
Replace all Alert.alert() usage with UI-based notifications:
```tsx
// ❌ Don't use
Alert.alert('Error', 'Something went wrong');

// ✅ Use instead
const { showError } = useNotification();
showError('Error', 'Something went wrong');
```

## 📦 Component Status

### ✅ Complete Components
- ThemedText, ThemedView (base theming)
- FormHeader (navigation pattern)
- TennisScoreDisplay (professional score display)  
- NotificationBanner + Context (UI notifications)
- ClubCard (club discovery)
- PlayerCard (rankings and member lists)
- InvitationCard (challenges and invitations)
- ScoreBox (themed score display)
- ConfirmDialog (modal confirmations)
- All Alert.alert() replaced with UI notifications

### 🎯 Design System Benefits
- **Consistency**: Unified visual language
- **Maintainability**: Centralized styling and behavior
- **Accessibility**: Built-in screen reader support
- **Performance**: Optimized components with proper memoization
- **Developer Experience**: TypeScript definitions and clear APIs
- **Theme Support**: Automatic light/dark mode switching

## 📝 Development Guidelines

### Component Creation Checklist
- [ ] TypeScript interfaces for all props
- [ ] Automatic theme support via useColorScheme
- [ ] Accessibility labels and roles
- [ ] Proper error boundaries
- [ ] Loading and disabled states
- [ ] Responsive design considerations
- [ ] Documentation and usage examples

### Styling Standards
- Use StyleSheet.create for performance
- Follow themed color system (no hardcoded colors)
- Consistent spacing using multiples of 4px
- Shadow and elevation for cards and modals
- Border radius: 8px (small), 12px (medium), 16px (large)

This design system ensures a consistent, accessible, and maintainable UI across the entire Tennis Club application.