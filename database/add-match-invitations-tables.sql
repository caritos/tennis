-- Add match invitations and club notifications tables
-- Run this in Supabase SQL Editor if these tables don't exist yet

-- Match invitations table (for "looking to play" feature)
CREATE TABLE IF NOT EXISTS match_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Invitation responses table (for players responding to invitations)
CREATE TABLE IF NOT EXISTS invitation_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID NOT NULL REFERENCES match_invitations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'confirmed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invitation_id, user_id)
);

-- Club notifications table (for club-wide notifications like new invitations)
CREATE TABLE IF NOT EXISTS club_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g., 'invitation_created', 'match_recorded', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- JSON data with notification details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_match_invitations_club_id ON match_invitations(club_id);
CREATE INDEX IF NOT EXISTS idx_match_invitations_creator_id ON match_invitations(creator_id);
CREATE INDEX IF NOT EXISTS idx_match_invitations_status ON match_invitations(status);
CREATE INDEX IF NOT EXISTS idx_match_invitations_date ON match_invitations(date);

CREATE INDEX IF NOT EXISTS idx_invitation_responses_invitation_id ON invitation_responses(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_responses_user_id ON invitation_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_club_notifications_club_id ON club_notifications(club_id);
CREATE INDEX IF NOT EXISTS idx_club_notifications_created_at ON club_notifications(created_at);

-- Add Row Level Security (RLS) policies

-- Match invitations: users can view all club invitations, but only manage their own
ALTER TABLE match_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view club invitations" ON match_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = match_invitations.club_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invitations in their clubs" ON match_invitations
  FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = match_invitations.club_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own invitations" ON match_invitations
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their own invitations" ON match_invitations
  FOR DELETE USING (creator_id = auth.uid());

-- Invitation responses: users can manage their own responses
ALTER TABLE invitation_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses to club invitations" ON invitation_responses
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM match_invitations mi 
      WHERE mi.id = invitation_responses.invitation_id 
      AND mi.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create responses to club invitations" ON invitation_responses
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM match_invitations mi
      JOIN club_members cm ON mi.club_id = cm.club_id
      WHERE mi.id = invitation_responses.invitation_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own responses" ON invitation_responses
  FOR UPDATE USING (user_id = auth.uid());

-- Club notifications: members can view club notifications
ALTER TABLE club_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view club notifications" ON club_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members 
      WHERE club_id = club_notifications.club_id 
      AND user_id = auth.uid()
    )
  );

-- Service role can manage all notifications (for server-side operations)
CREATE POLICY "Service role can manage club notifications" ON club_notifications
  FOR ALL USING (auth.role() = 'service_role');

GRANT ALL ON club_notifications TO service_role;
GRANT ALL ON match_invitations TO service_role;
GRANT ALL ON invitation_responses TO service_role;

-- Verify tables were created
SELECT 
  'match_invitations' as table_name,
  COUNT(*) as row_count
FROM match_invitations
UNION ALL
SELECT 
  'invitation_responses' as table_name,
  COUNT(*) as row_count  
FROM invitation_responses
UNION ALL
SELECT 
  'club_notifications' as table_name,
  COUNT(*) as row_count
FROM club_notifications;