# TODO - Tennis Community App

## High Priority Tasks (MVP Core)

### iOS Simulator Testing Setup
- [x] Install Xcode and iOS Simulator
- [x] Configure iPhone 15 simulator for testing
- [x] Test app launches correctly in simulator
- [x] Verify hot reload works for development
- [ ] Test tennis app navigation on simulator
- [ ] Verify location permissions for club discovery
- [ ] Test form inputs with simulator keyboard
- [ ] Test offline functionality in airplane mode
- [ ] Verify tennis scoring calculations display correctly
- [ ] Test challenge and notification flows on simulator

### Navigation & App Structure
- [x] Install @react-navigation/bottom-tabs dependency
- [ ] Create basic 2-tab bottom navigation structure
- [ ] Add Club Tab with placeholder content
- [ ] Add Profile Tab with placeholder content
- [ ] Style tab bar with tennis theme colors
- [ ] Add tab icons (🎾 for Club, 👤 for Profile)
- [ ] Create Club Tab header with "My Clubs" title
- [ ] Add "My Clubs" section placeholder in Club Tab
- [ ] Add "Discover Clubs" section placeholder in Club Tab
- [ ] Create Profile Tab header with user name
- [ ] Add tennis stats placeholder in Profile Tab
- [ ] Add settings section placeholder in Profile Tab
- [ ] Update app.json with "Tennis Club" name and theme

### Core Database & Authentication
- [ ] Install expo-sqlite dependency
- [ ] Create SQLite database initialization function
- [ ] Design users table schema (id, name, email, phone, created_at)
- [ ] Design clubs table schema (id, name, description, geographic_area, zip_code)
- [ ] Design matches table schema (id, player1_id, player2_id, scores, date, club_id)
- [ ] Design club_members table schema (club_id, user_id, joined_at)
- [ ] Create SQLite migration helper functions
- [ ] Set up new Supabase project in dashboard
- [ ] Create users table in Supabase with same schema as SQLite
- [ ] Create clubs table in Supabase with same schema as SQLite
- [ ] Create matches table in Supabase with same schema as SQLite
- [ ] Create club_members table in Supabase with same schema as SQLite
- [ ] Install @supabase/supabase-js dependency
- [ ] Install @react-native-async-storage/async-storage for auth
- [ ] Create Supabase client configuration file
- [ ] Set up email/password authentication in Supabase
- [ ] Configure Apple Sign In in Supabase dashboard
- [ ] Configure Google Sign In in Supabase dashboard
- [ ] Create basic RLS policy for users table (users can only see their own data)
- [ ] Create basic RLS policy for clubs table (all authenticated users can read)
- [ ] Create basic RLS policy for matches table (participants can read/write)
- [ ] Create basic RLS policy for club_members table (members can read)

### Club Discovery & Management
- [ ] Install expo-location dependency
- [ ] Request location permissions in app.json
- [ ] Create basic club creation form component
- [ ] Add club name input field to creation form
- [ ] Add club description input field to creation form
- [ ] Add geographic area input field to creation form
- [ ] Add zip code input field to creation form
- [ ] Create club creation form submission logic
- [ ] Implement auto-join when creating a club
- [ ] Create function to calculate distance between coordinates
- [ ] Add location-based club discovery query
- [ ] Create club card component with basic styling
- [ ] Add distance display to club card component
- [ ] Add member count display to club card component
- [ ] Add join button to club card component

### Match Recording System
- [ ] Create basic match recording form component
- [ ] Add match type radio buttons (Singles/Doubles)
- [ ] Add player selection dropdown for opponent
- [ ] Add date picker for match date
- [ ] Create set score input component (two number inputs)
- [ ] Add "Add Set" button functionality
- [ ] Validate tennis set scores (0-7, special cases for 6-6, 7-5, etc.)
- [ ] Add tiebreak score input for 7-6 sets
- [ ] Format tiebreak display as "7-6 (7-3)"
- [ ] Add "Add Unregistered Opponent" option to player selection
- [ ] Create unregistered opponent name input field
- [ ] Create match save function for SQLite
- [ ] Create match sync function for Supabase
- [ ] Implement offline queue for match syncing

### Club Member Rankings
- [ ] Create ranking calculation function (wins/total matches)
- [ ] Create unified points system (singles + doubles combined)
- [ ] Create member ranking list component
- [ ] Add trophy indicators (🏆🥈🥉) for top 3 players
- [ ] Add provisional "P" badge for players with <5 matches
- [ ] Filter rankings by club membership
- [ ] Create horizontal scroll container for member list
- [ ] Add "View All" button to member list
- [ ] Create dedicated View All Members screen
- [ ] Add search functionality to View All Members screen
- [ ] Add challenge buttons to member ranking cards


### "Looking to Play" System
- [ ] Create "Looking to Play" section in club details
- [ ] Build match invitation post form (singles/doubles, date, time, notes)
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
- [ ] Create shared FormHeader component (< Back Title pattern)
- [ ] Create PlayerCard component for rankings and member lists
- [ ] Create InvitationCard component for challenges and "Looking to Play"
- [ ] Create ClubCard component for club discovery and lists
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
- [ ] Implement club member removal capability for owners (violations only)
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