-- Row Level Security (RLS) Policies for Tennis Club App
-- Run this after creating the tables with supabase-setup.sql
-- These policies ensure data security and proper access control

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- Users can only see and modify their own data
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile  
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can insert their own profile (for new signups)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Allow reading other users' basic info for matches and clubs
CREATE POLICY "Users can view basic info of other users" ON users
  FOR SELECT USING (
    -- Allow if the user is a member of the same club
    EXISTS (
      SELECT 1 FROM club_members cm1, club_members cm2 
      WHERE cm1.user_id::text = auth.uid()::text 
      AND cm2.user_id::text = users.id::text 
      AND cm1.club_id = cm2.club_id
    )
  );

-- ============================================================================
-- CLUBS TABLE POLICIES  
-- All authenticated users can read clubs, only creators can modify
-- ============================================================================

-- All authenticated users can view clubs
CREATE POLICY "Authenticated users can view clubs" ON clubs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can create clubs
CREATE POLICY "Authenticated users can create clubs" ON clubs
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid()::text = creator_id::text
  );

-- Only club creators can update their clubs
CREATE POLICY "Club creators can update their clubs" ON clubs
  FOR UPDATE USING (auth.uid()::text = creator_id::text);

-- Only club creators can delete their clubs
CREATE POLICY "Club creators can delete their clubs" ON clubs
  FOR DELETE USING (auth.uid()::text = creator_id::text);

-- ============================================================================
-- MATCHES TABLE POLICIES
-- Match participants can read/write their matches
-- ============================================================================

-- Users can view matches they participated in or are in same club
CREATE POLICY "Users can view relevant matches" ON matches
  FOR SELECT USING (
    -- User is a participant in the match
    auth.uid()::text IN (player1_id::text, player2_id::text, player3_id::text, player4_id::text)
    OR
    -- User is a member of the same club
    EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = matches.club_id 
      AND user_id::text = auth.uid()::text
    )
  );

-- Users can create matches in clubs they belong to
CREATE POLICY "Club members can create matches" ON matches
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = matches.club_id 
      AND user_id::text = auth.uid()::text
    )
    AND auth.uid()::text = player1_id::text  -- Must be player1 (recorder)
  );

-- Only the match recorder (player1) can update matches
CREATE POLICY "Match recorder can update matches" ON matches
  FOR UPDATE USING (auth.uid()::text = player1_id::text);

-- Only the match recorder can delete matches
CREATE POLICY "Match recorder can delete matches" ON matches
  FOR DELETE USING (auth.uid()::text = player1_id::text);

-- ============================================================================
-- CLUB_MEMBERS TABLE POLICIES
-- Club members can see other members, users can join/leave clubs
-- ============================================================================

-- Users can view members of clubs they belong to
CREATE POLICY "Club members can view other members" ON club_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members cm 
      WHERE cm.club_id = club_members.club_id 
      AND cm.user_id::text = auth.uid()::text
    )
  );

-- Users can join clubs (insert membership)
CREATE POLICY "Users can join clubs" ON club_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid()::text = user_id::text
  );

-- Users can leave clubs they belong to
CREATE POLICY "Users can leave clubs" ON club_members
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- MATCH_INVITATIONS TABLE POLICIES
-- Club members can create and view invitations in their clubs
-- ============================================================================

-- Club members can view invitations in their clubs
CREATE POLICY "Club members can view match invitations" ON match_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = match_invitations.club_id 
      AND user_id::text = auth.uid()::text
    )
  );

-- Club members can create invitations in their clubs
CREATE POLICY "Club members can create match invitations" ON match_invitations
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid()::text = creator_id::text
    AND EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = match_invitations.club_id 
      AND user_id::text = auth.uid()::text
    )
  );

-- Only invitation creators can update their invitations
CREATE POLICY "Invitation creators can update invitations" ON match_invitations
  FOR UPDATE USING (auth.uid()::text = creator_id::text);

-- Only invitation creators can delete their invitations
CREATE POLICY "Invitation creators can delete invitations" ON match_invitations
  FOR DELETE USING (auth.uid()::text = creator_id::text);

-- ============================================================================
-- INVITATION_RESPONSES TABLE POLICIES
-- Users can respond to invitations in clubs they belong to
-- ============================================================================

-- Users can view responses to invitations they can see
CREATE POLICY "Users can view invitation responses" ON invitation_responses
  FOR SELECT USING (
    -- User created the response
    auth.uid()::text = user_id::text
    OR
    -- User created the invitation
    EXISTS (
      SELECT 1 FROM match_invitations mi 
      WHERE mi.id = invitation_responses.invitation_id 
      AND mi.creator_id::text = auth.uid()::text
    )
  );

-- Users can create responses to invitations in clubs they belong to
CREATE POLICY "Users can create invitation responses" ON invitation_responses
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid()::text = user_id::text
    AND EXISTS (
      SELECT 1 FROM match_invitations mi, club_members cm
      WHERE mi.id = invitation_responses.invitation_id
      AND cm.club_id = mi.club_id
      AND cm.user_id::text = auth.uid()::text
    )
  );

-- Users can update their own responses
CREATE POLICY "Users can update own responses" ON invitation_responses
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own responses
CREATE POLICY "Users can delete own responses" ON invitation_responses
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- CHALLENGES TABLE POLICIES
-- Users can challenge others in the same club
-- ============================================================================

-- Users can view challenges involving them
CREATE POLICY "Users can view relevant challenges" ON challenges
  FOR SELECT USING (
    -- User is challenger or challenged
    auth.uid()::text IN (challenger_id::text, challenged_id::text)
    OR
    -- User is in the same club (for club rankings context)
    EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = challenges.club_id 
      AND user_id::text = auth.uid()::text
    )
  );

-- Users can create challenges in clubs they belong to
CREATE POLICY "Club members can create challenges" ON challenges
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid()::text = challenger_id::text
    AND EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = challenges.club_id 
      AND user_id::text = auth.uid()::text
    )
  );

-- Participants can update challenges (for status changes)
CREATE POLICY "Challenge participants can update challenges" ON challenges
  FOR UPDATE USING (
    auth.uid()::text IN (challenger_id::text, challenged_id::text)
  );

-- Only challengers can delete challenges
CREATE POLICY "Challengers can delete challenges" ON challenges
  FOR DELETE USING (auth.uid()::text = challenger_id::text);

-- ============================================================================
-- CHALLENGE_COUNTERS TABLE POLICIES
-- Users can counter-offer challenges made to them
-- ============================================================================

-- Users can view counter-offers on challenges they're involved in
CREATE POLICY "Users can view relevant challenge counters" ON challenge_counters
  FOR SELECT USING (
    -- User made the counter-offer
    auth.uid()::text = counter_by::text
    OR
    -- User is involved in the original challenge
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = challenge_counters.challenge_id 
      AND auth.uid()::text IN (c.challenger_id::text, c.challenged_id::text)
    )
  );

-- Users can create counter-offers on challenges made to them
CREATE POLICY "Challenged users can create counters" ON challenge_counters
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid()::text = counter_by::text
    AND EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = challenge_counters.challenge_id 
      AND c.challenged_id::text = auth.uid()::text
    )
  );

-- Users can update their own counter-offers
CREATE POLICY "Users can update own counters" ON challenge_counters
  FOR UPDATE USING (auth.uid()::text = counter_by::text);

-- Users can delete their own counter-offers
CREATE POLICY "Users can delete own counters" ON challenge_counters
  FOR DELETE USING (auth.uid()::text = counter_by::text);

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- Users can only see and modify their own notifications
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- System can create notifications for users (INSERT with service role)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- UTILITY POLICIES
-- Additional policies for special use cases
-- ============================================================================

-- Allow service role to bypass RLS (for admin functions)
-- Note: This should be used carefully and only by backend services

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id::text = auth.uid()::text 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin users can view all data (add to existing policies as needed)
-- Example: Add "OR is_admin()" to SELECT policies for admin access

COMMIT;