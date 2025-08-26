-- Create Working RLS Policy for Notifications
-- Based on the fact that disabling RLS fixed the issue

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

-- Create a working INSERT policy with simplified logic
CREATE POLICY "notifications_insert" ON public.notifications
FOR INSERT WITH CHECK (
    -- Allow users to create their own notifications
    auth.uid() = user_id
    OR
    -- Allow challenge notifications (simplified condition)
    (
        type = 'challenge' 
        AND related_id IS NOT NULL
        AND (
            -- If it's a challenge notification, check if user is involved in that challenge
            EXISTS (
                SELECT 1 FROM challenges c 
                WHERE c.id::text = related_id 
                AND (c.challenger_id = auth.uid() OR c.challenged_id = auth.uid())
                AND (c.challenger_id = user_id OR c.challenged_id = user_id)
            )
        )
    )
);

-- Create other policies
CREATE POLICY "notifications_select" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON public.notifications  
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON public.notifications
FOR DELETE USING (auth.uid() = user_id);

-- Verify RLS is enabled and policies exist
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'notifications' 
AND schemaname = 'public';

SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
ORDER BY cmd, policyname;