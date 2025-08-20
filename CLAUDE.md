# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Play Serve is a React Native tennis community app built with Expo, focusing on connecting tennis players within local clubs. The app enables match recording, club rankings, player discovery, and social tennis features.

## Tech Stack

- **Framework**: React Native with Expo (Managed Workflow)
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Context
- **Testing**: Jest (unit), Maestro (E2E)
- **Build System**: EAS Build
- **Deployment**: App Store (iOS), Google Play Store (Android)

## Project Structure

```
├── app/                    # Expo Router pages (main navigation structure)
├── components/             # Reusable React components
├── contexts/               # React Context providers (Auth, Notifications, etc.)
├── hooks/                  # Custom React hooks
├── services/               # Business logic and external service integrations
├── database/               # Supabase database schema and setup
├── data/                   # Single source of truth for content (FAQ, legal docs)
├── docs/                   # Comprehensive project documentation
├── tests/                  # Unit and integration tests
└── scripts/                # Build, deployment, and utility scripts
```

## Key Documentation

### **Development Guidelines**
- **Production Stability**: `/docs/development/production-stability-requirements.md`
- **Workflow Architecture**: `/docs/development/expo-workflow-explanation.md`
- **Content Management**: `/docs/development/single-source-of-truth-system.md`

### **Feature Documentation**
- **Match System**: `/docs/features/match-claiming-system.md`
- **Club Management**: `/docs/features/club-discovery-enhanced.md`
- **Notifications**: `/docs/features/push-notifications.md`

### **Testing**
- **E2E Guide**: `/docs/testing/e2e-testing-guide.md`
- **Quick Reference**: `/docs/testing/e2e-quick-reference.md`

### **Deployment**
- **App Store**: `/docs/deployment/app-store/`
- **Build Process**: `/docs/deployment/eas-app-store-guide.md`

## Development Principles

### **Production Quality Standards**
> "No experimental features in production"

- All technology choices must be production-proven (12+ months stability)
- React Native New Architecture is disabled for stability
- Managed workflow used for consistency and reliability

### **Single Source of Truth**
- Content (FAQ, legal docs) originates from `data/*.json`
- Generated files are git-ignored to prevent drift
- Wiki content automatically synchronized

### **Root Cause Analysis**
> "Always find the root cause rather than applying surface fixes"

Focus on understanding and solving underlying issues rather than quick patches.

## Common Commands

```bash
# Development
npm start                    # Start Expo development server
npm run ios                  # Run on iOS simulator
npm run android             # Run on Android emulator

# Quality Assurance  
npm run lint                # ESLint code quality check
npm run type-check          # TypeScript type checking
npm run test:unit           # Unit tests
npm run e2e                 # End-to-end tests

# Content Management
npm run wiki:update         # Sync all content to GitHub Wiki
npm run wiki:generate-legal # Generate legal documents from JSON

# Build & Deploy
npx eas build --platform ios --profile production
npx eas submit --platform ios
```

## Important Notes

### **Managed Workflow**
This project uses Expo's managed workflow - no `ios/` or `android/` directories exist. All configuration is handled through `app.json` and EAS generates native projects during builds.

### **Database Management**
Supabase provides the backend with PostgreSQL database. Schema and setup scripts are in `/database/`. Row Level Security (RLS) is enabled for all tables.

### **Log Access**
Development logs are available at `logs/expo.log`. Use a subagent to tail and analyze logs when debugging.

### **Build System**
- **Version**: Semantic versioning (1.0.1)
- **Build Numbers**: Date-based format (YYYYMMDDNNN)
- **Platforms**: Universal iOS app (iPhone + iPad), Android

## Quick Problem Resolution

### **Build Issues**
1. Check `app.json` configuration (single source of truth)
2. Clear EAS build cache: `--clear-cache` flag
3. Verify dependencies in `package.json`

### **Authentication Problems**
1. Check Supabase connection in `/lib/supabase.ts`
2. Verify environment variables in `.env.development`
3. Test auth flow in development vs production

### **UI/Navigation Issues**
1. Check Expo Router file structure in `/app`
2. Verify component imports and exports
3. Test on both iPhone and iPad simulators

### **Documentation Updates**
When making significant changes:
1. Update relevant documentation in `/docs`
2. Update development history if it's a major feature
3. Regenerate content if FAQ or legal documents change

## Project History

For detailed development history and major milestones, see:
- **Development History**: `/docs/project-management/development-history.md`
- **Session Summaries**: `/docs/project-management/`
- **Architecture Decisions**: `/docs/development/`

---

*This file should be updated when major architectural changes occur or new development patterns are established.*