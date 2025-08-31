-- Add columns to track targeted players in match invitations
-- These columns allow "looking to play" invitations to target specific players
-- and display "Waiting for [playerName] to respond" instead of generic "Looking for players"

-- Add targeted_players column to store user IDs of targeted players
ALTER TABLE match_invitations 
ADD COLUMN IF NOT EXISTS targeted_players UUID[] DEFAULT NULL;

-- Add targeted_player_names column to store names of targeted players for display
ALTER TABLE match_invitations 
ADD COLUMN IF NOT EXISTS targeted_player_names TEXT[] DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN match_invitations.targeted_players IS 'Array of user IDs for targeted invitations (specific players invited)';
COMMENT ON COLUMN match_invitations.targeted_player_names IS 'Array of player names corresponding to targeted_players for display purposes';