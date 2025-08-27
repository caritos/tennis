-- Remove contact_preference column from users table
-- This column was added but is not needed since the app only uses phone numbers

-- Drop the contact_preference column
ALTER TABLE public.users DROP COLUMN IF EXISTS contact_preference;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Removed contact_preference column from users table';
    RAISE NOTICE '📞 App now uses phone numbers directly without preference tracking';
END $$;