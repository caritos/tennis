-- ============================================================================
-- FIX SECURITY WARNINGS - Function Search Path (SAFE VERSION)
-- This script first identifies functions then fixes them
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: First, let's see what functions actually exist
-- Run this query first to see all public functions:

SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    p.prosecdef AS security_definer,
    p.proconfig AS config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY function_name;

-- ============================================================================
-- Step 2: Fix each function using dynamic SQL
-- This approach will only fix functions that actually exist
-- ============================================================================

DO $$
DECLARE
    func_record RECORD;
    alter_stmt TEXT;
BEGIN
    -- Loop through all public functions that need fixing
    FOR func_record IN 
        SELECT 
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS arguments,
            p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
            AND p.prokind = 'f'
            -- Only fix functions that don't already have search_path set
            AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)))
            -- Only fix the functions mentioned in the security warnings
            AND p.proname IN (
                'create_match_invitation',
                'update_updated_at_column',
                'is_admin',
                'update_player_ratings',
                'debug_match_invitations',
                'get_club_match_invitations',
                'create_club_creation_notifications',
                'create_challenge_notifications',
                'can_create_notification',
                'create_match_invitation_notifications',
                'create_club_join_notifications',
                'create_match_result_notifications',
                'handle_new_user'
            )
    LOOP
        -- Build the ALTER FUNCTION statement
        alter_stmt := format('ALTER FUNCTION public.%I(%s) SET search_path = public',
                            func_record.function_name,
                            func_record.arguments);
        
        -- Execute the statement
        EXECUTE alter_stmt;
        
        -- Log what we fixed
        RAISE NOTICE 'Fixed function: %.%(%)', 'public', func_record.function_name, func_record.arguments;
    END LOOP;
    
    RAISE NOTICE 'Security fix complete!';
END $$;

-- ============================================================================
-- Step 3: Verify all functions are fixed
-- ============================================================================

SELECT 
    'After Fix:' AS status,
    p.proname AS function_name,
    CASE 
        WHEN p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig))
        THEN '❌ STILL NEEDS FIX'
        ELSE '✅ FIXED'
    END AS search_path_status,
    p.proconfig AS config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND p.proname IN (
        'create_match_invitation',
        'update_updated_at_column',
        'is_admin',
        'update_player_ratings',
        'debug_match_invitations',
        'get_club_match_invitations',
        'create_club_creation_notifications',
        'create_challenge_notifications',
        'can_create_notification',
        'create_match_invitation_notifications',
        'create_club_join_notifications',
        'create_match_result_notifications'
    )
ORDER BY function_name;

-- ============================================================================
-- ADDITIONAL MANUAL FIXES REQUIRED IN SUPABASE DASHBOARD
-- ============================================================================

/*
MANUAL FIXES REQUIRED:

1. AUTH OTP EXPIRY (Warning #14):
   - Go to Authentication > Providers > Email
   - Set "OTP Expiry" to 3600 seconds (1 hour) or less
   - Recommended: 900 seconds (15 minutes)

2. LEAKED PASSWORD PROTECTION (Warning #15):
   - Go to Authentication > Security
   - Enable "Leaked Password Protection"
   - This checks passwords against HaveIBeenPwned database

These settings cannot be changed via SQL and must be configured in the Supabase Dashboard.
*/

-- ============================================================================
-- END OF SECURITY FIXES
-- ============================================================================