-- Add missing fields to align database with application code
-- Migration: 20250826140000_add_missing_fields.sql
-- Adds fields that the application expects but are missing from current schema

-- Add member_count to clubs table
-- This field is used by ClubCard and index components to display member counts
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- Add profile_photo_uri to users table
-- This field is used by AdvancedProfileScreen for user profile photos
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_photo_uri TEXT;

-- Add notification_preferences to users table
-- This field is used by AdvancedProfileScreen for user notification settings
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';

-- Create index for performance on member_count queries
CREATE INDEX IF NOT EXISTS idx_clubs_member_count ON public.clubs(member_count);

-- Create index for profile photo queries
CREATE INDEX IF NOT EXISTS idx_users_profile_photo ON public.users(profile_photo_uri) WHERE profile_photo_uri IS NOT NULL;

-- Update existing clubs to have accurate member counts
-- This will populate the member_count field with current data
UPDATE public.clubs 
SET member_count = (
  SELECT COUNT(*) 
  FROM public.club_members 
  WHERE club_members.club_id = clubs.id
)
WHERE member_count = 0 OR member_count IS NULL;

-- Rollback instructions:
-- ALTER TABLE public.clubs DROP COLUMN IF EXISTS member_count;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS profile_photo_uri;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS notification_preferences;
-- DROP INDEX IF EXISTS idx_clubs_member_count;
-- DROP INDEX IF EXISTS idx_users_profile_photo;