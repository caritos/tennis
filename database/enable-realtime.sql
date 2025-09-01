-- ============================================================================
-- ENABLE SUPABASE REALTIME FOR CORE TABLES
-- This script enables realtime replication for all tables that need it
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable realtime replication for the core tables
-- This allows postgres_changes events to be sent to subscribed clients

-- 1. Matches table (most important for your issue)
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- 2. Users table (for ELO rating updates)
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- 3. Club members table (for member changes)
ALTER TABLE public.club_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_members;

-- 4. Clubs table (for club updates)
ALTER TABLE public.clubs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clubs;

-- 5. Notifications table (for real-time notifications)
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 6. Challenges table (for challenge updates)
ALTER TABLE public.challenges REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;

-- 7. Match invitations and responses
ALTER TABLE public.match_invitations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_invitations;

ALTER TABLE public.invitation_responses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invitation_responses;

-- Verify realtime is enabled
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename = ANY(
            SELECT tablename 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime'
        ) THEN '✅ ENABLED'
        ELSE '❌ NOT ENABLED'
    END AS realtime_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'matches', 'users', 'club_members', 'clubs', 
        'notifications', 'challenges', 'match_invitations', 
        'invitation_responses'
    )
ORDER BY tablename;

-- ============================================================================
-- IMPORTANT NOTES:
-- 
-- 1. REPLICA IDENTITY FULL means the entire row (before and after) is sent
--    in realtime events. This is necessary for your app to work properly.
--
-- 2. After running this script, your realtime subscriptions should start
--    receiving postgres_changes events when data is inserted/updated/deleted.
--
-- 3. You may need to restart your app connections for the changes to take effect.
-- ============================================================================