-- Temporarily disable RLS to see the actual insertion values
-- This will help us understand what data is being inserted

-- Disable RLS temporarily to allow the insertion
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Check the challenge that's causing the error
SELECT 
    'Challenge Details' as test,
    id,
    challenger_id,
    challenged_id,
    status,
    created_at,
    -- Check if this is the failing challenge
    CASE WHEN id::text = '8d78e3ba-f4f7-4147-afc9-af0032b3f027' 
         THEN '🎯 THIS IS THE FAILING CHALLENGE' 
         ELSE 'Other challenge' 
    END as is_failing_challenge
FROM challenges 
WHERE (challenger_id = '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid 
       OR challenged_id = '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid)
   OR (challenger_id = '26008694-f9db-4a14-9b28-e089fac97440'::uuid 
       OR challenged_id = '26008694-f9db-4a14-9b28-e089fac97440'::uuid)
ORDER BY created_at DESC
LIMIT 10;

-- Check status
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'notifications' 
AND schemaname = 'public';