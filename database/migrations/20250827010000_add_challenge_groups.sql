-- Add support for 2-to-2 doubles challenges
-- This migration adds challenge groups to support proper doubles challenges with 4 players

-- Challenge Groups table - represents a challenge between teams
CREATE TABLE IF NOT EXISTS public.challenge_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  message TEXT,
  proposed_date DATE,
  proposed_time TIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Challenge Group Players - tracks all players involved in a group challenge
CREATE TABLE IF NOT EXISTS public.challenge_group_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenge_group_id UUID NOT NULL REFERENCES public.challenge_groups(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('challenger', 'challenged')), -- which team they're on
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  contacts_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(challenge_group_id, player_id)
);

-- Add challenge_group_id to matches table for linking
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS challenge_group_id UUID REFERENCES public.challenge_groups(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenge_groups_club_id ON public.challenge_groups(club_id);
CREATE INDEX IF NOT EXISTS idx_challenge_groups_created_by ON public.challenge_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_challenge_groups_status ON public.challenge_groups(status);
CREATE INDEX IF NOT EXISTS idx_challenge_group_players_group_id ON public.challenge_group_players(challenge_group_id);
CREATE INDEX IF NOT EXISTS idx_challenge_group_players_player_id ON public.challenge_group_players(player_id);

-- RLS Policies for challenge_groups
ALTER TABLE public.challenge_groups ENABLE ROW LEVEL SECURITY;

-- Users can view challenge groups they're involved in
CREATE POLICY "Users can view their challenge groups" ON public.challenge_groups
  FOR SELECT USING (
    created_by = auth.uid() OR 
    id IN (
      SELECT challenge_group_id 
      FROM public.challenge_group_players 
      WHERE player_id = auth.uid()
    )
  );

-- Users can create challenge groups
CREATE POLICY "Users can create challenge groups" ON public.challenge_groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update challenge groups they created (for status changes)
CREATE POLICY "Users can update their challenge groups" ON public.challenge_groups
  FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for challenge_group_players
ALTER TABLE public.challenge_group_players ENABLE ROW LEVEL SECURITY;

-- Users can view challenge group players for groups they're involved in
CREATE POLICY "Users can view challenge group players" ON public.challenge_group_players
  FOR SELECT USING (
    challenge_group_id IN (
      SELECT id FROM public.challenge_groups 
      WHERE created_by = auth.uid() OR 
            id IN (SELECT challenge_group_id FROM public.challenge_group_players WHERE player_id = auth.uid())
    )
  );

-- Users can create challenge group player records (when creating challenges)
CREATE POLICY "Users can create challenge group players" ON public.challenge_group_players
  FOR INSERT WITH CHECK (
    challenge_group_id IN (
      SELECT id FROM public.challenge_groups WHERE created_by = auth.uid()
    )
  );

-- Users can update their own challenge group player status
CREATE POLICY "Users can update their challenge player status" ON public.challenge_group_players
  FOR UPDATE USING (player_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.challenge_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.challenge_group_players TO authenticated;
GRANT USAGE ON SEQUENCE challenge_groups_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE challenge_group_players_id_seq TO authenticated;