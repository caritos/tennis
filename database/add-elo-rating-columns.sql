-- Migration: Add ELO rating columns to existing users table
-- Run this in Supabase SQL Editor if you already have a users table

-- Add ELO rating column (default 1200 for new ELO rating system)
ALTER TABLE users ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1200;

-- Add games played column for K-factor calculation
ALTER TABLE users ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0;

-- Create index on elo_rating for ranking queries
CREATE INDEX IF NOT EXISTS idx_users_elo_rating ON users(elo_rating DESC);

-- Update existing users: set games_played based on their match history
UPDATE users SET games_played = (
  SELECT COALESCE(COUNT(*), 0)
  FROM matches 
  WHERE matches.player1_id = users.id 
     OR matches.player2_id = users.id 
     OR matches.player3_id = users.id 
     OR matches.player4_id = users.id
);

-- Verify the migration
SELECT 'ELO rating columns added successfully' as message
WHERE EXISTS (
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'users' 
    AND column_name IN ('elo_rating', 'games_played')
  GROUP BY table_name
  HAVING COUNT(*) = 2
);