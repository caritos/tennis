# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Primary Documentation Sources

### Expo Documentation
**ALWAYS refer to the official Expo documentation at https://expo.dev for best practices and implementation guidance.** When implementing features or solving problems:
1. Check Expo docs first for recommended approaches
2. Use Expo SDK packages when available instead of third-party alternatives
3. Follow Expo's conventions for project structure and configuration
4. Prefer Expo-specific solutions over generic React Native solutions

### Supabase Documentation
**ALWAYS refer to the official Supabase documentation at https://supabase.com/docs for backend best practices.** When implementing backend features:
1. Check Supabase docs for React Native specific guides: https://supabase.com/docs/guides/getting-started/quickstarts/reactnative
2. Follow Supabase patterns for authentication, real-time subscriptions, and database queries
3. Use Supabase client SDK methods instead of raw SQL when possible
4. Refer to Supabase security best practices for Row Level Security (RLS)

## Project Overview

This is an Expo React Native project that targets iOS, Android, and Web platforms. It uses TypeScript and file-based routing with Expo Router.

### Design Documentation
**Complete wireframes and user flows have been created to document how the app should look and work.** Before implementing any features, always refer to:

- **`/docs/wireframes/`** - Individual screen layouts and UI components
- **`/docs/flows/`** - Complete user interaction flows and multi-step journeys

These documents provide detailed specifications for UI layouts, user interactions, navigation patterns, and feature requirements. All implementation should follow these documented designs to ensure consistency and meet user experience requirements.

## Common Commands

### Development
- `npm start` - Start the Expo development server
- `npm run ios` - Start on iOS simulator
- `npm run android` - Start on Android emulator
- `npm run web` - Start on web browser
- `npx expo start --clear` - Start with cleared cache

### Code Quality
- `npm run lint` - Run ESLint to check code quality
- `npx expo lint --fix` - Auto-fix linting issues

### Project Management
- `npm run reset-project` - Reset to blank project (moves current code to app-example/)

## Architecture Overview

### File-Based Routing
The app uses Expo Router with file-based routing. Routes are defined by the file structure in the `/app` directory:
- `app/(tabs)/` - Tab navigation screens
- `app/_layout.tsx` - Root layout with theme provider and navigation stack
- `app/+not-found.tsx` - 404 error page

### Component Structure
- `/components` - Reusable UI components
  - Platform-specific components use `.ios.tsx` and `.android.tsx` extensions
  - Themed components (ThemedText, ThemedView) automatically adapt to light/dark mode
  
### Navigation Structure (2-Tab Layout)
- **Club Tab**: My clubs, club discovery, club details with rankings, match recording, "Looking to Play"
- **Profile Tab**: Personal tennis stats, match history, club memberships, settings, about section

### Key Design Decisions Made
- **Optimistic Approach**: Auto-join clubs, trust match scores, share contact automatically - assume good intent
- **Unified Rankings**: Single leaderboard combines singles and doubles performance for simplicity
- **Simplified Challenge Flow**: Removed counter-challenges for MVP simplicity
- **Automatic Phone Sharing**: Phone numbers shared automatically after match confirmations
- **Honor System**: Match recorder's score is final, no confirmation/dispute process
- **Real Names Only**: Full names for trust and verification, no nicknames/preferred names
- **Auto-Join Clubs**: Immediate joining with ban capability for problem members
- **Unified Member Rankings**: Single list with trophy icons for top 3 (no separate "top players" section)
- **Date-Only Match Tracking**: No duration or real-time status tracking
- **Scrolling vs Sub-Tabs**: Club details use vertical scrolling instead of sub-navigation
- **Minimal Profile Setup**: Just name, email, phone - no bio or tennis background
  
### Theming
- Color schemes defined in `constants/Colors.ts`
- Automatic light/dark mode detection via `useColorScheme` hook
- Theme provider in root layout applies theme globally

### State Management
Currently uses React's built-in state management. No external state management library is configured.

## Development Guidelines

### Core Principles
- **DRY (Don't Repeat Yourself)**: Create reusable components and utilities to avoid code duplication
- **Component Reusability**: Build atomic, composable components that can be used across screens
- **Shared Logic**: Extract common functionality into custom hooks and utility functions
- **Optimistic Approach**: Assume good intent until proven otherwise - auto-join all clubs, trust match scores, share contact info automatically

### Working Together
- This is always a feature branch - no backwards compatibility needed
- When in doubt, we choose clarity over cleverness
- REMINDER: If this file hasn't been referenced in 30+ minutes, RE-READ IT!
- Avoid complex abstractions or "clever" code. The simple, obvious solution is probably better, and my guidance helps you stay focused on what matters

### Development Partnership
- We're building production-quality code together. Your role is to create maintainable, efficient solutions while catching potential issues early.
- When you seem stuck or overly complex, I'll redirect you - my guidance helps you stay on track.

### Small, Incremental Development
- **ALWAYS break large features into small, testable pieces**
- Each piece should be independently testable and deployable
- Examples of breaking down features:
  - Authentication: First email/password, then Apple Sign In, then Google Sign In
  - Match recording: First store locally, then add sync, then add real-time updates
  - Player discovery: First show all players, then add filtering, then add location-based search
- Write tests for each small piece before moving to the next
- Commit frequently with working, tested code
 
### Component Development
- Create reusable components in `/components` directory
- Use composition over inheritance
- Build components with configurable props for flexibility
- **NEVER use Alert.alert()** - Always use UI-based notifications instead
- Example structure:
  - `/components/ui/` - Basic UI elements (buttons, inputs, cards, notifications)
  - `/components/tennis/` - Tennis-specific components (score display, match card)
  - `/components/layout/` - Layout components (headers, containers)

### UI Notifications (NO Alert.alert())
- **Toast/Snackbar**: For success messages and brief feedback
- **Modal Dialogs**: For confirmations and important decisions
- **Banner Components**: For error messages and warnings
- **Notification Provider**: Global state management for notifications
- All user feedback must use these UI components, never native alerts

### TypeScript
- Strict mode is enabled
- Use `@/` prefix for absolute imports (e.g., `import { Colors } from '@/constants/Colors'`)
- Define shared types in `/types` directory

### Styling
- Use React Native StyleSheet for component styles
- Leverage themed components for automatic dark/dark mode support
- Platform-specific styles can be applied using Platform.select()
- Create shared style utilities in `/styles` directory

### Custom Hooks
- Place reusable hooks in `/hooks` directory
- Examples: `useMatch`, `usePlayer`, `useSyncStatus`
- Encapsulate complex logic that multiple components need

### Navigation
- Uses Expo Router (file-based routing) - see https://docs.expo.dev/router/introduction/
- Navigation is type-safe through Expo Router
- Add new screens by creating files in the appropriate directory under `/app`
- Follow Expo Router conventions for layouts, groups, and dynamic routes

## Testing (TDD Required)

**MANDATORY: Test-Driven Development (TDD)**
- **ALL code must have tests BEFORE implementation**
- **No commits allowed with failing tests**
- **No pushes allowed unless ALL test cases pass**
- Write tests first, then implement the feature
- Red → Green → Refactor cycle

**Testing Framework Setup**
Follow Expo's testing guide for setup:
- Refer to https://docs.expo.dev/develop/unit-testing/ for Jest setup with Expo
- Use React Native Testing Library as recommended by Expo
- For E2E testing, use Maestro (compatible with Expo Go and development builds)

**Critical Test Coverage Required**
- **Match Recording Logic**: Score validation, ranking calculations, points system
- **Club Management**: Creation, joining, member management
- **Challenge System**: Invitations, responses, match confirmations
- **Ranking Calculations**: Points allocation, unified singles/doubles scoring
- **Honor System**: Match editing permissions, participant validation
- **Data Sync**: Local-first with Supabase sync, offline functionality
- **User Authentication**: Sign up, login, profile management

**Test Types**
- **Unit Tests**: Individual functions, hooks, utilities
- **Integration Tests**: Component interactions, API calls, database operations
- **E2E Tests**: Complete user workflows (record match, challenge player, join club)

### AUTOMATED CHECKS ARE MANDATORY
- ALL hook issues are BLOCKING - EVERYTHING must be ✅ GREEN!
- No errors.
- No formatting issues.
- No linting problems.
- Zero tolerance.
- These are not suggestions.
- Fix ALL issues before continuing.

## Platform-Specific Considerations
- iOS: Haptic feedback and blur effects are available
- Android: Ensure proper permissions in app.json when needed
- Web: Some native features may require web-specific implementations

## Tennis Community App Architecture

### App Concept
A tennis club app for finding players and tracking matches within local tennis clubs. Players join clubs in their area to connect with other members.

### Tennis Club Business Logic
**IMPORTANT: This is NOT a traditional tennis league system.**

This app facilitates tennis clubs - groups of people who share a common interest in tennis and want to play with other people. Think of it as a social platform for tennis players to connect and organize matches with rankings for better matchmaking.

**CRITICAL: What "Club" Means in This App**
- **Tennis clubs are COMMUNITIES/GROUPS of players, NOT physical clubhouses**
- **No operating hours, facilities, or physical locations** - these are social groups
- **Members arrange matches at whatever courts they have access to** (public courts, private facilities, etc.)
- **Court tracking excluded from MVP** - focus on player connections, not facility management
- **Think "tennis meetup group" or "tennis community" rather than "country club"**

### Core Features (MVP)
- **Club Creation**: Any authenticated user can create tennis clubs
- **Club Purpose**: Connect tennis players and provide rankings for better matchmaking
- **Member Rankings**: Unified points-based rankings combining all matches (singles and doubles) within each club for compatible opponent matching
- **Visual Ranking Indicators**: Trophy system (🏆🥈🥉) for top 3 players to encourage engagement
- **Match Recording**: Players can record matches against registered or unregistered opponents
- **Challenge System**: Direct player-to-player match invitations with simple accept/decline responses
  - **Simplified Flow**: No counter-challenges in MVP (moved to future)
  - **Optional Decline Reason**: Polite rejection with optional explanation
- **Looking to Play**: Public match posting system for finding partners within clubs
- **Contact Sharing**: Phone number sharing after match confirmations (no WhatsApp in MVP)
- **Score Editing**: Context-aware permissions based on match participation
- **Role Assignment**: All new users get 'player' role with ability to create clubs
- **Honor System**: Unregistered opponents can later claim matches when they join
- **Location-Aware**: Clubs are organized by geographic location to help players find nearby partners
- **Simple Time Tracking**: Matches include date only (no duration tracking)

### User Profile System
- **Real Names**: Full name required for trust and verification (no nicknames/preferred names)
- **Automatic Contact Sharing**: Phone numbers shared automatically after match confirmations
- **Simplified Privacy Controls**: Basic privacy settings without complex statistics visibility options
- **Multi-Club Support**: Players can join multiple clubs with separate rankings per club

### MVP Exclusions (Future Features)
- Weather integration for matches
- WhatsApp integration (phone only for MVP)
- Counter-challenge functionality
- Tournament features
- Advanced analytics and premium features
- Country flags and avatars
- Match duration tracking

### User Roles & Permissions
- **Admin**: Superuser with full system access (manage all clubs, users, etc.)
- **Player**: Regular user who can:
  - Create clubs (gaining basic edit rights for those clubs)
  - Join other clubs as a member
  - Record matches within their clubs
  
Note: Club creation provides basic edit rights only. Community self-polices through automatic reporting system. Any player can create multiple clubs and be a member of others.

### Philosophy: DHH's Principles
Following David Heinemeier Hansson's core programming principles:

#### Conceptual Compression
- **Local-first with SQLite**: All data stored locally for instant performance and offline functionality
- **Minimal backend complexity**: Use Supabase only for community features, not as primary data store
- **One-person framework**: Architecture simple enough for a single developer to understand and maintain
- **Progressive enhancement**: Start with local functionality, add sync capabilities incrementally

#### DRY (Don't Repeat Yourself)
- **Reusable Components**: Build once, use everywhere (player cards, match forms, stats displays)
- **Shared Business Logic**: Tennis scoring rules in one place, used by all features
- **Common Utilities**: Date formatting, score calculations, sync status checks
- **Type Definitions**: Single source of truth for data models across the app

### Data Architecture

#### Local Storage (SQLite)
Primary data store for:
- Your match history
- Player profiles (cached)
- Personal statistics
- Offline match queue
- Recent players

#### Cloud Sync (Supabase)
Secondary store for:
- Community player discovery
- Shared match results
- Player profiles and stats
- Match invitations
- Authentication

**Implementation Note**: Follow Supabase's React Native guide at https://supabase.com/docs/guides/getting-started/quickstarts/reactnative for setup and best practices.

### Implementation Pattern
```
1. Write to local SQLite first (instant UI updates)
2. Queue for sync when online
3. Sync to Supabase in background
4. Subscribe to league updates from other players
5. Update local cache with remote changes
```

### Key Principles
- **Offline-first**: App fully functional without internet at tennis courts
- **Optimistic updates**: Show changes immediately, sync later
- **Simple conflict resolution**: Last write wins for simplicity
- **Data ownership**: Users' devices are source of truth for their matches

### Required Libraries
```bash
npx expo install expo-sqlite @supabase/supabase-js expo-network
```

**Note**: Always use `npx expo install` instead of `npm install` to ensure compatibility with the Expo SDK version.

### Database Schema Approach
Mirror structure between SQLite and Supabase for simplicity:
- Users table (id, full_name, email, role, phone, created_at)
- Clubs table (id, name, location, lat, lng, creator_id, created_at, description)
  - Note: creator_id provides minimal edit rights only, no ownership privileges
- Club_members table (club_id, user_id, joined_at)
- Matches table (id, club_id, player1_id, player2_id, opponent2_name, scores, date, notes, match_type)
  - Note: opponent2_name allows recording matches against unregistered players
  - Note: No time field - date only for casual tennis
- Player_stats view (calculated from all matches per club for unified rankings)
- Match_invitations table (id, club_id, creator_id, match_type, date, time, notes, status)
- Match_invitation_responses table (invitation_id, user_id, response_type, message)
- Looking_to_play_posts table (id, club_id, user_id, match_type, date, time, notes, created_at)
- Unclaimed_matches table (for matches recorded against unregistered opponents)
- Player_reports table (id, reporter_id, reported_user_id, club_id, match_id, report_type, created_at)
- Community_warnings table (id, user_id, warning_count, last_warning_date, status)
- Challenge_invitations table (id, from_user_id, to_user_id, club_id, match_type, preferred_date, message, status)

**Supabase Best Practices**:
- Use Row Level Security (RLS) policies - see https://supabase.com/docs/guides/auth/row-level-security
- Implement proper indexes for query performance
- Use Supabase Realtime for match invitations - see https://supabase.com/docs/guides/realtime
- Follow Supabase auth patterns - see https://supabase.com/docs/guides/auth

This approach embodies "conceptual compression" - the complex distributed system appears as a simple local database to the developer, with sync happening transparently in the background.

## Documentation Structure

### Wireframes (Static Screens)
Located in `/docs/wireframes/` - Individual screen layouts and components:
- `authentication-screen.md` - Complete sign up/sign in flows with email, Apple, Google
- `welcome-screen.md` - Onboarding screen for non-authenticated users
- `club-tab-tennis-focused.md` - Main club discovery tab with tennis-first priority
- `club-details-with-rankings.md` - Club page with singles-primary member rankings
- `view-all-members.md` - Complete member rankings with trophy indicators and challenge buttons
- `doubles-rankings.md` - Separate doubles rankings screen for team-based play
- `profile-tab-updated.md` - User profile with comprehensive tennis stats
- `match-details.md` - Clean match result display (no flags, duration, or weather)
- `record-match-form-updated.md` - Match recording form (date-only, no court tracking)
- `match-invitation-form.md` - "Looking to Play" post creation form
- `about-screen.md` - App information, developer credits, and community stats

### User Flows (Multi-Step Journeys)
Located in `/docs/flows/` - Complete user interaction flows:
- `onboarding-flow.md` - First-time user experience from registration to first match
- `club-creation-flow.md` - Creating new tennis clubs with location
- `club-joining-flow.md` - Discovering and joining clubs (public vs private)
- `match-recording-flow.md` - Recording completed matches with opponent confirmation
- `challenge-flow.md` - Direct player invitations with simplified accept/decline
- `match-invitation-flow.md` - Public "Looking to Play" posting and response system
- `notification-flow.md` - In-app notification system and user engagement
- `profile-management-flow.md` - User profile, privacy, and account management

### Key Design Principles Documented
- Singles-primary ranking system with doubles secondary
- Real names + optional nicknames for community trust
- Phone-only contact sharing (no WhatsApp in MVP)
- Simplified challenge system (no counter-offers)
- Date-only match tracking (no duration)
- Vertical scrolling over sub-tab navigation
- Future features clearly marked and excluded from MVP
