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

### Component Development
- Create reusable components in `/components` directory
- Use composition over inheritance
- Build components with configurable props for flexibility
- Example structure:
  - `/components/ui/` - Basic UI elements (buttons, inputs, cards)
  - `/components/tennis/` - Tennis-specific components (score display, match card)
  - `/components/layout/` - Layout components (headers, containers)

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

## Testing
No testing framework is currently configured. When adding tests, follow Expo's testing guide:
- Refer to https://docs.expo.dev/develop/unit-testing/ for Jest setup with Expo
- Use React Native Testing Library as recommended by Expo
- For E2E testing, use Maestro (compatible with Expo Go and development builds)

## Platform-Specific Considerations
- iOS: Haptic feedback and blur effects are available
- Android: Ensure proper permissions in app.json when needed
- Web: Some native features may require web-specific implementations

## Tennis League App Architecture

### Philosophy: DHH's Principles
Following David Heinemeier Hansson's core programming principles:

#### Conceptual Compression
- **Local-first with SQLite**: All data stored locally for instant performance and offline functionality
- **Minimal backend complexity**: Use Supabase only for league-wide sharing, not as primary data store
- **One-person framework**: Architecture simple enough for a single developer to understand and maintain
- **Progressive enhancement**: Start with local functionality, add sync capabilities incrementally

#### DRY (Don't Repeat Yourself)
- **Reusable Components**: Build once, use everywhere (match cards, score displays, player badges)
- **Shared Business Logic**: Tennis scoring rules in one place, used by all features
- **Common Utilities**: Date formatting, score calculations, sync status checks
- **Type Definitions**: Single source of truth for data models across the app

### Data Architecture

#### Local Storage (SQLite)
Primary data store for:
- Match scores and history
- Player profiles
- League information (cached)
- Offline queue for pending syncs
- Personal statistics

#### Cloud Sync (Supabase)
Secondary store for:
- League-wide match results
- Player rankings
- Real-time updates to league members
- Authentication and authorization

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
- Players table
- Matches table (with JSON column for sets/games)
- Leagues table
- League_members junction table
- Stats views (calculated from matches)

**Supabase Best Practices**:
- Use Row Level Security (RLS) policies - see https://supabase.com/docs/guides/auth/row-level-security
- Implement proper indexes for query performance
- Use Supabase Realtime for live updates - see https://supabase.com/docs/guides/realtime
- Follow Supabase auth patterns - see https://supabase.com/docs/guides/auth

This approach embodies "conceptual compression" - the complex distributed system appears as a simple local database to the developer, with sync happening transparently in the background.