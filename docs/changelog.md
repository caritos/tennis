# Changelog

All notable changes to Tennis Club will be documented in this file.

## [Unreleased]

### Major Features
- Tennis club discovery and auto-join system
- Points-based ranking system combining singles and doubles
- Honor system for match recording
- Community self-policing with automatic reporting
- "Looking to Play" and direct challenge systems
- Automatic phone sharing after match confirmations

### Key Design Decisions
- **Optimistic Approach**: Auto-join clubs, trust users, minimal friction
- **Community Self-Policing**: 2 reports = warning, 3 = removal, 4 = ban
- **Honor System**: Immediate match recording, participant editing rights
- **Unified Rankings**: Single leaderboard combining all match types
- **Minimal Profiles**: Name, email, phone only - no complex preferences
- **No Court Management**: Focus on players and matches, not facilities

## [1.0.0] - Initial Release

### Added
- **Account System**
  - Real name requirement for community trust
  - Email and phone verification
  - Apple Sign-In and Google Sign-In support
  - Automatic location access for club discovery

- **Tennis Clubs**
  - Location-based club discovery
  - Auto-join all clubs (no approval needed)
  - Creator edit rights only (no complex ownership)
  - Community-driven member management

- **Match Coordination**
  - "Looking to Play" public posts
  - Direct player challenges
  - Automatic phone sharing after confirmations
  - Community reminders about commitment

- **Match Recording**
  - Honor system with immediate results
  - Any participant can edit scores
  - No confirmation or dispute processes
  - Supports both singles and doubles

- **Rankings System**
  - Points-based unified rankings
  - 100 base + game differential + upset bonus
  - Provisional rankings for new players (< 5 matches)
  - Trophy indicators for top 3 players

- **Community Safety**
  - Post-match reporting system
  - Automatic warning and removal process
  - Educational notifications
  - Community guidelines integration

- **Privacy & Security**
  - Minimal data collection
  - Automatic phone sharing policy
  - GDPR and CCPA compliance
  - Complete data deletion support

### Technical
- **Architecture**: Expo React Native with TypeScript
- **Database**: SQLite local-first with Supabase sync
- **Authentication**: Expo Auth with social login support
- **Real-time**: Supabase Realtime for notifications
- **Offline Support**: Full functionality without internet

### Documentation
- Complete wireframes and user flows
- Privacy policy and terms of service
- FAQ with community guidelines
- Data deletion procedures
- Developer setup guide

---

## Release Notes Format

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality
- **PATCH** version for bug fixes

### Categories
- **Added** for new features
- **Changed** for changes in existing functionality  
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

---

**Stay updated**: Check this page for the latest Tennis Club improvements and features!