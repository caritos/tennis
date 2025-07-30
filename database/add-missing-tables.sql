-- Add Missing Tables to Existing Supabase Database
-- Run this script to add the missing tables without dropping existing ones

-- Check if match_invitations table exists, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'match_invitations') THEN
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
        
        CREATE INDEX idx_match_invitations_club ON match_invitations(club_id);
        CREATE INDEX idx_match_invitations_creator ON match_invitations(creator_id);
        CREATE INDEX idx_match_invitations_date ON match_invitations(date);
        
        RAISE NOTICE 'Created match_invitations table';
    END IF;
END $$;

-- Check if invitation_responses table exists, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invitation_responses') THEN
        CREATE TABLE invitation_responses (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          invitation_id UUID NOT NULL REFERENCES match_invitations(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          message TEXT,
          status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'confirmed', 'declined')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(invitation_id, user_id)
        );
        
        CREATE INDEX idx_invitation_responses_invitation ON invitation_responses(invitation_id);
        CREATE INDEX idx_invitation_responses_user ON invitation_responses(user_id);
        
        RAISE NOTICE 'Created invitation_responses table';
    END IF;
END $$;

-- Check if challenges table exists, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'challenges') THEN
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
        
        CREATE INDEX idx_challenges_club ON challenges(club_id);
        CREATE INDEX idx_challenges_challenger ON challenges(challenger_id);
        CREATE INDEX idx_challenges_challenged ON challenges(challenged_id);
        CREATE INDEX idx_challenges_status ON challenges(status);
        
        RAISE NOTICE 'Created challenges table';
    END IF;
END $$;

-- Check if challenge_counters table exists, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'challenge_counters') THEN
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
        
        CREATE INDEX idx_challenge_counters_challenge ON challenge_counters(challenge_id);
        
        RAISE NOTICE 'Created challenge_counters table';
    END IF;
END $$;

-- Check if notifications table exists, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('challenge', 'match_invitation', 'match_result', 'ranking_update', 'club_activity')),
          title TEXT NOT NULL,
          message TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          action_type TEXT CHECK (action_type IN ('accept_challenge', 'decline_challenge', 'view_match', 'view_ranking', 'join_club')),
          action_data JSONB,
          related_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        );
        
        CREATE INDEX idx_notifications_user ON notifications(user_id);
        CREATE INDEX idx_notifications_type ON notifications(type);
        CREATE INDEX idx_notifications_read ON notifications(is_read);
        CREATE INDEX idx_notifications_created ON notifications(created_at);
        
        RAISE NOTICE 'Created notifications table';
    END IF;
END $$;

-- Add missing contact_preference column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'contact_preference') THEN
        ALTER TABLE users ADD COLUMN contact_preference TEXT DEFAULT 'whatsapp' CHECK (contact_preference IN ('whatsapp', 'phone', 'text'));
        RAISE NOTICE 'Added contact_preference column to users table';
    END IF;
END $$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for challenges table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_challenges_updated_at') THEN
        CREATE TRIGGER update_challenges_updated_at 
          BEFORE UPDATE ON challenges 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update trigger for challenges table';
    END IF;
END $$;

RAISE NOTICE 'Missing tables setup completed successfully!';