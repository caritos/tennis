-- Supabase Database Setup for Tennis Club App
-- This script creates all tables with the same schema as SQLite
-- Run this in the Supabase SQL Editor after creating a new project

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS challenge_counters CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS invitation_responses CASCADE;
DROP TABLE IF EXISTS match_invitations CASCADE;
DROP TABLE IF EXISTS club_members CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  contact_preference TEXT DEFAULT 'whatsapp' CHECK (contact_preference IN ('whatsapp', 'phone', 'text')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clubs table  
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  opponent2_name TEXT,
  player3_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner3_name TEXT,
  player4_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner4_name TEXT,
  scores TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Club members table
CREATE TABLE club_members (
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

-- Match invitations table (for "Looking to Play" feature)
CREATE TABLE match_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  date DATE NOT NULL,
  time TIME,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Invitation responses table
CREATE TABLE invitation_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID NOT NULL REFERENCES match_invitations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'confirmed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invitation_id, user_id)
);

-- Challenges table (for direct player challenges)
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  proposed_date DATE,
  proposed_time TIME,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  contacts_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge counter-offers table
CREATE TABLE challenge_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  counter_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  proposed_date DATE,
  proposed_time TIME,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table (for in-app notification system)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('challenge', 'match_invitation', 'match_result', 'ranking_update', 'club_activity')),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  action_type TEXT CHECK (action_type IN ('accept_challenge', 'decline_challenge', 'view_match', 'view_ranking', 'join_club')),
  action_data JSONB, -- JSON data for action parameters
  related_id UUID, -- ID of related entity (challenge_id, match_id, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_clubs_creator ON clubs(creator_id);
CREATE INDEX idx_clubs_location ON clubs(lat, lng);
CREATE INDEX idx_matches_club ON matches(club_id);
CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_club_members_user ON club_members(user_id);
CREATE INDEX idx_match_invitations_club ON match_invitations(club_id);
CREATE INDEX idx_match_invitations_creator ON match_invitations(creator_id);
CREATE INDEX idx_match_invitations_date ON match_invitations(date);
CREATE INDEX idx_invitation_responses_invitation ON invitation_responses(invitation_id);
CREATE INDEX idx_invitation_responses_user ON invitation_responses(user_id);
CREATE INDEX idx_challenges_club ON challenges(club_id);
CREATE INDEX idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenge_counters_challenge ON challenge_counters(challenge_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Add triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_challenges_updated_at 
  BEFORE UPDATE ON challenges 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- You can run this section to populate with test data

-- Sample users (using fixed UUIDs for consistency)
INSERT INTO users (id, full_name, email, phone, role) VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'John Doe', 'john@example.com', '+1234567890', 'player'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Jane Smith', 'jane@example.com', '+1234567891', 'player'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Mike Wilson', 'mike@example.com', '+1234567892', 'player');

-- Sample clubs
INSERT INTO clubs (id, name, description, location, lat, lng, creator_id) VALUES 
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Downtown Tennis Club', 'Premier tennis facility in downtown', 'Miami, FL', 25.7617, -80.1918, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Sunset Tennis Center', 'Beautiful courts with sunset views', 'Miami Beach, FL', 25.7907, -80.1300, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12');

-- Sample club memberships
INSERT INTO club_members (club_id, user_id) VALUES 
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13');