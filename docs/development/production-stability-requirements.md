# Production Stability Requirements

## Overview

This document outlines the strict production stability requirements for Play Serve development. All technology choices prioritize proven, stable, production-ready solutions over experimental or cutting-edge features.

## Core Principle

> **No Experimental Features in Production**
> 
> When building the app, nothing experimental should be used. All libraries and processes must be production quality and verified to work reliably for an extended period.

## React Native New Architecture Decision

### What is React Native New Architecture?

React Native New Architecture is a major redesign introduced to improve performance through:

**Components:**
- **Turbo Modules** - New native module system with direct JavaScript-to-native communication
- **Fabric** - New rendering system replacing the old "Paper" renderer

**Benefits:**
- Faster startup times and reduced memory usage
- Better TypeScript support with automatic type generation
- Improved debugging and modern C++ implementation
- Direct synchronous native calls (no bridge serialization)

### Why We Disabled It (`"newArchEnabled": false`)

**Production Stability Issues:**
1. **Build Failures** - C++ compilation errors with TurboCxxModule on our target platforms
2. **Device Compatibility** - Specific issues with iPad Air 11-inch (M2) causing App Store rejection
3. **Library Support** - Many third-party libraries still lack full New Architecture compatibility
4. **Experimental Status** - Still opt-in and considered experimental in React Native 0.79.5

**App Store Impact:**
- Apple rejected the app due to iPad crash on launch
- Root cause traced to New Architecture build system instability
- Disabling New Architecture resolved the crash immediately

### Decision Timeline

```
Problem: App Store rejection (iPad crash)
Investigation: React Native New Architecture build failures
Solution: Disable New Architecture for production stability
Result: Successful iPad launch and App Store compatibility
```

## Technology Selection Criteria

When evaluating any technology for Play Serve:

### ✅ **Production-Ready Requirements**
- **Stability**: Feature has been stable for 12+ months in production environments
- **Community Adoption**: Widely used by major apps and companies
- **Documentation**: Comprehensive, up-to-date documentation available
- **Support**: Active maintenance and regular security updates
- **Compatibility**: Works reliably across all target platforms (iOS, Android)
- **Third-Party Integration**: Compatible with our existing library ecosystem

### ❌ **Experimental Feature Red Flags**
- **Beta/Alpha status** or marked as "experimental"
- **Breaking changes** in recent releases
- **Limited production usage** or missing case studies
- **Incomplete documentation** or community guidance
- **Build system issues** or platform-specific problems
- **Third-party incompatibility** with core dependencies

## Current Production Stack

### Core Framework
- **React Native 0.79.5** - Stable LTS version
- **New Architecture**: **DISABLED** (`"newArchEnabled": false`)
- **Expo SDK 53** - Production-ready managed workflow

### Key Dependencies
- **Authentication**: Supabase (proven, stable service)
- **Database**: Supabase PostgreSQL (enterprise-grade)
- **Navigation**: Expo Router (stable, well-documented)
- **State Management**: React Context (built-in, stable)

### Build System
- **iOS**: Traditional React Native architecture (proven)
- **Android**: Standard Gradle build (reliable)
- **CI/CD**: EAS Build (production Expo service)

## Future Technology Adoption

### React Native New Architecture
**Criteria for Re-enabling:**
- React Native 0.85+ with New Architecture as default (not opt-in)
- 90%+ of our dependencies officially support New Architecture
- 6+ months of stable production usage by major apps
- No device-specific build issues reported
- Apple App Store compatibility verified

### Other Experimental Features
**Evaluation Process:**
1. **Research Phase** - Monitor technology for 12+ months post-stable release
2. **Proof of Concept** - Test in isolated development branch
3. **Compatibility Audit** - Verify all dependencies and platform support
4. **Staging Testing** - Full testing across all target devices
5. **Gradual Rollout** - Feature flags and careful monitoring

## App Store Submission Context

### Critical Lesson: iPad Compatibility
- **Submission ID**: 693886d6-06d9-4dc8-9f3a-2e27ceda3a0f
- **Issue**: "Guideline 2.1 - Performance - App Completeness"
- **Device**: iPad Air 11-inch (M2), iPadOS 18.6
- **Root Cause**: React Native New Architecture build failures
- **Resolution**: Disabled New Architecture, enabled iPad support

### Production Quality Standards
- **Build Success**: 100% reliable builds across all target devices
- **Launch Stability**: No crashes on app launch for any supported device
- **Platform Support**: Universal iOS app (iPhone + iPad)
- **Performance**: Consistent performance across device variants

## Implementation Guidelines

### App Configuration
```json
{
  "expo": {
    "newArchEnabled": false,  // REQUIRED: No experimental features
    "ios": {
      "supportsTablet": true  // REQUIRED: Full platform support
    }
  }
}
```

### Dependency Management
- **Major Version Updates**: Evaluate for 3+ months before adoption
- **Pre-release Versions**: Never use in production builds
- **Deprecated Features**: Plan migration 6+ months before end-of-life

### Testing Requirements
- **Device Testing**: All supported iPhone and iPad models
- **iOS Versions**: Minimum supported version through latest
- **Build Verification**: EAS Build success on production profile
- **App Store Submission**: Test build must pass Apple review

## Monitoring and Maintenance

### Regular Reviews
- **Quarterly**: Review technology stack for stability and support status
- **Before Major Releases**: Audit all dependencies for production readiness
- **Post-Incident**: Document lessons learned and update requirements

### Documentation Updates
This document must be updated whenever:
- Technology decisions change based on stability requirements
- New experimental features are evaluated or rejected
- App Store submission issues provide new insights
- Production incidents reveal stability gaps

---

**Remember**: The goal is a reliable, stable app that serves users without disruption. Performance optimizations and new features are secondary to production stability and user experience quality.

*This document reflects the lessons learned from the React Native New Architecture decision and App Store submission process in August 2025.*