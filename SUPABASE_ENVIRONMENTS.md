# Supabase Environment Setup

This guide explains how to set up separate Supabase projects for development and production to protect your live data.

## Overview

The app is configured to use different Supabase projects based on the build environment:
- **Development**: Uses your current Supabase project for testing
- **Production**: Uses a separate Supabase project for live users

## Setup Steps

### 1. Create Production Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Name it something like "tennis-production" or "play-serve-prod"
3. Copy the project URL and anon key from Settings > API

### 2. Update Environment Variables

The app now uses environment-specific configuration files:

- `.env.development` - Your current development credentials (already set up)
- `.env.production` - Production credentials (needs to be updated)

Edit `.env.production` and replace the placeholder values:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

### 3. Database Schema

**⚠️ Note: Database schema replication to production should be done when your schema is stable and ready for release.**

There's an open GitHub issue (#77) tracking this task. When you're ready:

1. Export your development schema:
   - Go to your development project in Supabase Dashboard
   - SQL Editor > New Query
   - Run: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
   - Export the schema using pg_dump or Supabase's migration tools

2. Import to production:
   - Apply the same schema to your production project
   - Ensure all tables, RLS policies, and functions are created

**Until then**: Your production Supabase project will exist but won't have the database tables. This is intentional to allow you to continue developing and changing the schema without maintaining two environments.

### 4. Building for Different Environments

The EAS build profiles automatically select the right environment:

```bash
# Development build (uses .env.development)
eas build --profile development

# Production build (uses .env.production)
eas build --profile production
```

### 5. Environment Detection in Code

The app uses a centralized config in `lib/config.ts`:

```typescript
import { config } from './lib/config';

// Check current environment
if (config.isDevelopment) {
  console.log('Running in development mode');
}

// Supabase is automatically configured with the right credentials
import { supabase } from './lib/supabase';
```

## Important Notes

1. **Never commit `.env.production`** with real credentials to version control
2. **Database migrations** should be tested in development first
3. **RLS policies** must be identical between environments
4. **Edge functions** need to be deployed to both projects separately

## Testing Production Locally

To test with production credentials locally:

1. Create `.env.local` and copy production credentials
2. Run: `npx expo start`
3. The app will use `.env.local` values

## Troubleshooting

- **Missing environment variables**: Check that all `EXPO_PUBLIC_*` variables are set
- **Build failures**: Ensure EAS has access to environment variables
- **Connection errors**: Verify Supabase project is active and URL is correct

## Security Best Practices

1. Use different passwords for dev/prod Supabase projects
2. Enable RLS on all tables in production
3. Regularly rotate anon keys if exposed
4. Monitor Supabase dashboard for unusual activity
5. Set up proper CORS policies for production