-- Quick fix for notification RLS policy in production
-- Fixes issue #104 - Challenge notifications failing

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow notification creation" ON notifications;

-- Create the fixed policy with proper string casting
CREATE POLICY "Allow notification creation" ON notifications
  FOR INSERT WITH CHECK (
    -- Service role can always create
    auth.role() = 'service_role'
    OR
    -- Authenticated users can create notifications
    (
      auth.role() = 'authenticated' 
      AND (
        -- Case 1: Users can always create notifications for themselves
        auth.uid()::text = user_id::text
        OR
        -- Case 2: For challenge notifications, participants can notify each other
        (
          type = 'challenge' 
          AND related_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM challenges c 
            WHERE c.id = related_id::uuid
            AND (
              -- Auth user is challenger, creating for challenged
              (c.challenger_id::text = auth.uid()::text AND c.challenged_id::text = user_id::text)
              OR
              -- Auth user is challenged, creating for challenger  
              (c.challenged_id::text = auth.uid()::text AND c.challenger_id::text = user_id::text)
            )
          )
        )
      )
    )
  );

-- Verify the fix
SELECT 'Notification policy updated successfully!' as status;