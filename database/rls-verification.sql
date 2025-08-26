-- Run this after applying URGENT-RLS-FIX.sql to verify the security fix worked
-- Go to: https://supabase.com/dashboard/project/dgkdbqloehxruoijylzw/sql/new

-- 1. Verify RLS is enabled on both tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ SECURE' 
        ELSE '❌ VULNERABLE' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('reports', 'blocked_users')
ORDER BY tablename;

-- 2. Check that RLS policies exist
SELECT 
    tablename,
    policyname,
    cmd as command_type,
    CASE 
        WHEN cmd = 'SELECT' THEN '👀 Read Access'
        WHEN cmd = 'INSERT' THEN '➕ Create Access'  
        WHEN cmd = 'DELETE' THEN '🗑️ Delete Access'
        ELSE cmd
    END as policy_type
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('reports', 'blocked_users')
ORDER BY tablename, policyname;

-- 3. Verify indexes were created for performance
SELECT 
    schemaname,
    tablename, 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('reports', 'blocked_users')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected Results:
-- 1. Both tables should show rls_enabled = true and status = '✅ SECURE'
-- 2. Should see policies for both tables covering SELECT, INSERT, and DELETE operations
-- 3. Should see 4 new indexes (2 per table) for performance