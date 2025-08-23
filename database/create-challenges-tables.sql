-- Create Challenges Tables Only
-- Run this in your Supabase SQL Editor to add the missing challenges functionality
-- This adds the challenges and challenge_counters tables with proper RLS policies

-- Challenges table (for direct player challenges)
CREATE TABLE IF NOT EXISTS challenges (
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
CREATE TABLE IF NOT EXISTS challenge_counters (
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

-- Enable RLS on challenges table
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_counters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges table
CREATE POLICY "Users can view relevant challenges"
ON challenges FOR SELECT
USING (
  -- Users can see challenges they're involved in or challenges in clubs they belong to
  challenger_id = auth.uid() OR 
  challenged_id = auth.uid() OR
  club_id IN (
    SELECT club_id FROM club_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Club members can create challenges"
ON challenges FOR INSERT
WITH CHECK (
  -- Only club members can create challenges in that club
  club_id IN (
    SELECT club_id FROM club_members WHERE user_id = auth.uid()
  ) AND
  challenger_id = auth.uid()
);

CREATE POLICY "Challenge participants can update challenges"
ON challenges FOR UPDATE
USING (
  -- Only challenger or challenged can update the challenge
  challenger_id = auth.uid() OR challenged_id = auth.uid()
);

CREATE POLICY "Challengers can delete challenges"
ON challenges FOR DELETE
USING (challenger_id = auth.uid());

-- RLS Policies for challenge_counters table
CREATE POLICY "Users can view relevant challenge counters"
ON challenge_counters FOR SELECT
USING (
  -- Users can see counters for challenges they're involved in
  counter_by = auth.uid() OR
  challenge_id IN (
    SELECT id FROM challenges 
    WHERE challenger_id = auth.uid() OR challenged_id = auth.uid()
  )
);

CREATE POLICY "Users can create challenge counters"
ON challenge_counters FOR INSERT
WITH CHECK (
  -- Only the challenged user can create counter-offers
  counter_by = auth.uid() AND
  challenge_id IN (
    SELECT id FROM challenges WHERE challenged_id = auth.uid()
  )
);

CREATE POLICY "Counter creators can update their counters"
ON challenge_counters FOR UPDATE
USING (counter_by = auth.uid());

CREATE POLICY "Counter creators can delete their counters"
ON challenge_counters FOR DELETE
USING (counter_by = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenges_club_id ON challenges(club_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged_id ON challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges(created_at);

CREATE INDEX IF NOT EXISTS idx_challenge_counters_challenge_id ON challenge_counters(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_counters_counter_by ON challenge_counters(counter_by);
CREATE INDEX IF NOT EXISTS idx_challenge_counters_status ON challenge_counters(status);

-- Verify tables were created successfully
SELECT 'Challenges table created successfully' as message
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'challenges');

SELECT 'Challenge counters table created successfully' as message  
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'challenge_counters');