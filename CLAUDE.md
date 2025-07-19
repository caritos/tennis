# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### TypeScript
- Strict mode is enabled
- Use `@/` prefix for absolute imports (e.g., `import { Colors } from '@/constants/Colors'`)

### Styling
- Use React Native StyleSheet for component styles
- Leverage themed components for automatic dark/dark mode support
- Platform-specific styles can be applied using Platform.select()

### Navigation
- Uses React Navigation with bottom tabs
- Navigation is type-safe through Expo Router
- Add new screens by creating files in the appropriate directory under `/app`

## Testing
No testing framework is currently configured. When adding tests, consider:
- Jest with React Native Testing Library for unit/integration tests
- Detox or Maestro for E2E testing

## Platform-Specific Considerations
- iOS: Haptic feedback and blur effects are available
- Android: Ensure proper permissions in app.json when needed
- Web: Some native features may require web-specific implementations