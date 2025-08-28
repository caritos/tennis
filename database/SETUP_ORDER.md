# Database Setup Order Guide

## For a Fresh Database Setup

Follow these steps **IN ORDER** to set up a new database from scratch:

### Step 1: Core Schema Setup
```sql
-- Run first - creates all tables with basic structure
database/setup.sql
```

### Step 2: Apply Migrations (Automatic)
```bash
# Migrations are automatically applied in timestamp order
npm run db:push
```
Or manually apply in order:
- `20250826120000_initial_schema.sql` - Base tables
- `20250826140000_add_rating_columns.sql` - Rating system
- `20250826150000_add_club_member_status.sql` - Member status
- `20250826160000_add_match_reports.sql` - Reporting system
- `20250826170000_add_user_roles.sql` - User roles
- `20250826180000_create_challenge_group_tables.sql` - Challenge groups
- `20250826190000_add_phone_contact_fields.sql` - Contact info
- `20250826210000_create_notification_functions.sql` - Notification functions
- (continue through all timestamps...)

### Step 3: PostgreSQL Functions
After tables exist, create the functions:
```sql
-- Order matters for dependencies
1. database/functions/create-match-result-notification-function.sql
2. database/functions/create-club-notification-function.sql
3. database/functions/create-club-join-notification-function.sql
4. database/functions/challenge-notification-function.sql
5. database/functions/create-match-invitation-notification-function.sql
```

### Step 4: Fix Missing Constraints (if needed)
```sql
-- Only if you get foreign key errors
database/manual/manual_migration_foreign_keys.sql
```

## Quick Setup Script

For convenience, here's the order in a single script:

```bash
# 1. Switch to production/development
npm run env:prod  # or env:dev

# 2. Reset database (WARNING: Deletes all data!)
npx supabase db reset

# 3. Push all migrations
npm run db:push

# 4. Apply functions via Supabase Dashboard
# (Copy each function file to SQL Editor and run)
```

## Verification Checklist

After setup, verify these exist:
- [ ] Tables: users, clubs, matches, challenges, match_invitations, notifications
- [ ] Foreign keys: All relationships properly linked
- [ ] Functions: All notification functions created
- [ ] RLS: Row Level Security enabled on all tables
- [ ] Indexes: Performance indexes created

## Common Issues

1. **"relation does not exist"** - Run setup.sql first
2. **"foreign key constraint"** - Run manual_migration_foreign_keys.sql
3. **"function does not exist"** - Run function files in order
4. **"permission denied"** - Check RLS policies

## Files You DON'T Need to Run

These are documentation/reference only:
- `simplified-schema.sql` - Just documentation
- `README.md` - Documentation
- Files in `migrations/` if using `npm run db:push` (applied automatically)