-- ============================================================================
-- CLEAN ALL DATA FROM PRODUCTION DATABASE
-- This will delete all data but keep the table structure intact
-- DANGER: This is irreversible! Make sure you want to start fresh!
-- ============================================================================

-- WARNING: Uncomment the sections below ONLY when you're ready to delete all data

/*
-- Step 1: Disable triggers temporarily to avoid cascade issues
SET session_replication_role = replica;

-- Step 2: Delete all data in dependency order (children first, parents last)

-- Delete notification and response data
DELETE FROM public.notifications;
DELETE FROM public.invitation_responses;

-- Delete challenge and match data  
DELETE FROM public.challenges;
DELETE FROM public.challenge_counters;
DELETE FROM public.matches;
DELETE FROM public.match_invitations;

-- Delete user relationships
DELETE FROM public.blocked_users;
DELETE FROM public.reports;
DELETE FROM public.club_members;

-- Delete core entities (clubs before users due to creator_id reference)
DELETE FROM public.clubs;

-- Delete users (this will also clean auth.users via cascade)
DELETE FROM auth.users;

-- Step 3: Reset sequences (so IDs start from 1 again)
-- Note: Only works if you have sequences, most of your tables use UUIDs

-- Step 4: Re-enable triggers
SET session_replication_role = DEFAULT;

-- Step 5: Verify everything is clean
SELECT 
    schemaname,
    tablename,
    n_tup_ins - n_tup_del as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
*/

-- ============================================================================
-- SAFER ALTERNATIVE: Delete in stages with confirmation
-- ============================================================================

-- Run these one at a time to be extra careful:

-- Stage 1: Clear secondary data
/*
DELETE FROM public.notifications;
DELETE FROM public.invitation_responses;
DELETE FROM public.blocked_users;
DELETE FROM public.reports;
*/

-- Stage 2: Clear match/challenge data  
/*
DELETE FROM public.challenges;
DELETE FROM public.challenge_counters;
DELETE FROM public.matches;
DELETE FROM public.match_invitations;
*/

-- Stage 3: Clear memberships
/*
DELETE FROM public.club_members;
*/

-- Stage 4: Clear clubs
/*
DELETE FROM public.clubs;
*/

-- Stage 5: Clear users (this also deletes from auth.users)
/*
DELETE FROM auth.users;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check row counts in all tables
SELECT 
    'public' as schema,
    tablename,
    (SELECT COUNT(*) FROM public.users) as users_count,
    (SELECT COUNT(*) FROM public.clubs) as clubs_count,
    (SELECT COUNT(*) FROM public.club_members) as members_count,
    (SELECT COUNT(*) FROM public.matches) as matches_count,
    (SELECT COUNT(*) FROM public.match_invitations) as invitations_count,
    (SELECT COUNT(*) FROM public.challenges) as challenges_count,
    (SELECT COUNT(*) FROM public.notifications) as notifications_count
FROM pg_tables 
WHERE schemaname = 'public' 
LIMIT 1;

-- Check auth.users count
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- ============================================================================
-- POST-CLEANUP TASKS
-- ============================================================================

/*
After running this script:

1. ✅ All user data deleted
2. ✅ All clubs and memberships deleted  
3. ✅ All matches and challenges deleted
4. ✅ All notifications deleted
5. ✅ Database structure preserved
6. ✅ Ready for fresh data entry

You can now:
- Create new user accounts
- Set up new clubs
- Enter valid production data
- Test with clean slate

The schema, RLS policies, functions, and indexes remain intact.
*/

-- ============================================================================
-- END OF DATA CLEANUP SCRIPT
-- ============================================================================