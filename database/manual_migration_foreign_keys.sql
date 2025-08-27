-- Fix Foreign Key Relationships 
-- This fixes the "Could not find relationship" errors

-- ============================================================================
-- PART 1: FIX FOREIGN KEY CONSTRAINTS FOR CHALLENGES
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
-- PART 2: FIX FOREIGN KEY CONSTRAINTS FOR MATCHES
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
-- PART 3: FIX FOREIGN KEY CONSTRAINTS FOR MATCH_INVITATIONS
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