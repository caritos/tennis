-- Test script to verify challenge notification RLS policy works correctly
-- This can be run in Supabase SQL Editor to test the fix

-- First, ensure RLS is enabled on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy and recreate with the fix
DROP POLICY IF EXISTS "Authenticated users can create challenge notifications" ON notifications;

-- Recreate the fixed policy
CREATE POLICY "Authenticated users can create challenge notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' 
    AND type = 'challenge'
    AND (
      -- Users can create notifications for themselves
      auth.uid()::text = user_id::text
      OR 
      -- Users can create notifications for other participants in their challenges
      EXISTS (
        SELECT 1 FROM challenges c 
        WHERE c.id::text = (action_data->>'challengeId')::text
        AND (
          (c.challenger_id::text = auth.uid()::text AND c.challenged_id::text = user_id::text) OR
          (c.challenged_id::text = auth.uid()::text AND c.challenger_id::text = user_id::text)
        )
      )
    )
  );

-- Test query to verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications' AND policyname LIKE '%challenge%'
ORDER BY policyname;