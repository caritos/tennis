-- Full RLS Diagnostic
-- Run each section in Supabase Dashboard to diagnose the issue

-- SECTION 1: Check what policies exist
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- SECTION 2: Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'notifications' 
AND schemaname = 'public';

-- SECTION 3: Check the specific challenge that's failing
SELECT 
    id,
    challenger_id,
    challenged_id,
    status,
    contacts_shared,
    created_at,
    CASE 
        WHEN challenger_id = '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid THEN 'Nina is challenger'
        WHEN challenger_id = '26008694-f9db-4a14-9b28-e089fac97440'::uuid THEN 'Eladio is challenger'
        ELSE 'Unknown challenger'
    END as who_challenged
FROM challenges 
WHERE id = '2ad61528-d6e8-4e50-b5ac-84ff40204bd9'::uuid
   OR id IN (
       SELECT id FROM challenges 
       WHERE (challenger_id = '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid 
              OR challenged_id = '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid)
       ORDER BY created_at DESC 
       LIMIT 5
   );

-- SECTION 4: Test the exact policy logic
WITH test_scenario AS (
    SELECT 
        '26008694-f9db-4a14-9b28-e089fac97440'::uuid as auth_uid,
        '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid as notification_user_id,
        '2ad61528-d6e8-4e50-b5ac-84ff40204bd9'::uuid as related_challenge_id,
        'challenge' as notification_type
)
SELECT 
    'Insert Policy Test' as test_name,
    ts.*,
    EXISTS (
        SELECT 1 
        FROM challenges c
        WHERE c.id = ts.related_challenge_id
    ) as "Challenge Exists?",
    EXISTS (
        SELECT 1 
        FROM challenges c
        WHERE c.id = ts.related_challenge_id
        AND c.challenged_id = ts.auth_uid
        AND c.challenger_id = ts.notification_user_id
    ) as "Eladio accepting Nina's challenge?",
    EXISTS (
        SELECT 1 
        FROM challenges c
        WHERE c.id = ts.related_challenge_id
        AND c.challenger_id = ts.auth_uid
        AND c.challenged_id = ts.notification_user_id  
    ) as "Eladio challenging Nina?",
    EXISTS (
        SELECT 1 
        FROM challenges c
        WHERE c.id = ts.related_challenge_id
        AND (
            (c.challenger_id = ts.auth_uid AND c.challenged_id = ts.notification_user_id) OR
            (c.challenged_id = ts.auth_uid AND c.challenger_id = ts.notification_user_id)
        )
    ) as "Should Policy Allow?"
FROM test_scenario ts;

-- SECTION 5: Check the exact INSERT policy
SELECT 
    policyname,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
AND cmd = 'INSERT';

-- SECTION 6: Check recent notifications to see what's working
SELECT 
    id,
    user_id,
    type,
    title,
    related_id,
    created_at,
    CASE 
        WHEN user_id = '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid THEN 'Nina'
        WHEN user_id = '26008694-f9db-4a14-9b28-e089fac97440'::uuid THEN 'Eladio'
        ELSE 'Unknown'
    END as user_name
FROM notifications
WHERE type = 'challenge'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;