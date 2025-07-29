# EAS App Store Deployment Guide

## Overview

This guide walks through deploying the Tennis Club app to the Apple App Store using Expo Application Services (EAS). EAS provides a modern, cloud-based solution for building and submitting React Native apps without the complexity of managing local build environments.

## What is EAS?

**EAS (Expo Application Services)** consists of:
- **EAS Build**: Cloud-based build service for creating production app binaries
- **EAS Submit**: Automated submission service for app stores
- **EAS Update**: Over-the-air update service (for future use)

## Prerequisites

### Required Accounts
1. **Expo Account** - Free or paid tier (sign up at [expo.dev](https://expo.dev/signup))
2. **Apple Developer Program** - $99/year (required for App Store distribution)
   - ⚠️ **Note**: Your membership expired July 17, 2024 - needs renewal before proceeding

### Required Tools
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version
```

### Apple Developer Account Requirements
- **Renewed membership** ($99/year)
- **App ID** configured in Apple Developer Portal
- **Bundle Identifier**: `com.caritos.tennis` (already configured in app.json)

## Step-by-Step Deployment Process

### Phase 1: Initial EAS Setup

#### 1. Login to EAS
```bash
# Login with your Expo account
eas login

# Verify login
eas whoami
```

#### 2. Initialize EAS in Project
```bash
# Initialize EAS configuration
eas init
```

This creates `eas.json` configuration file in your project root.

#### 3. Configure Build Profiles
The `eas.json` file will be created with default profiles. Update it for your needs:

```json
{
  "cli": {
    "version": ">= 7.8.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Phase 2: Apple Developer Configuration

#### 1. Renew Apple Developer Membership
- Go to [developer.apple.com](https://developer.apple.com)
- Renew your expired membership ($99/year)
- Wait for approval (usually immediate)

#### 2. Configure App ID
1. **Go to Certificates, Identifiers & Profiles**
2. **Create/Update App ID**:
   - **Bundle ID**: `com.caritos.tennis`
   - **App Name**: `Tennis Club`
   - **Enable capabilities**:
     - Sign in with Apple
     - Push Notifications (if needed)

#### 3. App Store Connect Setup
1. **Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)**
2. **Create New App**:
   - **Name**: `Tennis Club`
   - **Bundle ID**: `com.caritos.tennis`
   - **SKU**: `tennis-club-ios`
   - **Primary Language**: English

### Phase 3: Build Production App

#### 1. Create Production Build
```bash
# Build for iOS App Store
eas build --platform ios --profile production
```

**What happens during build:**
- EAS creates a cloud build environment
- Installs dependencies and compiles your app
- Signs the app with Apple certificates
- Generates production-ready `.ipa` file
- Provides build URL and download link

#### 2. Monitor Build Progress
- Build typically takes 10-15 minutes
- Monitor progress at the provided URL
- Download logs if build fails
- Build artifacts are stored for 30 days

### Phase 4: App Store Submission

#### 1. Submit to App Store
```bash
# Submit the latest production build
eas submit --platform ios
```

**Authentication Options:**
- **App Store Connect API Key** (recommended)
- **App-specific password** (alternative)

#### 2. Configure Submission Details
EAS will prompt for:
- **Apple ID** (your developer account email)
- **App-specific password** or API key
- **Build selection** (if multiple builds available)

#### 3. Automatic Upload
EAS handles:
- Binary upload to App Store Connect
- Metadata synchronization
- Build processing initiation

### Phase 5: App Store Connect Finalization

#### 1. Complete App Information
In App Store Connect, configure:

**App Information:**
- **Name**: Tennis Club
- **Subtitle**: Connect with local tennis players
- **Category**: Sports
- **Content Rights**: Original content

**Pricing and Availability:**
- **Price**: Free
- **Availability**: All territories

**App Privacy:**
- **Privacy Policy URL**: (required)
- **Data Collection**: Configure based on app usage

#### 2. Version Information
**What's New in This Version:**
```
Connect with tennis players in your area! 

Features:
• Join local tennis clubs
• Record match results
• Challenge other players
• Find practice partners
• Track your tennis statistics

Join the tennis community today!
```

**Keywords**: `tennis, sports, club, players, matches, community`

#### 3. Screenshots and Metadata
**Required Screenshots:**
- **6.7" Display** (iPhone 15 Pro Max): 5 screenshots
- **6.1" Display** (iPhone 15 Pro): 5 screenshots
- **5.5" Display** (iPhone 8 Plus): Optional but recommended

**App Icon**: 1024x1024 pixels (already configured in assets)

#### 4. Submit for Review
1. **Complete all sections** in App Store Connect
2. **Add reviewer notes** if needed
3. **Submit for Review**
4. **Review typically takes 24-48 hours**

## Advanced Configuration

### EAS Build Optimization

#### Custom eas.json Configuration
```json
{
  "cli": {
    "version": ">= 7.8.0"
  },
  "build": {
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release",
        "scheme": "Tennis Club",
        "bundleIdentifier": "com.caritos.tennis"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true,
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "your-app-store-connect-app-id",
        "appleId": "your-apple-developer-email",
        "ascApiKeyPath": "./private/AuthKey_XXXXXXXXXX.p8",
        "ascApiKeyId": "XXXXXXXXXX",
        "ascApiKeyIssuerId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  }
}
```

### Automated Workflows

#### GitHub Actions Integration
Create `.github/workflows/build-and-deploy.yml`:

```yaml
name: EAS Build and Submit
on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-and-submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      
      - name: Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build and Submit
        run: eas build --platform ios --profile production --auto-submit
```

### Build Optimization

#### Reduce Build Time
```json
{
  "build": {
    "production": {
      "cache": {
        "disabled": false,
        "cacheDefaultPaths": true,
        "customPaths": [
          "node_modules",
          "ios/Pods"
        ]
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Apple Developer Membership Expired
**Error**: "Your membership has expired"
**Solution**: Renew membership at developer.apple.com ($99/year)

#### 2. Bundle Identifier Mismatch
**Error**: "Bundle identifier doesn't match"
**Solution**: Ensure `com.caritos.tennis` matches in:
- `app.json` → `ios.bundleIdentifier`
- Apple Developer Portal App ID
- App Store Connect app configuration

#### 3. Build Fails - Missing Dependencies
**Error**: Various dependency errors
**Solution**: 
```bash
# Clear caches and reinstall
npm run reset-project
npm install
npx expo install --fix
```

#### 4. Submission Authentication Failed
**Error**: "Invalid credentials"
**Solution**: 
- Verify Apple ID and app-specific password
- Or set up App Store Connect API key (recommended)

#### 5. App Store Connect API Issues
**Error**: "API rate limit" or "Server error"
**Solution**: Wait and retry, or use different authentication method

### Debug Commands

```bash
# Check EAS status
eas whoami
eas build:list --platform ios

# View build details
eas build:view <build-id>

# Check submission status
eas submit:list --platform ios

# Clear EAS cache
eas build --platform ios --profile production --clear-cache
```

## Cost Considerations

### EAS Pricing (2024)
- **Free Tier**: 30 builds/month
- **Production Tier**: $29/month for unlimited builds
- **Enterprise**: Custom pricing

### Apple Costs
- **Developer Program**: $99/year
- **App Store**: No additional fees for free apps

## Timeline Expectations

### Initial Setup
- **EAS Configuration**: 30 minutes
- **Apple Developer Setup**: 1-2 hours
- **First Build**: 15-20 minutes
- **App Store Connect**: 1-2 hours

### Ongoing Releases
- **Build Creation**: 10-15 minutes
- **Submission**: 5 minutes
- **Review Process**: 24-48 hours

## Security Best Practices

### Credentials Management
- **Never commit** Apple credentials to git
- **Use environment variables** for sensitive data
- **Rotate API keys** regularly
- **Use App Store Connect API keys** instead of passwords

### Build Security
- **Enable two-factor authentication** on all accounts
- **Monitor build logs** for security issues
- **Use latest EAS CLI** version
- **Review third-party dependencies**

## Maintenance

### Regular Tasks
- **Monitor build success rates**
- **Update EAS CLI**: `npm update -g eas-cli`
- **Review build logs** for warnings
- **Update Apple certificates** before expiration

### Performance Monitoring
- **Track build times** and optimize as needed
- **Monitor app crashes** in App Store Connect
- **Review user feedback** and ratings

## Next Steps

After successful App Store deployment:

1. **Set up analytics** (Firebase, Crashlytics)
2. **Configure push notifications**
3. **Plan OTA updates** with EAS Update
4. **Set up CI/CD pipeline** for automated releases
5. **Monitor app performance** and user feedback

---

**Last Updated**: 2025-07-29  
**EAS CLI Version**: Latest  
**Expo SDK**: 53.0.0