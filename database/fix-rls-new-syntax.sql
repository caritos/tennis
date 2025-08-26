-- Fix RLS Policy using NEW syntax for INSERT operations
-- The issue is PostgreSQL RLS policies need to use NEW for INSERT operations

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

-- Create new INSERT policy using proper INSERT syntax
-- For INSERT policies, we need to reference the values being inserted
CREATE POLICY "notifications_insert" ON public.notifications
FOR INSERT WITH CHECK (
    -- Allow users to create their own notifications
    auth.uid() = NEW.user_id
    OR
    -- Allow challenge notifications
    (
        NEW.type = 'challenge' 
        AND NEW.related_id IS NOT NULL
        AND (
            -- Check if both users are involved in that challenge
            EXISTS (
                SELECT 1 FROM challenges c 
                WHERE c.id::text = NEW.related_id::text
                AND (c.challenger_id = auth.uid() OR c.challenged_id = auth.uid())
                AND (c.challenger_id = NEW.user_id OR c.challenged_id = NEW.user_id)
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