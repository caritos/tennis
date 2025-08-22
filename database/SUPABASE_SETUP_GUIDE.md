# Supabase Database Setup Guide

## Overview

This guide walks you through setting up the complete Supabase backend for the Tennis Club app. The database includes all tables needed for users, clubs, matches, challenges, and the "looking to play" feature.

## Prerequisites

- Supabase account (sign up at [supabase.com](https://supabase.com))
- Basic SQL knowledge (optional - scripts are provided)

## Step-by-Step Setup

### 1. Create New Supabase Project

1. **Go to [supabase.com](https://supabase.com)** and sign in
2. **Click "New Project"**
3. **Fill in project details:**
   - **Project Name**: `tennis-club-app`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
4. **Click "Create new project"**
5. **Wait for project creation** (takes 2-3 minutes)

### 2. Configure Environment Variables

After project creation, get your project credentials:

1. **Go to Settings → API** in your Supabase dashboard
2. **Copy the following values:**
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon Public Key** (long string starting with `eyJ...`)

3. **Update your `.env.local` file:**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create Database Tables and Configure Security

1. **Go to SQL Editor** in your Supabase dashboard
2. **Copy and paste** the entire contents of `database/production-setup-complete.sql`
3. **Click "Run"** to execute the script
4. **Verify success** - you should see completion message:
   - ✅ All 9 tables created successfully
   - ✅ RLS policies configured
   - ✅ Indexes and triggers configured
   - ✅ Fixed infinite recursion in user policies

### 4. Configure Authentication

1. **Go to Authentication → Settings**
2. **Configure the following:**
   - **Site URL**: `exp://localhost:8081` (for Expo development)
   - **Email Confirmation**: Disabled (for easier testing)
   - **Email Templates**: Customize if needed

3. **Enable Social Auth** (optional):
   - **Apple Sign In**: Configure with your Apple Developer credentials
   - **Google Sign In**: Configure with Google OAuth credentials

### 5. Test the Setup

1. **Start your Expo app**: `npx expo run:ios`
2. **Test user registration**: Create a new account
3. **Verify in Supabase**: Go to Authentication → Users
   - You should see your test user
   - Check Table Editor → users table for user data

## Database Schema Overview

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles | full_name, email, phone, role |
| `clubs` | Tennis clubs | name, location, lat/lng, creator_id |
| `matches` | Match results | players, scores, match_type, date |
| `club_members` | Club memberships | club_id, user_id, joined_at |

### Feature Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `match_invitations` | "Looking to Play" | creator_id, match_type, date |
| `invitation_responses` | Match responses | invitation_id, user_id, status |
| `challenges` | Direct challenges | challenger_id, challenged_id |
| `challenge_counters` | Challenge counter-offers | challenge_id, counter_by |

### Data Types

- **UUIDs**: All IDs use UUID v4 for security
- **Timestamps**: All timestamps use `TIMESTAMP WITH TIME ZONE`
- **Constraints**: Proper foreign keys and check constraints
- **Indexes**: Optimized for common query patterns

## Security Features

### Row Level Security (RLS)

All tables have RLS policies that ensure:

- **Users** can only see/modify their own profile data
- **Clubs** are readable by all, modifiable by creators only
- **Matches** are visible to participants and club members
- **Memberships** allow users to join/leave clubs freely
- **Invitations** are scoped to club members
- **Challenges** are visible to participants and club members

### Authentication Integration

- Uses Supabase Auth for user management
- JWT tokens for secure API access
- Automatic user profile sync
- Support for email/password and social login

## Environment Setup

### Development
```bash
# .env.local
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
```

### Production
```bash
# Production environment variables
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
```

## Troubleshooting

### Common Issues

#### "relation does not exist" Error
- **Cause**: Tables not created properly
- **Solution**: Re-run `production-setup-complete.sql` script

#### "permission denied" Error
- **Cause**: RLS policies not configured
- **Solution**: Re-run `production-setup-complete.sql` script

#### Authentication Not Working
- **Cause**: Environment variables incorrect
- **Solution**: Double-check URL and anon key in `.env.local`

#### Can't See Data
- **Cause**: RLS policies too restrictive
- **Solution**: Check policies in Authentication → Policies

### Debugging Tips

1. **Check SQL Editor** for error messages
2. **Use Table Editor** to manually verify data
3. **Monitor Real-time** tab for live data changes
4. **Check Authentication** tab for user sessions
5. **Review Logs** in Logs & Stats section

## Maintenance

### Regular Tasks

- **Monitor Usage**: Check project usage in dashboard
- **Review Logs**: Check for errors or unusual activity
- **Update Policies**: Modify RLS policies as features evolve
- **Backup Data**: Regular backups through Supabase dashboard

### Scaling Considerations

- **Indexes**: Add more indexes as query patterns emerge
- **Partitioning**: Consider table partitioning for large datasets
- **Connection Pooling**: Enable for high traffic
- **Edge Functions**: Move complex logic to server-side functions

## Next Steps

After completing this setup:

1. **Test all app features** to ensure database integration works
2. **Monitor performance** and add indexes as needed
3. **Set up staging environment** with separate Supabase project
4. **Configure production environment** when ready to deploy
5. **Set up monitoring** and alerts for production usage

## Support

For issues with this setup:

1. **Check Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
2. **Review app logs**: Check Expo console and Supabase logs
3. **Test with curl**: Verify API endpoints directly
4. **Check GitHub Issues**: See if others have similar problems

---

**Last Updated**: 2025-07-29  
**Supabase Version**: Latest  
**Expo SDK**: 53.0.0