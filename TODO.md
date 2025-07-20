# TODO - Tennis Community App

## High Priority Tasks (MVP Core)

### Navigation & App Structure
- [ ] Create 2-tab bottom navigation (Club Tab, Profile Tab)
- [ ] Implement Club Tab with My Clubs and Discover Clubs sections
- [ ] Create Profile Tab with tennis stats and settings
- [ ] Update app branding to "Tennis Club" theme

### Core Database & Authentication
- [ ] Install and configure SQLite for local data storage
- [ ] Design complete database schema (users, clubs, matches, courts, invitations, rankings)
- [ ] Set up Supabase project with mirrored schema
- [ ] Install and configure authentication (email, Apple, Google Sign In)
- [ ] Create Supabase client singleton with TypeScript
- [ ] Enable Row Level Security (RLS) on all tables

### Club Discovery & Management
- [ ] Install expo-location for user location services
- [ ] Create club creation flow (any player can create)
- [ ] Build club join request system for players
- [ ] Implement distance calculation and location-based club discovery
- [ ] Store latitude/longitude coordinates for clubs
- [ ] Create club card component showing distance

### Match Recording System
- [ ] Create basic match recording form (singles/doubles, score, date, optional court)
- [ ] Add set-by-set score tracking with + Add Set button
- [ ] Support tiebreak notation with parentheses format (7-6 (7-3))
- [ ] Add unregistered opponent option to match recording
- [ ] Store matches locally in SQLite first, sync to Supabase
- [ ] Implement match validation logic

### Club Member Rankings
- [ ] Create club member ranking system based on win percentage
- [ ] Display rankings with visual indicators (🏆🥈🥉) for top 3 players
- [ ] Calculate rankings based on matches within each club only
- [ ] Implement horizontal scroll for members list with View All button
- [ ] Create dedicated View All Members screen with search

### Court Management
- [ ] Create courts table (name, surface type, notes)
- [ ] Allow any club member to add courts to club
- [ ] Add court selection to match recording and invitations
- [ ] Implement horizontal scroll for courts list with count display
- [ ] Create simple court addition form

### "Looking to Play" System
- [ ] Create "Looking to Play" section in club details
- [ ] Build match invitation post form (singles/doubles, court, date, time, notes)
- [ ] Support doubles invitations (up to 4 players total)
- [ ] Implement one-tap match interest response ("I'm Interested")
- [ ] Auto-match responders based on match type (singles=2, doubles=4)
- [ ] Send in-app notifications for match confirmations
- [ ] Add match cancellation functionality

### Challenge System (Direct Player Invitations)
- [ ] Create challenge flow modal for direct player invitations
- [ ] Implement challenge notification system (accept/decline/counter)
- [ ] Add counter-challenge functionality with modified match details
- [ ] Share contact info automatically after challenge acceptance
- [ ] Add phone number/WhatsApp sharing in match confirmations
- [ ] Add contact preference field to user profile

### Profile & Stats System
- [ ] Create user profile screen with comprehensive tennis stats
- [ ] Display win/loss record with percentages
- [ ] Show singles vs doubles breakdown
- [ ] Add total matches played counter
- [ ] Include sets won/lost statistics
- [ ] Show club memberships list
- [ ] Add personal match history to profile page
- [ ] Calculate and display player statistics from match history

### UI Components & Design System
- [ ] Define app color theme and design system
- [ ] Create MatchScoreDisplay component with tournament-style layout
- [ ] Build ScoreBox component with themed styling
- [ ] Implement winner checkmark indicator
- [ ] Create Toast/Snackbar component for success messages
- [ ] Build Modal confirmation dialog component
- [ ] Design Banner component for error messages
- [ ] Implement notification provider/context
- [ ] Replace all Alert.alert() with UI-based notifications

### Welcome & Onboarding
- [ ] Create welcome screen for non-authenticated users
- [ ] Add app description and value proposition to welcome screen
- [ ] Add Get Started button leading to authentication
- [ ] Design welcome screen with tennis imagery and branding

## Medium Priority Tasks

### Testing Infrastructure
- [ ] Install Jest and React Native Testing Library
- [ ] Configure Jest for React Native and TypeScript
- [ ] Set up test structure and naming conventions
- [ ] Write first test for Match model (RED phase)
- [ ] Implement Match model to pass test (GREEN phase)
- [ ] Refactor Match model code (REFACTOR phase)
- [ ] Write tests for SQLite database operations
- [ ] Create test fixtures and factories for matches/players
- [ ] Write integration tests for score calculation logic
- [ ] Set up test database isolation for SQLite tests

### Git Hooks & CI/CD
- [ ] Install husky for Git hooks management
- [ ] Create pre-push hook to run all tests (Jest + Maestro)
- [ ] Configure pre-push hook to block push if tests fail
- [ ] Add npm script for running all tests in sequence
- [ ] Add pre-commit hook to run tests

### Environment & Configuration
- [ ] Convert app.json to app.config.js for environment variables
- [ ] Set up environment files (.env.development, .env.production)
- [ ] Install @react-native-async-storage/async-storage for Supabase auth

### Advanced Backend Features
- [ ] Create sync mechanism between local SQLite and Supabase
- [ ] Implement optimistic updates (write local first, sync later)
- [ ] Add offline queue for pending match submissions
- [ ] Implement real-time match updates using Supabase subscriptions
- [ ] Add conflict resolution for simultaneous score updates

### Club Management Features
- [ ] Add club management dashboard for club owners
- [ ] Implement club member approval/rejection for owners
- [ ] Add privacy controls to profile (contact sharing, stats visibility)
- [ ] Create admin panel for system management (WEB ONLY)
- [ ] Store club timezone and display match times in local timezone

### Enhanced User Experience
- [ ] Add profile avatar image picker and upload
- [ ] Display user avatar in profile screen
- [ ] Set up Supabase Storage buckets for profile images
- [ ] Configure storage policies for secure file access
- [ ] Add in-app notification badges for new match invitations
- [ ] Send in-app notifications for match cancellations

### Database Management
- [ ] Install Supabase CLI for migrations and type generation
- [ ] Generate TypeScript types from Supabase schema
- [ ] Set up database migrations workflow
- [ ] Create RLS policies for user data access
- [ ] Create RLS policies for club-based match visibility
- [ ] Add RLS policies for club ownership permissions

## Low Priority Tasks (Future Enhancements)

### End-to-End Testing with Maestro
- [ ] Install Maestro CLI for E2E testing
- [ ] Configure Maestro for Expo/React Native project
- [ ] Create .maestro directory and test structure
- [ ] Write first Maestro flow for app launch and navigation
- [ ] Create E2E test for complete match recording flow
- [ ] Write Maestro test for offline match entry and sync
- [ ] Configure test coverage reporting
- [ ] Set up Maestro Cloud for CI/CD integration
- [ ] Create Maestro visual regression tests for key screens
- [ ] Add accessibility testing with Maestro

### Advanced Search & Filtering
- [ ] Add search functionality for club discovery
- [ ] Add distance-based filtering for club discovery
- [ ] Add player search within club
- [ ] Add member filtering by name
- [ ] Show member availability status

### Enhanced Statistics & Analytics
- [ ] Add head-to-head statistics between players
- [ ] Create dedicated View All Courts screen
- [ ] Display club-specific match history in club details
- [ ] Implement player availability status
- [ ] Handle doubles team formation (flexible pairing)

### Premium Features (Post-Release)
- [ ] Add weather information for matches (FUTURE - not MVP)
- [ ] Integrate weather API for location-based weather data (FUTURE - not MVP)
- [ ] Create email notifications for important events (FUTURE - not MVP)
- [ ] Audit dependencies for unnecessary complexity
- [ ] Use vanilla React Native components over heavy UI libraries

### App Distribution & Polish
- [ ] Configure deep linking for sharing club invites
- [ ] Add app store metadata and privacy policy
- [ ] Set up EAS Build for custom development builds
- [ ] Implement simple tennis score calculation (no complex algorithms)
- [ ] Avoid over-engineering sync - simple queue with retry logic

## Architecture Notes

Following DHH's "Conceptual Compression" philosophy:
- Local-first with SQLite for instant performance
- Minimal backend complexity with Supabase
- TDD approach for code quality and confidence
- Progressive enhancement from local to cloud features

## Feature Scope Alignment

This TODO list now matches the wireframes created for the tennis club app, including:
- 2-tab navigation (Club, Profile)
- Member ranking system with win percentages
- Challenge system for direct player invitations
- "Looking to Play" posting system
- Court management and selection
- Contact sharing and match coordination
- Comprehensive tennis statistics and match history

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