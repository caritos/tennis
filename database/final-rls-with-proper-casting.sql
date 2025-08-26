-- Final RLS Policy with PROPER UUID Casting
-- Fix the text = uuid operator error

-- Re-enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
    END LOOP;
END $$;

-- Create INSERT policy with explicit casting to avoid type mismatch
CREATE POLICY "notifications_insert" ON public.notifications
FOR INSERT WITH CHECK (
    -- Users can always create notifications for themselves
    auth.uid() = user_id
    OR
    -- For challenge notifications, check if both users are in the challenge
    (
        type = 'challenge' 
        AND related_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM challenges c 
            WHERE c.id::text = related_id::text  -- Both sides cast to text
            AND (
                -- Both users must be involved in this challenge
                (c.challenger_id = auth.uid() OR c.challenged_id = auth.uid())
                AND 
                (c.challenger_id = user_id OR c.challenged_id = user_id)
            )
        )
    )
);

-- Create other basic policies
CREATE POLICY "notifications_select" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON public.notifications  
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON public.notifications
FOR DELETE USING (auth.uid() = user_id);

-- Verify the policy was created without the table prefix issue
SELECT 
    policyname,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
AND cmd = 'INSERT';