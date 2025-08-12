# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

[... existing content remains unchanged ...]

## Memories and Notes

- Worked on initial setup of the project with Expo Router and Supabase integration
- Implemented basic authentication flow using Supabase client
- Set up project guidelines and development best practices
- Configured E2E testing with Maestro for critical user journeys
- **📖 E2E Testing Documentation**: `/docs/testing/e2e-testing-guide.md` (complete setup guide) and `/docs/testing/e2e-quick-reference.md` (quick reference)
- Added club details screen with rankings and recent matches display
- Fixed multiple authentication and database sync issues
- Implemented professional tennis score display component
- Added new memory about changelog updates and ongoing development progress
- Completed sign-up and solution flow integration with comprehensive onboarding experience, focusing on frictionless user registration and immediate app value
- Documented ongoing improvements in end-to-end testing strategies and reliability
- **Implemented comprehensive notification badge system (Issue #49)** with intelligent caching, real-time updates, urgency-based color coding, and club-specific badge indicators
- **Built contextual prompt system (Issue #46)** providing smart user guidance with rule-based prompts, priority levels, smooth animations, and progressive disclosure
- **Completed Quick Actions Section (Issue #48)** with collapsible card design, 5 action types, urgency-based color coding, optimistic UI updates, and dashboard-like functionality without additional navigation
- Created comprehensive development test panels for badges, prompts, and quick actions
- Enhanced app store readiness with proper configuration and GitHub issues for systematic release preparation
- Integrated complete notification ecosystem: badges → contextual prompts → quick actions for seamless user engagement
- **🔧 Issue #44 - Advanced Profile Management Features**: Successfully implemented comprehensive profile management system with photo upload, tennis information fields (skill level, playing style), privacy controls, and enhanced form validation. Features include camera/gallery photo selection, local file storage, database schema updates, and clean TypeScript interfaces. All advanced profile settings are now functional with proper error handling and user feedback.
- Profile management system now includes photo upload functionality and comprehensive tennis information collection
- **📱 Milestones 59-60 - App Store Preparation**: Completed comprehensive App Store metadata preparation and localization strategy. Created APP_STORE_METADATA.md with all required information, defined screenshot requirements, and established phased localization approach. Documentation available at `/docs/app-store/milestone-59-60-documentation.md`
- Removed onboarding pages after careful consideration of user flow and app simplification, focusing on direct and streamlined user experience
- Documented notifications implementation and committed changes to GitHub repository
- Always find the root cause of the problem rather than getting a fix that does not fix the source
- You can view the expo logs at 'logs/expo.log' (use a subagent to tail at least 200 lines and return the relevant lines)
- **🚀 v1.0.1 Release Preparation (Jan 2025)**: Major updates for App Store submission including challenge management improvements, push notification configuration, and Apple Sign In temporarily disabled for simpler initial release
- **Challenge System Enhancement**: Implemented pending challenge tracking with disabled buttons, comprehensive challenge visibility in club detail page, and 7-day auto-expiration
- **TypeScript Fixes**: Resolved 200+ compilation errors including icon names, profile photo types, and router imports
- **App Store Strategy**: v1.0.0 to TestFlight, v1.0.1 for production with push notifications enabled

[... rest of the existing content remains unchanged ...]