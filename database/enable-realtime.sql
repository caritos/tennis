-- ============================================================================
-- ENABLE SUPABASE REALTIME FOR ALL NECESSARY TABLES
-- Run this in the Supabase SQL Editor to enable real-time subscriptions
-- ============================================================================

-- Enable Realtime for the matches table (critical for match updates)
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Enable Realtime for the users table (for ELO rating updates)
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Enable Realtime for the clubs table (for club updates)
ALTER PUBLICATION supabase_realtime ADD TABLE clubs;

-- Enable Realtime for the club_members table (for membership changes)
ALTER PUBLICATION supabase_realtime ADD TABLE club_members;

-- Enable Realtime for the notifications table (for push notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable Realtime for the challenges table (for challenge updates)
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;

-- Enable Realtime for the match_invitations table (for invitation updates)
ALTER PUBLICATION supabase_realtime ADD TABLE match_invitations;

-- Enable Realtime for the invitation_responses table (for response updates)
ALTER PUBLICATION supabase_realtime ADD TABLE invitation_responses;

-- Verify which tables have Realtime enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- ============================================================================
-- IMPORTANT: After running this script, you should see all the tables listed
-- in the Supabase Dashboard under Database > Replication > supabase_realtime
-- ============================================================================