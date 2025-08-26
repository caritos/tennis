-- Test RLS Policy Directly
-- Run this in Supabase Dashboard to test the exact failing scenario

-- Test if the policy would allow the insertion
-- Eladio (26008694) trying to notify Nina (1c4f895b) for challenge 15aeb67f
WITH test_data AS (
    SELECT 
        '26008694-f9db-4a14-9b28-e089fac97440'::uuid as current_user_id,
        '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid as target_user_id,
        '15aeb67f-f35f-4c8c-8bca-a50fd9fed8c4'::text as challenge_id_text,
        'challenge' as notification_type
)
SELECT 
    'Policy Evaluation' as test,
    td.*,
    -- Check if challenge exists
    EXISTS (
        SELECT 1 FROM challenges 
        WHERE id::text = td.challenge_id_text
    ) as "Challenge exists?",
    -- Check the exact policy condition
    EXISTS (
        SELECT 1 FROM challenges c
        WHERE c.id::text = td.challenge_id_text
        AND (
            (c.challenger_id = td.current_user_id AND c.challenged_id = td.target_user_id) OR
            (c.challenged_id = td.current_user_id AND c.challenger_id = td.target_user_id)
        )
    ) as "Policy condition matches?",
    -- Get actual challenge details
    (
        SELECT json_build_object(
            'id', c.id,
            'challenger_id', c.challenger_id,
            'challenged_id', c.challenged_id,
            'matches_condition', 
            CASE 
                WHEN c.challenged_id = td.current_user_id AND c.challenger_id = td.target_user_id 
                THEN 'YES - Eladio is challenged, Nina is challenger'
                WHEN c.challenger_id = td.current_user_id AND c.challenged_id = td.target_user_id
                THEN 'YES - Eladio is challenger, Nina is challenged'
                ELSE 'NO - Does not match either condition'
            END
        )
        FROM challenges c
        WHERE c.id::text = td.challenge_id_text
    ) as "Challenge details"
FROM test_data td;

-- Check the actual policy text to ensure it was updated
SELECT 
    policyname,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND cmd = 'INSERT'
AND schemaname = 'public';

-- Test with SET ROLE to simulate the actual auth context
-- This simulates what happens when Eladio's session tries to insert
SET LOCAL ROLE postgres;  -- Reset to superuser first
SET LOCAL auth.uid = '26008694-f9db-4a14-9b28-e089fac97440';  -- Set auth context to Eladio

-- Try to evaluate if the policy would allow this specific insert
SELECT 
    'Simulated Insert Check' as test,
    CASE 
        WHEN (
            -- Check if policy would allow
            '26008694-f9db-4a14-9b28-e089fac97440'::uuid = '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid  -- Own notification check
            OR
            (
                'challenge' = 'challenge' AND
                '15aeb67f-f35f-4c8c-8bca-a50fd9fed8c4' IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM challenges c
                    WHERE c.id::text = '15aeb67f-f35f-4c8c-8bca-a50fd9fed8c4'::text
                    AND (
                        (c.challenger_id = '26008694-f9db-4a14-9b28-e089fac97440'::uuid AND c.challenged_id = '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid) OR
                        (c.challenged_id = '26008694-f9db-4a14-9b28-e089fac97440'::uuid AND c.challenger_id = '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid)
                    )
                )
            )
        )
        THEN 'ALLOW - Policy conditions met'
        ELSE 'DENY - Policy conditions NOT met'
    END as result;

RESET ROLE;  -- Reset role back