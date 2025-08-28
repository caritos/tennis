-- ============================================================================
-- MASTER DATABASE SETUP SCRIPT
-- Run this single file to set up the entire database from scratch
-- ============================================================================

-- IMPORTANT: This combines all necessary setup in the correct order
-- For production use, review each section before running

-- ============================================================================
-- PART 1: CORE TABLES
-- ============================================================================

-- Users table (must be first - others reference it)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  rating INTEGER DEFAULT 1200,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  active_status TEXT DEFAULT 'active' CHECK (active_status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clubs table
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Club members junction table
CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  UNIQUE(club_id, user_id)
);

-- Challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  proposed_date DATE,
  proposed_time TIME,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  player1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  player3_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  player4_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES public.users(id),
  score TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT doubles_players_check CHECK (
    (match_type = 'doubles' AND player3_id IS NOT NULL AND player4_id IS NOT NULL) OR
    (match_type = 'singles' AND player3_id IS NULL AND player4_id IS NULL)
  )
);

-- Match invitations table  
CREATE TABLE IF NOT EXISTS public.match_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  date DATE,
  time TIME,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'cancelled')),
  player_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID NULL,
    action_type TEXT NULL,
    action_data JSONB NULL,
    read BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 2: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id ON public.challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged_id ON public.challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_club_id ON public.challenges(club_id);
CREATE INDEX IF NOT EXISTS idx_matches_club_id ON public.matches(club_id);
CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON public.matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON public.matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_match_invitations_club_id ON public.match_invitations(club_id);
CREATE INDEX IF NOT EXISTS idx_match_invitations_creator_id ON public.match_invitations(creator_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================================================
-- PART 3: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Clubs policies
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clubs" ON public.clubs FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Club creators can update their clubs" ON public.clubs FOR UPDATE USING (auth.uid() = creator_id);

-- Club members policies
CREATE POLICY "Anyone can view club members" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Users can join clubs" ON public.club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clubs" ON public.club_members FOR DELETE USING (auth.uid() = user_id);

-- Challenges policies
CREATE POLICY "Users can view relevant challenges" ON public.challenges 
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = challenged_id OR 
    EXISTS (SELECT 1 FROM club_members WHERE club_id = challenges.club_id AND user_id = auth.uid()));
CREATE POLICY "Users can create challenges" ON public.challenges 
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Users can update own challenges" ON public.challenges 
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Matches policies  
CREATE POLICY "Club members can view club matches" ON public.matches 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM club_members WHERE club_id = matches.club_id AND user_id = auth.uid())
  );
CREATE POLICY "Players can insert matches" ON public.matches 
  FOR INSERT WITH CHECK (
    auth.uid() IN (player1_id, player2_id, player3_id, player4_id)
  );

-- Match invitations policies
CREATE POLICY "Club members can view invitations" ON public.match_invitations 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM club_members WHERE club_id = match_invitations.club_id AND user_id = auth.uid())
  );
CREATE POLICY "Club members can create invitations" ON public.match_invitations 
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND
    EXISTS (SELECT 1 FROM club_members WHERE club_id = match_invitations.club_id AND user_id = auth.uid())
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- PART 4: FUNCTIONS (Optional - for enhanced functionality)
-- ============================================================================

-- User profile management function
CREATE OR REPLACE FUNCTION create_or_update_user_profile(
    p_user_id uuid,
    p_email text,
    p_full_name text,
    p_phone text DEFAULT '',
    p_role text DEFAULT 'player'
) RETURNS json AS $$
DECLARE
    user_profile users%ROWTYPE;
    is_new_user boolean := false;
BEGIN
    -- Try to get existing user profile
    SELECT * INTO user_profile FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        -- User doesn't exist, create new profile
        is_new_user := true;
        
        INSERT INTO users (
            id, email, full_name, phone, 
            rating, wins, losses, total_matches, 
            active_status, created_at, updated_at
        ) VALUES (
            p_user_id, p_email, p_full_name, p_phone,
            1200, 0, 0, 0,
            'active', NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            updated_at = NOW()
        RETURNING * INTO user_profile;
    ELSE
        -- User exists, update profile if needed
        UPDATE users SET
            email = p_email,
            full_name = p_full_name,
            phone = COALESCE(NULLIF(p_phone, ''), phone),
            updated_at = NOW()
        WHERE id = p_user_id
        RETURNING * INTO user_profile;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'is_new_user', is_new_user,
        'user_profile', row_to_json(user_profile)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_or_update_user_profile TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Verify setup
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup complete!';
    RAISE NOTICE '📊 Tables created: users, clubs, club_members, challenges, matches, match_invitations, notifications';
    RAISE NOTICE '🔐 RLS policies applied';
    RAISE NOTICE '⚡ Indexes created for performance';
    RAISE NOTICE '🔧 Functions ready for use';
END $$;