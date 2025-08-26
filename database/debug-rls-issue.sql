-- Debug RLS Issue
-- Run this in Supabase Dashboard to understand why the policy is failing

-- 1. Check current policies on notifications table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 2. Test the specific scenario that's failing
-- User 26008694-f9db-4a14-9b28-e089fac97440 (Eladio) trying to notify 1c4f895b-88fb-485f-ad09-506e5677e536 (Nina)
-- For challenge 2ad61528-d6e8-4e50-b5ac-84ff40204bd9

-- Check if the challenge exists and has correct structure
SELECT 
    id,
    challenger_id,
    challenged_id,
    status,
    CASE 
        WHEN challenger_id = '1c4f895b-88fb-485f-ad09-506e5677e536' AND challenged_id = '26008694-f9db-4a14-9b28-e089fac97440' 
        THEN 'Nina challenged Eladio - Correct'
        ELSE 'Unexpected challenge structure'
    END as challenge_check
FROM challenges 
WHERE id IN ('2ad61528-d6e8-4e50-b5ac-84ff40204bd9', '0715864d-174c-42f8-9573-de8c20162246', '0a01ff63-637d-4a46-9bbb-95fc11b0ce50')
ORDER BY created_at DESC;

-- 3. Simulate the policy check
WITH policy_test AS (
    SELECT 
        '26008694-f9db-4a14-9b28-e089fac97440'::uuid as current_user,
        '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid as target_user,
        '2ad61528-d6e8-4e50-b5ac-84ff40204bd9'::uuid as challenge_id
)
SELECT 
    'Policy Test' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM challenges c, policy_test p
            WHERE c.id = p.challenge_id
            AND (
                (c.challenger_id = p.current_user AND c.challenged_id = p.target_user) OR
                (c.challenged_id = p.current_user AND c.challenger_id = p.target_user)
            )
        ) THEN 'Should ALLOW - Challenge relationship exists'
        ELSE 'Should DENY - No matching challenge relationship'
    END as result;

-- 4. Check if RLS is enabled on notifications
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'notifications' 
AND schemaname = 'public';

-- 5. Test with actual auth context (this will use your Dashboard session)
-- Try to simulate the insert that's failing
SELECT 
    auth.uid() as current_auth_user,
    'If this is NULL, run this query while logged into Dashboard' as note;