-- Add missing columns to users table
-- These columns exist in database/setup.sql but were missing from the initial migration

-- Add contact_preference column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS contact_preference TEXT DEFAULT 'whatsapp' CHECK (contact_preference IN ('whatsapp', 'phone', 'text'));

-- Add role column (if not exists)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin'));

-- Add elo_rating column (replace rating column)
-- First check if we need to rename the existing rating column
DO $$
BEGIN
    -- If rating column exists but elo_rating doesn't, rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'rating'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'elo_rating'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users RENAME COLUMN rating TO elo_rating;
        RAISE NOTICE 'Renamed rating column to elo_rating';
    END IF;
    
    -- If neither exists, add elo_rating
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'elo_rating'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN elo_rating INTEGER DEFAULT 1200;
        RAISE NOTICE 'Added elo_rating column';
    END IF;
END $$;

-- Add games_played column (if not exists)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0;

-- Update column constraints to match setup.sql
-- Ensure elo_rating is INTEGER type and has proper default
DO $$
BEGIN
    -- Update elo_rating to be INTEGER if it's not already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'elo_rating'
        AND data_type != 'integer'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ALTER COLUMN elo_rating TYPE INTEGER USING elo_rating::integer;
        ALTER TABLE public.users ALTER COLUMN elo_rating SET DEFAULT 1200;
        RAISE NOTICE 'Updated elo_rating to INTEGER type';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ User table schema alignment completed';
    RAISE NOTICE '📋 Added: contact_preference, role, games_played columns';
    RAISE NOTICE '🔧 Updated: elo_rating column type and constraints';
END $$;