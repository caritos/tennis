# EAS Workflows Setup Guide

## Overview

EAS Workflows automate the build and deployment process for React Native apps. This guide covers the implementation of automated workflows for the Tennis Club app, optimized for the free tier (30 builds/month).

## Workflow Architecture

### **Production Release Workflow**
- **Trigger**: Push to `main` branch
- **Actions**: 
  - Build iOS production app
  - Auto-submit to App Store Connect
  - Build Android production app
  - Send completion notifications

### **Preview Testing Workflow**  
- **Trigger**: Push to `feature/*`, `fix/*`, `experiment/*` branches
- **Actions**:
  - Run quality checks (lint, type-check, unit tests)
  - Build iOS preview app for TestFlight
  - Generate shareable build links

## Branching Strategy for Free Tier

### **Main Branch Strategy**
```bash
# Only merge to main when ready for production release
git checkout main
git merge feature/my-feature    # Triggers automatic App Store build
```

**Important**: Each push to `main` consumes 2 build credits (iOS + Android)

### **Development Workflow**
```bash
# Create feature branch for development
git checkout -b feature/match-recording-enhancement

# Develop and test locally (no build credits used)
npm run ios
npm run android  
npm run checks:all

# Push triggers preview build (consumes 1 build credit)
git push origin feature/match-recording-enhancement

# Merge only when ready for production
git checkout main
git merge feature/match-recording-enhancement
git push origin main  # Triggers production build + submission
```

### **Branch Naming Conventions**
- `feature/description` - New features or enhancements
- `fix/description` - Bug fixes  
- `experiment/description` - Experimental changes
- `hotfix/description` - Critical production fixes

## Build Credit Management

### **Monthly Allocation (Free Tier)**
- **Total Credits**: 30 builds/month
- **Production Releases**: 2 credits each (iOS + Android)
- **Preview Builds**: 1 credit each (iOS only)

### **Recommended Usage Pattern**
```
Weekly releases: 4 × 2 = 8 credits
Feature testing: 4 × 5 = 20 credits  
Emergency fixes: 2 credits
Total: 30 credits/month
```

### **Credit Conservation Tips**
1. **Test locally first**: Use simulators before pushing
2. **Batch changes**: Combine multiple features per release
3. **Use preview builds sparingly**: Only for critical testing
4. **Manual builds when needed**: `eas build --platform ios --profile preview`

## Workflow Configuration Files

### **Production Release** (`.eas/workflows/production-release.yml`)
```yaml
name: Production Release
on:
  push:
    branches: [main]
jobs:
  build_and_submit_ios:
    name: Build iOS and Submit to App Store
    type: build
    params:
      platform: ios
      profile: production
      auto_submit: true
```

### **Preview Testing** (`.eas/workflows/test-and-build-preview.yml`)
```yaml
name: Test and Build Preview  
on:
  push:
    branches: ['feature/*', 'fix/*', 'experiment/*']
jobs:
  run_tests:
    name: Run Quality Checks
    type: custom
    steps:
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
```

## Setup Instructions

### **1. Link GitHub Repository**
```bash
# Link repository to enable workflow triggers
eas project:link --github-repository eladio/tennis
```

### **2. Verify Workflow Files**
```bash
# Check workflow syntax
eas workflow:list

# View specific workflow details  
eas workflow:show production-release
```

### **3. Test Workflow Execution**
```bash
# Trigger workflow manually (for testing)
eas workflow:run production-release

# Monitor workflow progress
eas build:list --platform ios --limit 5
```

## Monitoring and Debugging

### **Build Status Tracking**
```bash
# Check recent builds
eas build:list --platform all --limit 10

# View build details
eas build:view <build-id>

# Check workflow execution
eas workflow:list --status running
```

### **Build Credit Usage**
```bash
# Check remaining credits
eas account:view

# View usage history
eas build:list --json | jq '.[] | {createdAt, platform, status}'
```

### **Common Issues**

#### **Workflow Not Triggering**
- Verify GitHub repository is linked: `eas project:info`
- Check branch name matches workflow pattern
- Confirm `.eas/workflows/` files are committed to repository

#### **Build Failures**
- Review build logs: `eas build:view <build-id>`
- Check dependency issues: `npm run reset-project`
- Verify EAS configuration: `cat eas.json`

#### **Exceeded Build Credits**
- Upgrade to Production plan ($29/month) for unlimited builds
- Use local development until credits reset monthly
- Manual builds still work: `eas build --platform ios --profile production`

## Integration with Existing Scripts

### **Pre-Workflow Quality Checks**
The workflows integrate with existing npm scripts:
- `npm run lint` - ESLint code quality
- `npm run type-check` - TypeScript validation  
- `npm run test:unit` - Unit test execution
- `npm run checks:all` - Complete validation suite

### **Local Development Commands**
```bash
# Start development server (no build credits)
npm start

# Run on simulators (no build credits)  
npm run ios
npm run android

# Run all quality checks before pushing
npm run checks:all

# Manual EAS build when needed
eas build --platform ios --profile preview
```

## Cost Analysis

### **Free Tier Benefits**
- ✅ 30 builds/month included
- ✅ All workflow features available
- ✅ GitHub integration included
- ✅ Automatic App Store submission

### **When to Upgrade to Production ($29/month)**
- Need more than 15 releases per month
- Multiple developers pushing frequently
- Extensive feature branch testing required
- CI/CD pipeline for multiple environments

## Security Considerations

### **Credentials Management**
- Apple Developer credentials stored securely in EAS
- No sensitive data in workflow files
- GitHub Actions integration uses secure tokens
- App Store Connect API keys recommended over passwords

### **Repository Security**
- Workflow files are public (if repository is public)
- No credentials or API keys in workflow YAML
- Environment variables handled by EAS platform
- Build logs may contain sensitive information

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Workflow not running | Check repository link and branch patterns |
| Build failing | Review logs with `eas build:view <build-id>` |
| Out of credits | Check usage with `eas account:view` |
| Submission errors | Verify Apple Developer account status |
| Test failures | Run `npm run checks:all` locally first |

## Next Steps

After implementing EAS Workflows:

1. **Monitor performance**: Track build times and success rates
2. **Optimize usage**: Adjust branching strategy based on credit usage
3. **Add notifications**: Configure webhook notifications for build status
4. **Expand testing**: Add E2E tests to workflow pipeline
5. **Consider upgrade**: Evaluate Production plan if hitting credit limits

---

**Created**: 2025-08-20  
**Last Updated**: 2025-08-20  
**EAS CLI Version**: Latest  
**Workflow Version**: 1.0