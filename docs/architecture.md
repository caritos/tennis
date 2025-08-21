# Play Serve - System Architecture

## Overview

Play Serve is a React Native mobile application built with Expo, designed to connect tennis players within local clubs. The architecture follows modern mobile development patterns with offline-first capabilities, real-time features, and comprehensive testing infrastructure.

## Technology Stack

### Frontend Framework
- **React Native 0.79.5** - Cross-platform mobile development
- **Expo SDK** - Development toolchain and services
- **TypeScript** - Type safety and developer experience
- **Expo Router** - File-based navigation system
- **JavaScript Engine**: JavaScriptCore (JSC) - More stable than Hermes on iPad
- **Primary Target**: iOS universal app (iPhone and iPad)

### Backend Services
- **Supabase** - Backend-as-a-Service platform
  - Authentication with Supabase Auth
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions
  - Edge functions for server-side logic

### Data Management - Hybrid Database Architecture
- **Expo SQLite** - Primary local database for all app data
- **Supabase PostgreSQL** - Cloud database for authentication and sync
- **AsyncStorage** - Key-value storage for settings and preferences
- **Hybrid Architecture Benefits**:
  - Offline-first capability with SQLite for instant performance
  - Cloud backup and sync with Supabase for data persistence
  - Works without internet connection (SQLite handles all operations)
  - Automatic sync when connection restored (Supabase synchronization)

## Architecture Patterns

### 1. State Management
```
Context API Layer:
├── AuthContext - User authentication state
├── NotificationContext - Push notifications and badges  
└── OnboardingContext - User onboarding flow

Custom Hooks Layer:
├── useSync - Data synchronization
├── useLocation - Location services
├── usePlayerStats - Tennis statistics
├── useNotificationBadge - Badge management
└── useContextualPrompts - User guidance system
```

### 2. Service Layer Architecture
```
Service Layer (Business Logic):
├── authService - User authentication and session management
├── clubService - Tennis club operations
├── matchService - Match recording and history
├── challengeService - Player challenges and invitations
├── notificationService - Push notifications
├── rankingService - Tennis ranking calculations
├── safetyService - Community safety and reporting
└── realtimeService - WebSocket connections
```

### 3. Data Layer Pattern - Hybrid Database Design
```
Data Flow:
UI Components → Custom Hooks → Service Layer → SQLite (Primary) → Supabase (Sync)

Database Responsibilities:
SQLite (Local):
├── All app data (users, clubs, matches, etc.)
├── Immediate read/write operations
├── Offline functionality
├── Local caching and performance
└── 9 tables with full schema

Supabase (Cloud):
├── User authentication (Supabase Auth)
├── Data backup and persistence
├── Cross-device synchronization
├── Real-time subscriptions
└── Remote data access

Sync Strategy:
1. Write to SQLite immediately (instant UI feedback)
2. Queue sync operation for Supabase
3. Sync when network available
4. Handle conflicts with last-write-wins
```

### 4. Component Architecture

#### Component Hierarchy
```
App Structure:
├── app/ (Expo Router Pages)
│   ├── (tabs)/ - Main tab navigation
│   ├── auth/ - Authentication screens
│   ├── club/ - Club-specific pages
│   └── modals/ - Overlay screens
├── components/ - Reusable UI components
│   ├── tennis/ - Tennis-specific components
│   └── ui/ - Generic UI components
└── contexts/ - React Context providers
```

#### Key Components
- **TennisScoreDisplay** - Professional scoring system
- **ClubCard** - Club information display
- **MatchHistoryView** - Match tracking interface
- **ChallengeFlowModal** - Player challenge system
- **NotificationBadge** - Real-time notification system
- **ContextualPrompt** - Smart user guidance

### 5. Navigation Architecture

```
Navigation Structure:
├── Tab Navigation (Bottom)
│   ├── Home (index) - Club discovery and dashboard
│   └── Profile - User settings and statistics
├── Stack Navigation
│   ├── Club Details - Club-specific screens
│   ├── Match Recording - Tennis score entry
│   └── Player Profiles - Individual player data
└── Modal Stack
    ├── Authentication flows
    ├── Forms (Create Club, Challenge Player)
    └── Settings screens
```

## Core Features Implementation

### 1. Tennis Club System
- **Club Discovery**: Location-based club finding
- **Club Management**: Create, join, and manage clubs
- **Member Directory**: Player listings with contact info
- **Rankings System**: Automatic calculation based on match results

### 2. Match Recording
- **Professional Scoring**: Complete tennis scoring system (sets, games, points)
- **Singles/Doubles Support**: Different match formats
- **Match History**: Comprehensive tracking and statistics
- **Offline Recording**: Works without internet connection

### 3. Social Features
- **Challenge System**: Send/receive match invitations
- **Looking to Play**: Post availability for matches
- **Contact Sharing**: Automatic phone number sharing post-match
- **Community Safety**: Reporting system with automatic moderation

### 4. Real-time Features
- **Live Notifications**: Push notifications for challenges and matches
- **Badge System**: Unread count indicators
- **Real-time Updates**: Live data synchronization
- **Contextual Prompts**: Smart user guidance based on app state

## Offline-First Architecture with Hybrid Database

### Why Hybrid SQLite + Supabase?
This architecture provides the best of both worlds:
- **SQLite**: Lightning-fast local queries, offline functionality, no network latency
- **Supabase**: Authentication, cloud backup, cross-device sync, real-time features

### Offline Queue System
```
Network States:
Online: SQLite writes → Immediate Supabase sync
Offline: SQLite writes → Queue for later sync
Reconnection: Batch sync from queue → Supabase

Database Interaction:
User Action → SQLite (instant) → Sync Queue → Supabase (when online)
```

### Data Synchronization Strategy
1. **SQLite First**: All operations write to SQLite for instant feedback
2. **Async Supabase Sync**: Background sync without blocking UI
3. **Bidirectional Sync**: Pull changes from Supabase on app launch
4. **Conflict Resolution**: Last-write-wins with timestamp comparison
5. **Retry Logic**: Exponential backoff for failed sync operations
6. **Batch Processing**: Efficient bulk sync on reconnection

### Offline Capabilities
- Create and join clubs
- Record match results
- Send challenges
- View match history
- Access player profiles
- Use all core features without internet

## Security Architecture

### Authentication
- **Apple Sign-In**: Native iOS authentication (primary)
- **Email/Password**: Supabase Auth fallback
- **Session Management**: Secure token handling
- **Biometric Auth**: Device-level security integration

### Data Security
- **Row Level Security (RLS)**: Database-level access control
- **Encrypted Storage**: Local SQLite encryption
- **API Security**: Supabase Auth tokens for all requests
- **Privacy Controls**: User data management and deletion

### Community Safety
- **Automated Reporting**: Post-match behavior reporting
- **Progressive Consequences**: Warning → Temporary ban → Permanent ban
- **Content Moderation**: Automatic filtering and human review
- **User Blocking**: Individual user blocking capabilities

## Performance Architecture

### Optimization Strategies
- **Code Splitting**: Dynamic imports for large features
- **Image Optimization**: Expo Image for efficient media handling
- **Database Indexing**: Optimized SQLite queries
- **Caching Strategy**: Multi-layer caching system
- **Bundle Optimization**: Metro bundler configuration

### Monitoring
- **Crash Reporting**: Automatic error collection
- **Performance Metrics**: App startup and operation timing
- **User Analytics**: Feature usage and engagement tracking
- **Network Monitoring**: Sync success rates and failures

## Testing Architecture

### Test-Driven Development (TDD)
- **Unit Tests**: Component and service layer testing
- **Integration Tests**: End-to-end user flow validation
- **E2E Testing**: Maestro automation for critical paths
- **Test Coverage**: 70%+ coverage requirement

### Testing Infrastructure
```
Testing Layers:
├── Unit Tests (Jest/React Native Testing Library)
├── Integration Tests (Service layer validation)
├── E2E Tests (Maestro iOS simulator testing)
└── Device Testing (Real device validation matrix)
```

### Quality Assurance
- **Git Hooks**: Pre-commit ESLint, pre-push comprehensive checks
- **Automated Checks**: TypeScript compilation, test execution
- **Code Reviews**: Systematic review process
- **Continuous Integration**: Automated testing pipeline

## Development Architecture

### Development Methodology
- **Test-Driven Development**: Tests written before implementation
- **Component-First Approach**: Reusable, maintainable architecture
- **Service Layer Pattern**: Business logic separation
- **Offline-First Design**: Network-resilient architecture

### Code Organization
```
Project Structure:
├── /app - Expo Router pages and navigation
├── /components - Reusable UI components
├── /services - Business logic and API integration
├── /hooks - Custom React hooks for state management
├── /contexts - React Context providers
├── /types - TypeScript type definitions
├── /utils - Utility functions and helpers
├── /tests - Test files and testing utilities
└── /docs - Comprehensive documentation
```

### Build and Deployment
- **EAS Build**: Expo Application Services for builds
- **App Store Deployment**: iOS App Store submission ready
- **Environment Management**: Development, staging, production
- **CI/CD Pipeline**: Automated testing and deployment

## Third-Party Integrations

### Core Libraries
- **@supabase/supabase-js** - Cloud authentication and sync
- **expo-sqlite** - Primary local database (9 tables)
- **expo-location** - GPS and location services
- **expo-notifications** - Push notification system
- **expo-image-picker** - Camera and photo library
- **react-native-reanimated** - High-performance animations

### Platform Services
- **Apple Developer Services**: App Store submission and Apple Sign-In
- **Supabase Platform**: Backend services and database hosting
- **Expo Services**: Development tools and build services
- **Push Notification Services**: APNs integration

## Scalability Considerations

### Horizontal Scaling
- **Modular Architecture**: Easy feature addition and removal
- **Service Separation**: Independent service scaling
- **Database Optimization**: Efficient query patterns
- **Caching Layers**: Multi-level caching strategy

### Future Enhancements
- **Multi-platform Support**: Android implementation ready
- **Internationalization**: i18n-ready component architecture
- **Advanced Analytics**: User behavior and app performance
- **Social Features**: Enhanced community features

---

*This architecture supports a production-ready tennis community application with offline capabilities, real-time features, and comprehensive testing infrastructure.*