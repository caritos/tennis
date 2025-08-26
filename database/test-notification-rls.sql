-- Test the notification RLS policy with the exact values from the logs
-- This will help us debug why the policy is failing

-- Test values from the logs
DO $$
DECLARE
  test_challenge_id TEXT := '13775e9c-6ecb-42c6-af62-fe1bc97fa2a4';
  test_current_user TEXT := 'd37dcae6-5e1c-4334-980a-154ef0debfb1';  -- Amelia (challenged, auth user)
  test_notification_user TEXT := 'c6d151b0-5690-4e69-b8f2-859e68b3d90b'; -- Eladio (challenger, notification target)
  challenge_exists BOOLEAN;
  policy_match BOOLEAN;
BEGIN
  -- Test 1: Does the challenge exist?
  SELECT EXISTS(
    SELECT 1 FROM challenges 
    WHERE id = test_challenge_id::uuid
  ) INTO challenge_exists;
  
  RAISE NOTICE 'Test 1 - Challenge exists: %', challenge_exists;
  
  -- Test 2: Test the exact policy condition
  SELECT EXISTS(
    SELECT 1 FROM challenges c 
    WHERE c.id = test_challenge_id::uuid
    AND (
      -- Auth user is challenged, creating for challenger
      (c.challenged_id::text = test_current_user AND c.challenger_id::text = test_notification_user)
    )
  ) INTO policy_match;
  
  RAISE NOTICE 'Test 2 - Policy condition matches: %', policy_match;
  
  -- Test 3: Show the actual challenge data
  RAISE NOTICE 'Test 3 - Challenge details:';
  RAISE NOTICE '  Challenge ID: %', test_challenge_id;
  RAISE NOTICE '  Current user (auth.uid): %', test_current_user;
  RAISE NOTICE '  Notification target (user_id): %', test_notification_user;
  
  -- Show actual challenge data
  RAISE NOTICE 'Test 4 - Actual challenge record:';
  FOR challenge_info IN 
    SELECT id, status, challenger_id, challenged_id 
    FROM challenges 
    WHERE id = test_challenge_id::uuid
  LOOP
    RAISE NOTICE '  ID: %', challenge_info.id;
    RAISE NOTICE '  Status: %', challenge_info.status;
    RAISE NOTICE '  Challenger ID: %', challenge_info.challenger_id;
    RAISE NOTICE '  Challenged ID: %', challenge_info.challenged_id;
    RAISE NOTICE '  challenger_id::text = notification_user: % = % -> %', 
      challenge_info.challenger_id::text, test_notification_user, 
      (challenge_info.challenger_id::text = test_notification_user);
    RAISE NOTICE '  challenged_id::text = current_user: % = % -> %', 
      challenge_info.challenged_id::text, test_current_user, 
      (challenge_info.challenged_id::text = test_current_user);
  END LOOP;
  
END $$;