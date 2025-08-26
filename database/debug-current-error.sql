-- Debug the current RLS error
-- Nina (1c4f895b-88fb-485f-ad09-506e5677e536) trying to create notification 
-- for Eladio (26008694-f9db-4a14-9b28-e089fac97440) 
-- for challenge 8d78e3ba-f4f7-4147-afc9-af0032b3f027

-- Check if this challenge exists
SELECT 
    'Challenge Check' as test,
    id,
    challenger_id,
    challenged_id,
    status,
    CASE 
        WHEN challenger_id = '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid THEN 'Nina is challenger'
        WHEN challenged_id = '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid THEN 'Nina is challenged'
        ELSE 'Nina not involved'
    END as nina_role,
    CASE 
        WHEN challenger_id = '26008694-f9db-4a14-9b28-e089fac97440'::uuid THEN 'Eladio is challenger'
        WHEN challenged_id = '26008694-f9db-4a14-9b28-e089fac97440'::uuid THEN 'Eladio is challenged'
        ELSE 'Eladio not involved'
    END as eladio_role
FROM challenges 
WHERE id::text = '8d78e3ba-f4f7-4147-afc9-af0032b3f027';

-- Test the exact policy logic that should allow this
WITH test_scenario AS (
    SELECT 
        '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid as auth_uid,      -- Nina (creator)
        '26008694-f9db-4a14-9b28-e089fac97440'::uuid as notification_user_id, -- Eladio (recipient)
        '8d78e3ba-f4f7-4147-afc9-af0032b3f027'::text as related_challenge_id,
        'challenge' as notification_type
)
SELECT 
    'Policy Logic Test' as test_name,
    ts.*,
    
    -- Test: auth.uid() = user_id (should be false)
    (ts.auth_uid = ts.notification_user_id) as "Own notification?",
    
    -- Test: type = 'challenge' (should be true)
    (ts.notification_type = 'challenge') as "Is challenge type?",
    
    -- Test: related_id IS NOT NULL (should be true)
    (ts.related_challenge_id IS NOT NULL) as "Has related_id?",
    
    -- Test: Challenge exists
    EXISTS (
        SELECT 1 FROM challenges c 
        WHERE c.id::text = ts.related_challenge_id::text
    ) as "Challenge exists?",
    
    -- Test: User involved in challenge
    EXISTS (
        SELECT 1 FROM challenges c 
        WHERE c.id::text = ts.related_challenge_id::text
        AND (c.challenger_id = ts.auth_uid OR c.challenged_id = ts.auth_uid)
    ) as "Nina involved in challenge?",
    
    -- Test: Recipient involved in challenge  
    EXISTS (
        SELECT 1 FROM challenges c 
        WHERE c.id::text = ts.related_challenge_id::text
        AND (c.challenger_id = ts.notification_user_id OR c.challenged_id = ts.notification_user_id)
    ) as "Eladio involved in challenge?",
    
    -- Test: Full policy condition
    (
        ts.auth_uid = ts.notification_user_id
        OR
        (
            ts.notification_type = 'challenge' 
            AND ts.related_challenge_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM challenges c 
                WHERE c.id::text = ts.related_challenge_id::text
                AND (c.challenger_id = ts.auth_uid OR c.challenged_id = ts.auth_uid)
                AND (c.challenger_id = ts.notification_user_id OR c.challenged_id = ts.notification_user_id)
            )
        )
    ) as "Should policy ALLOW?"
    
FROM test_scenario ts;

-- Show the actual policy text to verify it matches our expectation
SELECT 
    policyname,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
AND cmd = 'INSERT';