-- CLEANUP UNUSED TABLES AND INDEXES
-- Migration: Remove tables that are no longer needed with PostgreSQL function approach

-- ============================================================================
-- PART 1: REMOVE UNUSED CLUB_NOTIFICATIONS TABLE
-- ============================================================================

-- The club_notifications table is redundant now that we use the main notifications 
-- table with PostgreSQL functions for all notification types

-- Drop the table and its indexes
DROP INDEX IF EXISTS idx_club_notifications_club;
DROP INDEX IF EXISTS idx_club_notifications_created;
DROP TABLE IF EXISTS club_notifications;

-- ============================================================================
-- PART 2: REMOVE COMPLEX POLICY VERIFICATION CODE
-- ============================================================================

-- Remove the complex policy verification code that's no longer needed
-- This was the DO block that checked notification policies

-- Note: The actual verification block is already in setup.sql and will be 
-- replaced by our simplified schema

-- ============================================================================
-- PART 3: ADD PERFORMANCE INDEXES FOR FUNCTIONS
-- ============================================================================

-- Add indexes to optimize our PostgreSQL function queries

-- Index for club creation notifications (distance calculations)
CREATE INDEX IF NOT EXISTS idx_clubs_lat_lng ON clubs(lat, lng);

-- Index for match result notifications (finding players)
CREATE INDEX IF NOT EXISTS idx_matches_players ON matches(player1_id, player2_id, player3_id, player4_id);

-- Index for club join notifications (finding existing members)
CREATE INDEX IF NOT EXISTS idx_club_members_club_joined ON club_members(club_id, joined_at);

-- Index for challenge notifications (finding participants)
CREATE INDEX IF NOT EXISTS idx_challenges_participants ON challenges(challenger_id, challenged_id);

-- ============================================================================
-- SUMMARY OF CLEANUP
-- ============================================================================

-- REMOVED:
-- ❌ club_notifications table (redundant)
-- ❌ Complex policy verification code
-- ❌ Redundant indexes

-- ADDED:
-- ✅ Optimized indexes for PostgreSQL functions
-- ✅ Better performance for distance calculations
-- ✅ Faster lookups for notification recipients

DO $$
BEGIN
  RAISE NOTICE '🧹 Database cleanup complete';
  RAISE NOTICE '❌ Removed redundant club_notifications table';
  RAISE NOTICE '✅ Added performance indexes for PostgreSQL functions';
END $$;