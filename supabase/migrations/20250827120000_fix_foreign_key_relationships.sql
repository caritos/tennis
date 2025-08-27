-- Fix Foreign Key Relationships and Missing Tables
-- This migration addresses schema cache errors by ensuring proper foreign key constraints

-- ============================================================================
-- PART 1: CREATE MISSING NOTIFICATIONS TABLE
-- ============================================================================

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID NULL, -- Generic reference to other entities
    action_type TEXT NULL, -- Type of action (join_club, view_match, etc.)
    action_data JSONB NULL, -- Additional data for the action
    read BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- PART 2: FIX FOREIGN KEY CONSTRAINTS FOR CHALLENGES
-- ============================================================================

-- Ensure challenges table has proper foreign key constraints
DO $$
BEGIN
    -- Add challenger_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'challenges_challenger_id_fkey' 
        AND table_name = 'challenges'
    ) THEN
        ALTER TABLE public.challenges 
        ADD CONSTRAINT challenges_challenger_id_fkey 
        FOREIGN KEY (challenger_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Add challenged_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'challenges_challenged_id_fkey' 
        AND table_name = 'challenges'
    ) THEN
        ALTER TABLE public.challenges 
        ADD CONSTRAINT challenges_challenged_id_fkey 
        FOREIGN KEY (challenged_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Add club_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'challenges_club_id_fkey' 
        AND table_name = 'challenges'
    ) THEN
        ALTER TABLE public.challenges 
        ADD CONSTRAINT challenges_club_id_fkey 
        FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- PART 3: FIX FOREIGN KEY CONSTRAINTS FOR MATCHES
-- ============================================================================

-- Ensure matches table has proper foreign key constraints
DO $$
BEGIN
    -- Add player1_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_player1_id_fkey' 
        AND table_name = 'matches'
    ) THEN
        ALTER TABLE public.matches 
        ADD CONSTRAINT matches_player1_id_fkey 
        FOREIGN KEY (player1_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Add player2_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_player2_id_fkey' 
        AND table_name = 'matches'
    ) THEN
        ALTER TABLE public.matches 
        ADD CONSTRAINT matches_player2_id_fkey 
        FOREIGN KEY (player2_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Add player3_id foreign key if it doesn't exist (for doubles)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_player3_id_fkey' 
        AND table_name = 'matches'
    ) THEN
        ALTER TABLE public.matches 
        ADD CONSTRAINT matches_player3_id_fkey 
        FOREIGN KEY (player3_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Add player4_id foreign key if it doesn't exist (for doubles)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_player4_id_fkey' 
        AND table_name = 'matches'
    ) THEN
        ALTER TABLE public.matches 
        ADD CONSTRAINT matches_player4_id_fkey 
        FOREIGN KEY (player4_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Add club_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_club_id_fkey' 
        AND table_name = 'matches'
    ) THEN
        ALTER TABLE public.matches 
        ADD CONSTRAINT matches_club_id_fkey 
        FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- PART 4: FIX FOREIGN KEY CONSTRAINTS FOR MATCH_INVITATIONS
-- ============================================================================

-- Ensure match_invitations table has proper foreign key constraints
DO $$
BEGIN
    -- Add creator_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'match_invitations_creator_id_fkey' 
        AND table_name = 'match_invitations'
    ) THEN
        ALTER TABLE public.match_invitations 
        ADD CONSTRAINT match_invitations_creator_id_fkey 
        FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Add club_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'match_invitations_club_id_fkey' 
        AND table_name = 'match_invitations'
    ) THEN
        ALTER TABLE public.match_invitations 
        ADD CONSTRAINT match_invitations_club_id_fkey 
        FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- PART 5: ENABLE ROW LEVEL SECURITY ON NOTIFICATIONS
-- ============================================================================

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY IF NOT EXISTS "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY IF NOT EXISTS "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: System can insert notifications (via functions)
CREATE POLICY IF NOT EXISTS "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PART 6: GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions on notifications table
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO service_role; -- For functions to insert notifications

-- ============================================================================
-- PART 7: REFRESH SCHEMA CACHE
-- ============================================================================

-- Force refresh of schema cache by notifying PostgREST
NOTIFY pgrst, 'reload schema';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed foreign key relationships:';
    RAISE NOTICE '   - challenges → users (challenger_id, challenged_id)';
    RAISE NOTICE '   - matches → users (player1_id, player2_id, player3_id, player4_id)';
    RAISE NOTICE '   - match_invitations → users (creator_id)';
    RAISE NOTICE '   - All tables → clubs (club_id)';
    RAISE NOTICE '✅ Created notifications table with proper constraints';
    RAISE NOTICE '✅ Enabled RLS and granted permissions';
    RAISE NOTICE '🔄 Schema cache refresh notified';
END $$;