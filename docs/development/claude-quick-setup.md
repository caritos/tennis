# Claude Code Quick Setup Guide

A concise checklist for optimizing Claude Code performance on new projects.

## 1. Create Essential Files

### **CLAUDE.md** (Root Directory)
```markdown
# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Repository Overview
[Project name] is a [type] application that [main purpose].

## Tech Stack
- Framework: React Native with Expo (Managed Workflow)
- Backend: Supabase
- Navigation: Expo Router
- Build System: EAS Build

## Development Principles
- No experimental features in production
- Single source of truth for all configuration
- Root cause analysis over quick fixes

## Quick Commands
npm start          # Start development
npm run lint       # Code quality
npm run test       # Run tests
npx eas build     # Production build
```

### **.gitignore** Additions
```
# Generated files
docs/privacy-policy.html
docs/terms-of-service.md

# Logs
logs/
*.log
```

## 2. Set Production Requirements

### **package.json** Key Settings
```json
{
  "scripts": {
    "lint": "expo lint",
    "type-check": "npx tsc --noEmit",
    "test": "jest",
    "wiki:update": "./scripts/update-wiki.sh"
  }
}
```

### **app.json** Configuration
```json
{
  "expo": {
    "newArchEnabled": false,  // ALWAYS FALSE for stability
    "ios": {
      "supportsTablet": true,  // ALWAYS TRUE for App Store
      "buildNumber": "20250820001"  // Date-based format
    }
  }
}
```

## 3. Create Directory Structure

```bash
mkdir -p app components contexts hooks services
mkdir -p data database docs scripts tests
mkdir -p docs/{development,features,project-management,testing,deployment}
```

## 4. Implement Single Source of Truth

### **data/** Directory Structure
```
data/
├── faq.json              # FAQ content
├── privacy-policy.json   # Privacy policy
└── terms-of-service.json # Terms of service
```

### **Generation Script Pattern**
```javascript
// scripts/generate-content.js
const data = require('../data/content.json');
// Generate multiple output formats from single JSON source
```

## 5. Configure Claude Preferences

### **Important Instructions for Claude**
1. Always use managed workflow (no ios/android directories)
2. Search extensively before implementing new features
3. Follow existing patterns in the codebase
4. Document architectural decisions immediately
5. Use TodoWrite tool for multi-step tasks

### **Problem-Solving Instructions**
1. Check logs/expo.log for detailed errors
2. Find root cause, not symptoms
3. Test on all target devices (iPhone + iPad)
4. Document solutions in /docs

## 6. Documentation Templates

### **/docs/README.md**
```markdown
# Documentation

## Structure
- `/development/` - Architecture and technical decisions
- `/features/` - Feature documentation
- `/project-management/` - Development history
- `/testing/` - Test strategies and guides
- `/deployment/` - Build and release procedures
```

### **Session Summary Template**
```markdown
# Session Summary: [Date] - [Main Task]

## Overview
[Brief description of work completed]

## Issues Resolved
- Issue: [Description]
  - Root Cause: [Analysis]
  - Solution: [Implementation]

## Technical Changes
- [List key changes]

## Documentation Updates
- [List new/updated docs]

## Next Steps
- [Any pending items]
```

## 7. Testing Setup

### **Maestro E2E Tests**
```yaml
# tests/integration/flows/01-critical-flow.yaml
appId: com.yourcompany.app
---
- launchApp
- assertVisible: "Welcome"
```

### **Jest Unit Tests**
```javascript
// tests/unit/example.test.js
describe('Feature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

## 8. Build Configuration

### **EAS Configuration (eas.json)**
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production"
      },
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  }
}
```

## 9. Quick Troubleshooting Guide

Add to CLAUDE.md:
```markdown
## Quick Problem Resolution

### Build Issues
1. Check app.json configuration
2. Clear EAS cache: --clear-cache
3. Verify managed workflow (no native dirs)

### App Store Rejections
1. Enable iPad support
2. Provide user-friendly support URL
3. Check for crashes on all devices
```

## 10. Final Checklist

Before starting development:
- [ ] CLAUDE.md created with clear guidance
- [ ] Production requirements documented
- [ ] Directory structure established
- [ ] Single source of truth implemented
- [ ] Documentation templates ready
- [ ] Testing framework configured
- [ ] Build system set up with date-based numbering
- [ ] Managed workflow confirmed (no ios/android)

## Key Reminders for Claude

**ALWAYS**:
- Use TodoWrite for complex tasks
- Search before implementing
- Document decisions immediately
- Test on all target platforms
- Prefer stable over experimental

**NEVER**:
- Enable newArchEnabled
- Create ios/android directories
- Use experimental features
- Have multiple sources of truth
- Skip documentation

---

This setup ensures Claude Code works optimally on your project from day one!