-- Initial schema migration
-- This migration creates the complete tennis app database schema
-- Generated from existing setup.sql on 2025-08-26

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- USERS table (extends auth.users)
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

-- CLUBS table
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  max_members INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  address TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CLUB MEMBERSHIPS table
CREATE TABLE IF NOT EXISTS public.club_memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(club_id, user_id)
);

-- MATCHES table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  player1_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  player3_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  player4_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  opponent2_name TEXT,
  partner3_name TEXT,
  partner4_name TEXT,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  scores TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  challenge_id UUID,
  invitation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CHALLENGES table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  challenger_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed')),
  message TEXT,
  proposed_date DATE,
  proposed_time TIME,
  contacts_shared BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CHALLENGE COUNTERS table
CREATE TABLE IF NOT EXISTS public.challenge_counters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  original_challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  counter_challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  counter_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(original_challenge_id, counter_challenge_id)
);

-- MATCH INVITATIONS table
CREATE TABLE IF NOT EXISTS public.match_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  message TEXT,
  proposed_date DATE,
  proposed_time TIME,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  contacts_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MATCH INVITATION RESPONSES table
CREATE TABLE IF NOT EXISTS public.match_invitation_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES public.match_invitations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('interested', 'not_interested')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(invitation_id, user_id)
);

-- NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_type TEXT,
  action_data JSONB,
  related_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_invitation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- USERS TABLE POLICIES
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- CLUBS TABLE POLICIES  
CREATE POLICY "Anyone can view clubs" ON public.clubs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create clubs" ON public.clubs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Club creators and admins can update clubs" ON public.clubs
  FOR UPDATE USING (
    auth.uid() = created_by 
    OR EXISTS (
      SELECT 1 FROM public.club_memberships cm 
      WHERE cm.club_id = id 
      AND cm.user_id = auth.uid() 
      AND cm.role = 'admin'
    )
  );

-- CLUB MEMBERSHIPS POLICIES
CREATE POLICY "Users can view memberships of clubs they belong to" ON public.club_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_memberships cm 
      WHERE cm.club_id = club_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join clubs" ON public.club_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave clubs" ON public.club_memberships
  FOR DELETE USING (auth.uid() = user_id);

-- MATCHES TABLE POLICIES
CREATE POLICY "Users can view matches from their clubs" ON public.matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_memberships cm 
      WHERE cm.club_id = club_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create matches in their clubs" ON public.matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_memberships cm 
      WHERE cm.club_id = club_id 
      AND cm.user_id = auth.uid()
    )
  );

-- CHALLENGES TABLE POLICIES
CREATE POLICY "Users can view challenges in their clubs" ON public.challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_memberships cm 
      WHERE cm.club_id = club_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create challenges in their clubs" ON public.challenges
  FOR INSERT WITH CHECK (
    auth.uid() = challenger_id 
    AND EXISTS (
      SELECT 1 FROM public.club_memberships cm 
      WHERE cm.club_id = club_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Challenge participants can update challenges" ON public.challenges
  FOR UPDATE USING (
    auth.uid() = challenger_id 
    OR auth.uid() = challenged_id
  );

-- NOTIFICATIONS TABLE POLICIES
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Simplified notification policy for challenge notifications
CREATE POLICY "Allow notification creation" ON public.notifications
  FOR INSERT WITH CHECK (
    -- Service role can always create
    auth.role() = 'service_role'
    OR
    -- Authenticated users can create notifications
    (
      auth.role() = 'authenticated'
      AND (
        -- Users can create notifications for themselves
        auth.uid() = user_id
        OR
        -- Allow creating challenge notifications for participants
        type = 'challenge'
      )
    )
  );

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_clubs_location ON public.clubs(latitude, longitude) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_club_memberships_club_user ON public.club_memberships(club_id, user_id);
CREATE INDEX IF NOT EXISTS idx_matches_club_date ON public.matches(club_id, date);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at);