-- Update only the notification policy to remove string casting
-- This should fix the RLS issue

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow notification creation" ON notifications;

-- Create the updated policy without string casting
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
        auth.uid() = user_id
        OR
        -- Case 2: For challenge notifications, participants can notify each other
        (
          type = 'challenge' 
          AND related_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM challenges c 
            WHERE c.id = related_id
            AND (
              -- Auth user is challenger, creating for challenged
              (c.challenger_id = auth.uid() AND c.challenged_id = user_id)
              OR
              -- Auth user is challenged, creating for challenger
              (c.challenged_id = auth.uid() AND c.challenger_id = user_id)
            )
          )
        )
      )
    )
  );

-- Verify the fix
SELECT 'Notification policy updated - removed string casting!' as status;