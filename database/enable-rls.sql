-- Enable Row Level Security on all tables
-- Run this script to enable RLS and add basic policies

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

-- Basic policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Allow reading other users' basic info for matches and clubs
DROP POLICY IF EXISTS "Users can view basic info of other users" ON users;
CREATE POLICY "Users can view basic info of other users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members cm1, club_members cm2 
      WHERE cm1.user_id::text = auth.uid()::text 
      AND cm2.user_id::text = users.id::text 
      AND cm1.club_id = cm2.club_id
    )
  );

-- Basic policies for clubs table
DROP POLICY IF EXISTS "Authenticated users can view clubs" ON clubs;
CREATE POLICY "Authenticated users can view clubs" ON clubs
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create clubs" ON clubs;
CREATE POLICY "Authenticated users can create clubs" ON clubs
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid()::text = creator_id::text
  );

-- Basic policies for matches table
DROP POLICY IF EXISTS "Users can view relevant matches" ON matches;
CREATE POLICY "Users can view relevant matches" ON matches
  FOR SELECT USING (
    auth.uid()::text IN (player1_id::text, player2_id::text, player3_id::text, player4_id::text)
    OR
    EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = matches.club_id 
      AND user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Club members can create matches" ON matches;
CREATE POLICY "Club members can create matches" ON matches
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = matches.club_id 
      AND user_id::text = auth.uid()::text
    )
    AND auth.uid()::text = player1_id::text
  );

-- Basic policies for club_members table
DROP POLICY IF EXISTS "Club members can view other members" ON club_members;
CREATE POLICY "Club members can view other members" ON club_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members cm 
      WHERE cm.club_id = club_members.club_id 
      AND cm.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can join clubs" ON club_members;
CREATE POLICY "Users can join clubs" ON club_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid()::text = user_id::text
  );

-- Basic policies for notifications table
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Basic policies for challenges table
DROP POLICY IF EXISTS "Users can view relevant challenges" ON challenges;
CREATE POLICY "Users can view relevant challenges" ON challenges
  FOR SELECT USING (
    auth.uid()::text IN (challenger_id::text, challenged_id::text)
    OR
    EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = challenges.club_id 
      AND user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Club members can create challenges" ON challenges;
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

DROP POLICY IF EXISTS "Challenge participants can update challenges" ON challenges;
CREATE POLICY "Challenge participants can update challenges" ON challenges
  FOR UPDATE USING (
    auth.uid()::text IN (challenger_id::text, challenged_id::text)
  );

-- Basic policies for match_invitations table
DROP POLICY IF EXISTS "Club members can view match invitations" ON match_invitations;
CREATE POLICY "Club members can view match invitations" ON match_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = match_invitations.club_id 
      AND user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Club members can create match invitations" ON match_invitations;
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

-- Basic policies for invitation_responses table
DROP POLICY IF EXISTS "Users can view invitation responses" ON invitation_responses;
CREATE POLICY "Users can view invitation responses" ON invitation_responses
  FOR SELECT USING (
    auth.uid()::text = user_id::text
    OR
    EXISTS (
      SELECT 1 FROM match_invitations mi 
      WHERE mi.id = invitation_responses.invitation_id 
      AND mi.creator_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can create invitation responses" ON invitation_responses;
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

-- Basic policies for challenge_counters table
DROP POLICY IF EXISTS "Users can view relevant challenge counters" ON challenge_counters;
CREATE POLICY "Users can view relevant challenge counters" ON challenge_counters
  FOR SELECT USING (
    auth.uid()::text = counter_by::text
    OR
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = challenge_counters.challenge_id 
      AND auth.uid()::text IN (c.challenger_id::text, c.challenged_id::text)
    )
  );

DROP POLICY IF EXISTS "Challenged users can create counters" ON challenge_counters;
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

RAISE NOTICE 'Row Level Security enabled on all tables with basic policies!';