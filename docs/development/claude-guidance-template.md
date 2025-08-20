# Claude Code Guidance Template

This template captures best practices and procedures for working with Claude Code on production-quality React Native/Expo projects.

## Optimal CLAUDE.md Structure

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview
[Brief project description and main features]

## Tech Stack
- **Framework**: React Native with Expo (Managed Workflow)
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Context
- **Testing**: Jest (unit), Maestro (E2E)
- **Build System**: EAS Build
- **Deployment**: App Store (iOS), Google Play Store (Android)

## Project Structure
[Directory layout with explanations]

## Development Principles
### Production Quality Standards
> "No experimental features in production"
- All technology choices must be production-proven (12+ months stability)
- Prefer managed workflow over bare workflow
- Single source of truth for all configuration

### Root Cause Analysis
> "Always find the root cause rather than applying surface fixes"

## Important Notes
[Project-specific critical information]

## Quick Problem Resolution
[Common issues and solutions]
```

## Key Development Principles to Enforce

### 1. **Production Stability First**
```markdown
## Production Requirements
- NO experimental features (e.g., React Native New Architecture disabled)
- NO beta/alpha dependencies
- Managed workflow preferred (no ios/android directories)
- Single source of truth (app.json controls everything)
- 12+ months stability for all major dependencies
```

### 2. **Single Source of Truth Pattern**
```markdown
## Content Management
- All content originates from data/*.json files
- Generated files are git-ignored
- Use generation scripts for derived content:
  - data/faq.json → app FAQ + documentation
  - data/privacy-policy.json → legal documents
  - data/terms-of-service.json → multiple formats
```

### 3. **Documentation Standards**
```markdown
## Documentation Requirements
- Every major feature needs documentation in /docs
- Use clear directory structure:
  - /docs/development/ - Technical decisions
  - /docs/features/ - Feature documentation
  - /docs/project-management/ - Session summaries
  - /docs/testing/ - Test strategies
  - /docs/deployment/ - Build and release
```

## Workflow Patterns for Claude

### Starting a New Feature
```markdown
1. Use TodoWrite tool to track multi-step tasks
2. Search codebase extensively before implementing
3. Follow existing patterns (check neighboring files)
4. Document major decisions immediately
5. Test on both iPhone and iPad (if iOS app)
```

### Problem-Solving Approach
```markdown
1. Find root cause, not surface symptoms
2. Check logs (logs/expo.log) for detailed errors
3. Use Task tool for complex investigations
4. Document the solution for future reference
```

### Build and Release Process
```markdown
1. Version: Semantic versioning (1.0.1)
2. Build Number: Date-based (YYYYMMDDNNN)
3. Always test with managed workflow first
4. Document any App Store rejection reasons
5. Keep single source of truth for configuration
```

## Common Commands Reference

```bash
# Development
npm start                    # Start Expo development server
npm run ios                  # Run on iOS simulator
npm run android              # Run on Android emulator

# Quality Assurance  
npm run lint                # ESLint code quality check
npm run type-check          # TypeScript type checking
npm run test:unit           # Unit tests
npm run e2e                 # End-to-end tests

# Content Management
npm run wiki:update         # Sync all content to GitHub Wiki
npm run wiki:generate-faq   # Generate FAQ from JSON
npm run wiki:generate-legal # Generate legal documents

# Build & Deploy
npx eas build --platform ios --profile production --non-interactive
npx eas build:list --platform ios --limit 5
npx eas build:view [build-id]
```

## Critical Lessons Learned

### App Store Submission
```markdown
## Common Rejection Reasons
1. iPad compatibility (always set supportsTablet: true)
2. User-friendly support URLs (use GitHub Wiki, not issues)
3. Build configuration conflicts (use managed workflow)

## Resolution Pattern
1. Read rejection reason carefully
2. Find root cause (not just symptom)
3. Test fix thoroughly on target device
4. Document solution for future
```

### Configuration Management
```markdown
## Avoid These Issues
- ❌ Native directories overriding app.json
- ❌ Multiple sources of truth for versions
- ❌ Experimental features in production
- ❌ Manual sync between configurations

## Best Practices
- ✅ Managed workflow (no ios/android directories)
- ✅ Single app.json configuration
- ✅ Date-based build numbers (YYYYMMDDNNN)
- ✅ Automated content generation
```

### Testing Strategy
```markdown
## E2E Testing with Maestro
- Test flows in tests/integration/flows/
- Device-specific tests for iPhone and iPad
- Always test critical user journeys
- Document test strategies in /docs/testing/
```

## Project Structure Best Practices

### Optimal Directory Layout
```
project/
├── app/                    # Expo Router pages
├── components/             # Reusable components
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── services/               # Business logic
├── data/                   # Single source of truth JSON
├── database/               # Schema and migrations
├── docs/                   # Comprehensive documentation
├── scripts/                # Automation scripts
├── tests/                  # Test suites
└── CLAUDE.md              # Claude guidance (keep clean!)
```

### Documentation Organization
```
docs/
├── development/            # Technical decisions, architecture
├── features/               # Feature-specific documentation
├── project-management/     # History, summaries, planning
├── testing/                # Test guides and strategies
├── deployment/             # Build, release, app store
└── ui-improvements/        # UI/UX decisions and rationale
```

## Automation Scripts Pattern

### Content Generation Example
```javascript
// scripts/generate-[content].js
const fs = require('fs');
const data = require('../data/[content].json');

// Transform JSON to required formats
// Write to multiple output locations
// Handle errors gracefully
```

### Wiki Synchronization
```bash
#!/bin/bash
# scripts/update-wiki.sh
# 1. Clone wiki repository
# 2. Generate content from data/
# 3. Copy to wiki
# 4. Commit and push changes
```

## Git Workflow

### Commit Message Standards
```
type: brief description

Detailed explanation of changes:
• Bullet points for clarity
• Context and reasoning
• References to issues/docs

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Pre-commit/Pre-push Hooks
- ESLint must pass
- TypeScript checks (optional but recommended)
- Unit tests (optional but recommended)

## Session Management

### Starting a Session
1. Check CLAUDE.md for project context
2. Review recent commits for current state
3. Use TodoWrite for complex tasks
4. Reference existing documentation

### Ending a Session
1. Complete all todos or document incomplete items
2. Commit all changes with clear messages
3. Update documentation if needed
4. Create session summary for major work

## Anti-Patterns to Avoid

### Development Anti-Patterns
- ❌ Adding experimental features without thorough testing
- ❌ Creating new files when existing ones can be modified
- ❌ Implementing without searching for existing patterns
- ❌ Skipping documentation for complex features

### Configuration Anti-Patterns
- ❌ Having multiple sources of truth
- ❌ Manual configuration synchronization
- ❌ Bare workflow unless absolutely necessary
- ❌ Platform-specific hacks over proper solutions

### Documentation Anti-Patterns
- ❌ Inline memories in CLAUDE.md (use docs/)
- ❌ Undocumented architectural decisions
- ❌ Missing test strategies for features
- ❌ No session summaries for major changes

## Quick Reference for New Projects

### Initial Setup Checklist
- [ ] Create clean CLAUDE.md with project overview
- [ ] Set up managed workflow (no native directories)
- [ ] Configure single source of truth for content
- [ ] Implement production stability requirements
- [ ] Set up automated testing strategy
- [ ] Create documentation structure
- [ ] Configure build system with date-based numbering

### Technology Decisions
- [ ] Disable experimental features
- [ ] Choose proven, stable dependencies
- [ ] Prefer Expo's managed workflow
- [ ] Use TypeScript for type safety
- [ ] Implement proper error handling

This template ensures Claude Code works efficiently and maintains production quality standards across all your projects.