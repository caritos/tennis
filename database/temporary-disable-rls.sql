-- Temporary fix: Disable RLS on notifications to test if challenges work
-- This is for debugging only - we'll re-enable it afterwards

-- Disable RLS temporarily
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Check status
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'notifications' 
AND schemaname = 'public';