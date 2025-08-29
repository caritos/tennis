-- Cleanup script for orphaned invitation responses with undefined/null status
-- This removes invitation responses that don't have a proper status value
-- Run this in development environment only!

-- First, let's see what we're about to delete
SELECT 
    ir.id,
    ir.invitation_id,
    ir.user_id,
    ir.status,
    ir.created_at,
    u.full_name as user_name,
    mi.player1_name as invitation_creator
FROM invitation_responses ir
LEFT JOIN users u ON ir.user_id = u.id
LEFT JOIN match_invitations mi ON ir.invitation_id = mi.id
WHERE ir.status IS NULL 
   OR ir.status NOT IN ('confirmed', 'interested', 'declined', 'maybe');

-- Count of records to be deleted
SELECT COUNT(*) as orphaned_responses_count
FROM invitation_responses
WHERE status IS NULL 
   OR status NOT IN ('confirmed', 'interested', 'declined', 'maybe');

-- Delete the orphaned responses
DELETE FROM invitation_responses
WHERE status IS NULL 
   OR status NOT IN ('confirmed', 'interested', 'declined', 'maybe');

-- Verify deletion
SELECT COUNT(*) as remaining_orphaned_count
FROM invitation_responses
WHERE status IS NULL 
   OR status NOT IN ('confirmed', 'interested', 'declined', 'maybe');