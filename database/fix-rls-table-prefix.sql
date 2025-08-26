-- Fix RLS Policy - Remove table prefix that's causing issues
-- The issue is using notifications.related_id and notifications.user_id in INSERT policy

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

-- Create new INSERT policy without table prefix
CREATE POLICY "notifications_insert" ON public.notifications
FOR INSERT WITH CHECK (
    -- Allow users to create their own notifications
    auth.uid() = user_id
    OR
    -- Allow challenge notifications - NO TABLE PREFIX
    (
        type = 'challenge' 
        AND related_id IS NOT NULL
        AND (
            -- Check if both users are involved in that challenge
            EXISTS (
                SELECT 1 FROM challenges c 
                WHERE c.id::text = related_id::text
                AND (c.challenger_id = auth.uid() OR c.challenged_id = auth.uid())
                AND (c.challenger_id = user_id OR c.challenged_id = user_id)
            )
        )
    )
);

-- Verify the policy was created correctly
SELECT 
    policyname,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
AND cmd = 'INSERT';