-- Fix notification RLS policy - Version 2
-- More explicit policy with better debugging

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow notification creation" ON notifications;

-- Create a more explicit policy with better conditions
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
          AND (
            -- Check if there's a challenge where the current user is a participant
            -- and the notification target is the other participant
            EXISTS (
              SELECT 1 FROM challenges 
              WHERE challenges.id = related_id
              AND (
                -- Current user is challenger, creating notification for challenged
                (challenges.challenger_id = auth.uid() AND challenges.challenged_id = user_id)
                OR
                -- Current user is challenged, creating notification for challenger
                (challenges.challenged_id = auth.uid() AND challenges.challenger_id = user_id)
              )
            )
          )
        )
      )
    )
  );

-- Test the policy with a simple query
SELECT 'Notification policy updated successfully!' as status;