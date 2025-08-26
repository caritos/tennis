-- Test script to verify challenge notification RLS policies
-- This tests that both players can create notifications for each other after accepting a challenge

-- Clean up any existing test data
DELETE FROM notifications WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('challenger@test.com', 'challenged@test.com')
);
DELETE FROM challenges WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.users WHERE email IN ('challenger@test.com', 'challenged@test.com');
DELETE FROM auth.users WHERE email IN ('challenger@test.com', 'challenged@test.com');

-- Create test users
DO $$
DECLARE
  challenger_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
  challenged_id UUID := '00000000-0000-0000-0000-000000000003'::uuid;
  challenge_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  test_club_id UUID;
BEGIN
  -- Create a test club first
  INSERT INTO clubs (id, name, description, location, created_at, updated_at, creator_id)
  VALUES (
    gen_random_uuid(),
    'Test Club',
    'Test Description',
    'Test Location',
    NOW(),
    NOW(),
    challenger_id
  ) RETURNING id INTO test_club_id;

  -- Create challenger user in auth
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    challenger_id,
    'authenticated',
    'authenticated',
    'challenger@test.com',
    '$2a$10$dummy',
    NOW(), NOW(), NOW(),
    '{"provider": "email"}',
    '{"full_name": "Challenger User"}'
  );

  -- Create challenger in public.users
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (challenger_id, 'challenger@test.com', 'Challenger User', NOW(), NOW());

  -- Create challenged user in auth
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    challenged_id,
    'authenticated',
    'authenticated',
    'challenged@test.com',
    '$2a$10$dummy',
    NOW(), NOW(), NOW(),
    '{"provider": "email"}',
    '{"full_name": "Challenged User"}'
  );

  -- Create challenged in public.users
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (challenged_id, 'challenged@test.com', 'Challenged User', NOW(), NOW());

  -- Create a challenge between them
  INSERT INTO challenges (
    id, club_id, challenger_id, challenged_id,
    match_type, status, contacts_shared,
    created_at, updated_at
  ) VALUES (
    challenge_id,
    test_club_id,
    challenger_id,
    challenged_id,
    'singles',
    'accepted',  -- Challenge is already accepted
    true,        -- Contacts are shared
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Setup complete. Testing notification creation...';

  -- Test 1: Challenged user creates notification for themselves (should work)
  BEGIN
    -- Set the session to the challenged user
    PERFORM set_config('request.jwt.claims', json_build_object('sub', challenged_id::text)::text, true);
    PERFORM set_config('request.jwt.claim.sub', challenged_id::text, true);
    
    INSERT INTO notifications (
      id, user_id, type, title, message,
      is_read, related_id, created_at
    ) VALUES (
      gen_random_uuid(),
      challenged_id,  -- Creating for self
      'challenge',
      'Test Self Notification',
      'I accepted a challenge',
      false,
      challenge_id,
      NOW()
    );
    RAISE NOTICE '✅ Test 1 PASSED: Challenged can create notification for self';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test 1 FAILED: Challenged cannot create notification for self - %', SQLERRM;
  END;

  -- Test 2: Challenged user creates notification for challenger (should work with fixed policy)
  BEGIN
    -- Set the session to the challenged user
    PERFORM set_config('request.jwt.claims', json_build_object('sub', challenged_id::text)::text, true);
    PERFORM set_config('request.jwt.claim.sub', challenged_id::text, true);
    
    INSERT INTO notifications (
      id, user_id, type, title, message,
      is_read, related_id, created_at
    ) VALUES (
      gen_random_uuid(),
      challenger_id,  -- Creating for the other player
      'challenge',
      'Challenge Accepted',
      'Your challenge was accepted',
      false,
      challenge_id,
      NOW()
    );
    RAISE NOTICE '✅ Test 2 PASSED: Challenged can notify challenger';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test 2 FAILED: Challenged cannot notify challenger - %', SQLERRM;
  END;

  -- Test 3: Challenger user creates notification for challenged (should work)
  BEGIN
    -- Set the session to the challenger user
    PERFORM set_config('request.jwt.claims', json_build_object('sub', challenger_id::text)::text, true);
    PERFORM set_config('request.jwt.claim.sub', challenger_id::text, true);
    
    INSERT INTO notifications (
      id, user_id, type, title, message,
      is_read, related_id, created_at
    ) VALUES (
      gen_random_uuid(),
      challenged_id,  -- Creating for the other player
      'challenge',
      'Challenge Update',
      'Challenge status updated',
      false,
      challenge_id,
      NOW()
    );
    RAISE NOTICE '✅ Test 3 PASSED: Challenger can notify challenged';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test 3 FAILED: Challenger cannot notify challenged - %', SQLERRM;
  END;

  -- Test 4: Random user cannot create notifications (should fail)
  BEGIN
    -- Set the session to a random user
    PERFORM set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid()::text)::text, true);
    PERFORM set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
    
    INSERT INTO notifications (
      id, user_id, type, title, message,
      is_read, related_id, created_at
    ) VALUES (
      gen_random_uuid(),
      challenger_id,
      'challenge',
      'Hacker Notification',
      'This should fail',
      false,
      challenge_id,
      NOW()
    );
    RAISE NOTICE '❌ Test 4 FAILED: Random user CAN create notifications (security issue!)';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ Test 4 PASSED: Random user cannot create notifications';
  END;

  -- Clean up
  DELETE FROM notifications WHERE related_id = challenge_id;
  DELETE FROM challenges WHERE id = challenge_id;
  DELETE FROM clubs WHERE id = test_club_id;
  DELETE FROM public.users WHERE id IN (challenger_id, challenged_id);
  DELETE FROM auth.users WHERE id IN (challenger_id, challenged_id);
  
  RAISE NOTICE '';
  RAISE NOTICE '==== TEST COMPLETE ====';
  RAISE NOTICE 'If all 4 tests passed, the RLS policy is working correctly!';
  
END $$;