-- Add Missing Database Fields
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/dgkdbqloehxruoijylzw/sql/new

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clubs_member_count ON public.clubs(member_count);
CREATE INDEX IF NOT EXISTS idx_users_profile_photo ON public.users(profile_photo_uri) WHERE profile_photo_uri IS NOT NULL;

-- Populate existing clubs with accurate member counts
-- This will update the member_count field with current data
UPDATE public.clubs 
SET member_count = (
  SELECT COUNT(*) 
  FROM public.club_members 
  WHERE club_members.club_id = clubs.id
)
WHERE member_count = 0 OR member_count IS NULL;

-- Verify the changes were applied
SELECT 'clubs' as table_name, 
       column_name, 
       data_type, 
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'clubs' 
  AND table_schema = 'public'
  AND column_name = 'member_count'

UNION ALL

SELECT 'users' as table_name,
       column_name,
       data_type, 
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'users'
  AND table_schema = 'public' 
  AND column_name IN ('profile_photo_uri', 'notification_preferences')
ORDER BY table_name, column_name;

-- Expected results should show:
-- clubs.member_count (integer, nullable, default 0)
-- users.notification_preferences (jsonb, nullable, default '{}')  
-- users.profile_photo_uri (text, nullable, no default)