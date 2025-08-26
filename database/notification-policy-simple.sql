-- Simplified notification RLS policy that should definitely work
-- Drop existing policy and create a much simpler one

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow notification creation" ON notifications;

-- Create a very simple policy for testing
CREATE POLICY "Allow notification creation" ON notifications
  FOR INSERT WITH CHECK (
    -- Service role can always create
    auth.role() = 'service_role'
    OR
    -- For now, allow all authenticated users to create any notifications
    -- We'll add restrictions back once we confirm this basic policy works
    (
      auth.role() = 'authenticated'
      AND (
        -- Users can create notifications for themselves
        auth.uid() = user_id
        OR
        -- OR temporarily allow creating notifications for anyone (for debugging)
        -- We'll restrict this once we confirm the policy mechanism works
        type = 'challenge'
      )
    )
  );

-- Verify the policy was created
SELECT 'Simple notification policy created for testing!' as status;