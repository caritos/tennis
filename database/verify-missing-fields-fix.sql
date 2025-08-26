-- Verify Missing Fields Fix Applied Successfully
-- Run this after applying add-missing-fields.sql

-- 1. Check that all expected fields exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'member_count' AND data_type = 'integer' THEN '✅ ADDED'
        WHEN column_name = 'profile_photo_uri' AND data_type = 'text' THEN '✅ ADDED'
        WHEN column_name = 'notification_preferences' AND data_type = 'jsonb' THEN '✅ ADDED'
        ELSE '❓ CHECK'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND ((table_name = 'clubs' AND column_name = 'member_count')
       OR (table_name = 'users' AND column_name IN ('profile_photo_uri', 'notification_preferences')))
ORDER BY table_name, column_name;

-- 2. Check that indexes were created
SELECT 
    schemaname,
    tablename, 
    indexname,
    CASE 
        WHEN indexname = 'idx_clubs_member_count' THEN '✅ PERFORMANCE INDEX'
        WHEN indexname = 'idx_users_profile_photo' THEN '✅ PERFORMANCE INDEX'
        ELSE indexname
    END as index_status
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname IN ('idx_clubs_member_count', 'idx_users_profile_photo')
ORDER BY tablename, indexname;

-- 3. Check sample data to ensure member_count was populated
SELECT 
    name,
    member_count,
    CASE 
        WHEN member_count IS NOT NULL AND member_count >= 0 THEN '✅ POPULATED'
        WHEN member_count IS NULL THEN '⚠️ NULL'
        ELSE '❓ CHECK'
    END as data_status
FROM public.clubs 
ORDER BY member_count DESC 
LIMIT 5;

-- 4. Verify notification_preferences default structure
SELECT 
    id,
    full_name,
    notification_preferences,
    CASE 
        WHEN notification_preferences IS NOT NULL THEN '✅ HAS DEFAULT'
        WHEN notification_preferences IS NULL THEN '⚠️ NULL'
        ELSE '❓ CHECK'
    END as preferences_status
FROM public.users 
WHERE notification_preferences IS NOT NULL
LIMIT 3;

-- Expected Results Summary:
-- ✅ 3 fields should show as ADDED (member_count, profile_photo_uri, notification_preferences)
-- ✅ 2 indexes should show as PERFORMANCE INDEX
-- ✅ Clubs should show member counts populated with actual data
-- ✅ Users should show notification_preferences with default JSON structure