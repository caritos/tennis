-- Add 'match_challenge' type to notifications table type constraint

-- Drop the existing type constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated constraint that includes 'match_challenge'
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'challenge', 
    'match_invitation', 
    'match_challenge',  -- Add this new type for targeted invitations
    'match_result', 
    'ranking_update', 
    'club_activity'
));