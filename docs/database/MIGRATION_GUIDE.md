# Supabase Migration Guide

This guide explains how to use environment-aware Supabase CLI for database migrations and type generation in the Play Serve tennis app.

## Setup

The project is configured with:
- **Environment-aware migrations** that automatically detect current environment
- **Development database**: `lbfoobwxjnyymnxdajxh.supabase.co` 
- **Production database**: `dgkdbqloehxruoijylzw.supabase.co`
- **Migration files** in `supabase/migrations/`
- **Generated TypeScript types** in `types/supabase.ts` (environment-specific)

## Commands

### Environment Detection

The system automatically detects your current environment:
- **Development**: If `.env.development` exists → uses `lbfoobwxjnyymnxdajxh`
- **Production**: If `.env.production` exists → uses `dgkdbqloehxruoijylzw`

### Type Generation
```bash
# Generate TypeScript types from current environment's database
npm run db:generate-types

# Will output:
# 🔧 Detected environment: development  
# 📊 Using Supabase project: lbfoobwxjnyymnxdajxh
# ✅ TypeScript types generated successfully!
```

### Creating Migrations
```bash
# Create a new migration from current environment's schema changes
npm run db:diff -- migration_name

# Example: Create migration for new table
npm run db:diff -- add_user_preferences_table

# Note: Requires Docker for schema diffing
```

### Applying Migrations
```bash
# Push migrations to current environment's database
npm run db:push

# Will show confirmation for production:
# ⚠️  WARNING: You are about to modify the PRODUCTION database!

# Reset local database (requires Docker)
npm run db:reset
```

## Migration Workflow

### 1. Making Schema Changes

**Option A: Direct Database Changes**
1. Make changes in Supabase Dashboard or via SQL
2. Generate migration: `npm run db:diff -- describe_your_changes`
3. Review the generated migration file
4. Commit the migration file

**Option B: Migration-First Approach**
1. Create migration file manually in `supabase/migrations/`
2. Use timestamp naming: `YYYYMMDDHHMMSS_description.sql`
3. Apply with: `npm run db:push`

### 2. Updating Types

After any schema changes:
```bash
# Regenerate TypeScript types
npm run db:generate-types

# Commit the updated types
git add types/supabase.ts
git commit -m "Update database types"
```

### 3. Working with Types

```typescript
import { Database } from '../types/supabase';
import { supabase } from '../lib/supabase';

// Use generated types
type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

// Type-safe database operations
const { data, error } = await supabase
  .from('users')
  .select('*')
  .returns<User[]>();
```

## File Structure

```
supabase/
├── config.toml                    # Supabase project configuration
└── migrations/                    # Database migration files
    └── 20250826120000_initial_schema.sql

types/
└── supabase.ts                   # Generated TypeScript types

database/
└── setup.sql                     # Legacy setup script (deprecated)
```

## Best Practices

### Migration Files
- **Use descriptive names**: `20250826120000_add_notification_preferences.sql`
- **Include rollback instructions**: Add comments for how to undo changes
- **Test migrations**: Always test on development before production
- **Small, atomic changes**: One logical change per migration

### Type Safety
- **Regenerate types frequently**: After every schema change
- **Use generated types**: Replace manual type definitions
- **Commit type updates**: Include in your git workflow

### Example Migration

```sql
-- Migration: 20250826130000_add_user_preferences.sql
-- Adds user notification preferences

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  challenge_notifications BOOLEAN DEFAULT true,
  match_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Rollback instructions:
-- DROP TABLE IF EXISTS public.user_preferences;
```

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```
   Error: Cannot connect to Docker daemon
   ```
   **Solution**: Install and start Docker Desktop

2. **Type generation fails**
   ```
   Error: Project not found
   ```
   **Solution**: Ensure you're linked to the correct project
   ```bash
   supabase link --project-ref dgkdbqloehxruoijylzw
   ```

3. **Migration conflicts**
   ```
   Error: Migration already exists
   ```
   **Solution**: Check existing migrations and use unique timestamps

### Local Development

For local development with full migration testing:
1. Install Docker Desktop
2. Run `supabase start` to start local Supabase
3. Apply migrations with `supabase db reset`
4. Test your application against local database

## Migration History

- `20250826120000_initial_schema.sql` - Initial database schema with all tables and RLS policies

## Next Steps

1. **Replace setup.sql usage** with migration-based workflow
2. **Update services** to use generated types instead of manual types
3. **Add CI/CD integration** for automatic type generation
4. **Set up local development** environment with Docker