-- ============================================================================
-- FIX SECURITY WARNINGS - Function Search Path
-- This script adds SET search_path = public to all functions to prevent SQL injection
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Fix create_match_invitation function
ALTER FUNCTION public.create_match_invitation(UUID, UUID, TEXT, DATE, TIME, TEXT, UUID[])
SET search_path = public;

-- 2. Fix update_updated_at_column function
ALTER FUNCTION public.update_updated_at_column()
SET search_path = public;

-- 3. Fix is_admin function
ALTER FUNCTION public.is_admin(UUID)
SET search_path = public;

-- 4. Fix update_player_ratings function
ALTER FUNCTION public.update_player_ratings()
SET search_path = public;

-- 5. Fix debug_match_invitations function
ALTER FUNCTION public.debug_match_invitations()
SET search_path = public;

-- 6. Fix get_club_match_invitations function
ALTER FUNCTION public.get_club_match_invitations(UUID)
SET search_path = public;

-- 7. Fix create_club_creation_notifications function
ALTER FUNCTION public.create_club_creation_notifications()
SET search_path = public;

-- 8. Fix create_challenge_notifications function
ALTER FUNCTION public.create_challenge_notifications()
SET search_path = public;

-- 9. Fix can_create_notification function (both overloads if they exist)
-- First overload
DO $$
BEGIN
    -- Check if function exists and alter it
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'can_create_notification'
    ) THEN
        -- This will apply to all overloads of the function
        EXECUTE 'ALTER FUNCTION public.can_create_notification SET search_path = public';
    END IF;
END $$;

-- 10. Fix create_match_invitation_notifications function
ALTER FUNCTION public.create_match_invitation_notifications()
SET search_path = public;

-- 11. Fix create_club_join_notifications function
ALTER FUNCTION public.create_club_join_notifications()
SET search_path = public;

-- 12. Fix create_match_result_notifications function
ALTER FUNCTION public.create_match_result_notifications()
SET search_path = public;

-- 13. Fix handle_new_user function (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'handle_new_user'
    ) THEN
        EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public';
    END IF;
END $$;

-- ============================================================================
-- VERIFY THE FIXES
-- Run this query to check if all functions now have search_path set
-- ============================================================================

/*
-- Run this separately to verify the fixes:

SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    p.prosecdef AS security_definer,
    p.proconfig AS config_settings,
    CASE 
        WHEN p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig))
        THEN 'NEEDS FIX'
        ELSE 'OK'
    END AS search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY function_name;
*/

-- ============================================================================
-- ADDITIONAL SECURITY RECOMMENDATIONS
-- ============================================================================

/*
MANUAL FIXES REQUIRED IN SUPABASE DASHBOARD:

1. AUTH OTP EXPIRY:
   - Go to Authentication > Providers > Email
   - Set "OTP Expiry" to 3600 seconds (1 hour) or less
   - Recommended: 900 seconds (15 minutes)

2. LEAKED PASSWORD PROTECTION:
   - Go to Authentication > Security
   - Enable "Leaked Password Protection"
   - This checks passwords against HaveIBeenPwned database

These settings cannot be changed via SQL and must be configured in the Supabase Dashboard.
*/

-- ============================================================================
-- END OF SECURITY FIXES
-- ============================================================================