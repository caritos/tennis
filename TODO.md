# TODO - Tennis League App

## High Priority Tasks

### Testing Setup
- [ ] Install Jest and React Native Testing Library
- [ ] Configure Jest for React Native and TypeScript
- [ ] Set up test structure and naming conventions
- [ ] Write first test for Match model (RED phase)
- [ ] Implement Match model to pass test (GREEN phase)
- [ ] Refactor Match model code (REFACTOR phase)
- [ ] Write tests for SQLite database operations

### Git Hooks Setup
- [ ] Install husky for Git hooks management
- [ ] Create pre-push hook to run all tests (Jest + Maestro)
- [ ] Configure pre-push hook to block push if tests fail
- [ ] Add npm script for running all tests in sequence

### Core Features
- [ ] Install and configure SQLite for local data storage
- [ ] Design database schema for players, matches, and leagues
- [ ] Implement local match scoring functionality with SQLite

### Environment & Configuration (Expo Best Practices)
- [ ] Convert app.json to app.config.js for environment variables
- [ ] Set up environment files (.env.development, .env.production)
- [ ] Install @react-native-async-storage/async-storage for Supabase auth

### Security Setup (Supabase Best Practices)
- [ ] Create Supabase client singleton with TypeScript
- [ ] Enable Row Level Security (RLS) on all Supabase tables
- [ ] Create RLS policies for player data access
- [ ] Create RLS policies for league-based match access

## Medium Priority Tasks

### Unit/Integration Testing
- [ ] Create test fixtures and factories for matches/players
- [ ] Write integration tests for score calculation logic
- [ ] Set up test database isolation for SQLite tests
- [ ] Add pre-commit hook to run tests

### End-to-End Testing with Maestro
- [ ] Install Maestro CLI for E2E testing
- [ ] Configure Maestro for Expo/React Native project
- [ ] Create .maestro directory and test structure
- [ ] Write first Maestro flow for app launch and navigation
- [ ] Create E2E test for complete match recording flow
- [ ] Write Maestro test for offline match entry and sync

### Backend Integration
- [ ] Set up Supabase account and project
- [ ] Design Supabase schema to mirror local SQLite structure
- [ ] Implement authentication with Supabase Auth
- [ ] Create sync mechanism between local SQLite and Supabase
- [ ] Implement optimistic updates (write local first, sync later)

### Push Notifications (Expo)
- [ ] Install expo-notifications for push notifications
- [ ] Configure push notification permissions for iOS and Android

### Storage & Files (Supabase)
- [ ] Set up Supabase Storage buckets for profile images
- [ ] Configure storage policies for secure file access

### Database Management (Supabase)
- [ ] Install Supabase CLI for migrations and type generation
- [ ] Generate TypeScript types from Supabase schema
- [ ] Set up database migrations workflow

## Low Priority Tasks

### Advanced Testing
- [ ] Configure test coverage reporting
- [ ] Add Maestro tests for league creation and joining
- [ ] Set up Maestro Cloud for CI/CD integration
- [ ] Create Maestro visual regression tests for key screens
- [ ] Add accessibility testing with Maestro

### Advanced Features
- [ ] Add offline queue for pending match submissions
- [ ] Implement real-time league updates using Supabase subscriptions
- [ ] Create league management features (create, join, invite)
- [ ] Add conflict resolution for simultaneous score updates

### App Distribution (Expo)
- [ ] Configure deep linking for app URLs
- [ ] Add app store metadata and privacy policy
- [ ] Set up EAS Build for custom development builds

## Architecture Notes

Following DHH's "Conceptual Compression" philosophy:
- Local-first with SQLite for instant performance
- Minimal backend complexity with Supabase
- TDD approach for code quality and confidence
- Progressive enhancement from local to cloud features

## Testing Strategy

### Three Levels of Testing:
1. **Unit Tests (Jest)**: Test business logic, models, and utilities
2. **Integration Tests (Jest + Testing Library)**: Test component interactions and SQLite operations
3. **E2E Tests (Maestro)**: Test complete user flows across the entire app

### Maestro E2E Testing Benefits:
- Tests real user workflows on actual devices/simulators
- Supports both iOS and Android with single test files
- Visual regression testing capabilities
- Accessibility testing built-in
- Can test offline/online scenarios