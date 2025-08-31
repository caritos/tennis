-- ============================================================================
-- FORCE CLEAN ALL DATA (More Thorough Version)
-- This handles RLS policies and foreign key constraints
-- ============================================================================

-- Step 1: Temporarily disable RLS to ensure deletions work
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_counters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users DISABLE ROW LEVEL SECURITY;

-- Step 2: Use TRUNCATE CASCADE for complete cleanup (faster and more thorough)
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.invitation_responses CASCADE;
TRUNCATE TABLE public.blocked_users CASCADE;
TRUNCATE TABLE public.reports CASCADE;
TRUNCATE TABLE public.challenge_counters CASCADE;
TRUNCATE TABLE public.challenges CASCADE;
TRUNCATE TABLE public.matches CASCADE;
TRUNCATE TABLE public.match_invitations CASCADE;
TRUNCATE TABLE public.club_members CASCADE;
TRUNCATE TABLE public.clubs CASCADE;
TRUNCATE TABLE public.users CASCADE;

-- Step 3: Clean auth.users directly (this might require superuser privileges)
DELETE FROM auth.users;

-- Step 4: Re-enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Step 5: Verification
SELECT 
    'Cleanup Complete' as status,
    (SELECT COUNT(*) FROM auth.users) as auth_users_remaining,
    (SELECT COUNT(*) FROM public.users) as public_users_remaining,
    (SELECT COUNT(*) FROM public.clubs) as clubs_remaining,
    (SELECT COUNT(*) FROM public.matches) as matches_remaining;