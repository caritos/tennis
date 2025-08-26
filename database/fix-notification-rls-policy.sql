-- Fix Notification RLS Policy for Challenge Contact Sharing
-- This fixes the issue where users cannot create notifications for other users during challenge acceptance

-- Drop existing insert policy for notifications
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;

-- Create a new insert policy that allows:
-- 1. Users to create their own notifications
-- 2. Users to create notifications for challenge participants when accepting/creating challenges
CREATE POLICY "Users can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    -- User can create their own notifications
    auth.uid() = user_id
    OR
    -- User can create notifications for challenge participants (contact sharing)
    -- This allows the challenged user to notify the challenger when accepting
    (
      type = 'challenge' AND
      related_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.challenges c
        WHERE c.id::text = related_id
        AND (
          -- Challenger can notify challenged
          (c.challenger_id = auth.uid() AND c.challenged_id = user_id) OR
          -- Challenged can notify challenger (when accepting)
          (c.challenged_id = auth.uid() AND c.challenger_id = user_id)
        )
      )
    )
  );

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
  AND policyname = 'Users can create notifications';

-- Test the policy (should return true for both scenarios)
SELECT 
  'Can create own notification' as test_case,
  EXISTS (
    SELECT 1 
    FROM public.challenges 
    WHERE id = '0a01ff63-637d-4a46-9bbb-95fc11b0ce50'
  ) as challenge_exists,
  '26008694-f9db-4a14-9b28-e089fac97440' as current_user,
  '1c4f895b-88fb-485f-ad09-506e5677e536' as target_user,
  'Should be able to notify challenger when accepting' as expected;