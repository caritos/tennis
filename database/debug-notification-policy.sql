-- Debug notification policy issue
-- Check the current policy and test it

-- 1. Check current notification policy
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'notifications';

-- 2. Check the challenge that failed
SELECT id, challenger_id, challenged_id, status, match_type, created_at, updated_at
FROM challenges 
WHERE id = 'ee003c0f-76bb-4a27-8e39-10ba71c8a072';

-- 3. Test the policy logic manually with actual values
-- Replace with your actual user IDs to test
DO $$
DECLARE
  challenge_id TEXT := 'ee003c0f-76bb-4a27-8e39-10ba71c8a072';
  current_user_id TEXT := 'c6d151b0-5690-4e69-b8f2-859e68b3d90b'; -- Eladio
  notification_user_id TEXT := 'a190e939-4749-496f-ada3-e395726febe6'; -- Claire
  challenge_exists BOOLEAN;
BEGIN
  -- Test if the challenge exists and matches the policy conditions
  SELECT EXISTS(
    SELECT 1 FROM challenges c 
    WHERE c.id = challenge_id::uuid
    AND (
      -- Auth user is challenger, creating for challenged
      (c.challenger_id::text = current_user_id AND c.challenged_id::text = notification_user_id)
      OR
      -- Auth user is challenged, creating for challenger
      (c.challenged_id::text = current_user_id AND c.challenger_id::text = notification_user_id)
    )
  ) INTO challenge_exists;
  
  RAISE NOTICE 'Challenge exists and matches policy: %', challenge_exists;
  
  -- Also check the challenge details
  RAISE NOTICE 'Challenge details: challenger=%, challenged=%, current_user=%, notification_for=%', 
    (SELECT challenger_id FROM challenges WHERE id = challenge_id::uuid),
    (SELECT challenged_id FROM challenges WHERE id = challenge_id::uuid),
    current_user_id,
    notification_user_id;
END $$;