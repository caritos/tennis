-- Add targeted_players field to match_invitations table
-- This allows storing specific player IDs for targeted invitations

ALTER TABLE match_invitations 
ADD COLUMN targeted_players UUID[] DEFAULT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN match_invitations.targeted_players IS 'Array of user IDs for targeted invitations. NULL means open to all club members.';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_match_invitations_targeted_players 
ON match_invitations USING GIN (targeted_players);