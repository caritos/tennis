-- Final Working RLS Policy
-- Based on successful data from challenge 8d78e3ba-f4f7-4147-afc9-af0032b3f027

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

-- Create very simple INSERT policy - just check if users are in the same challenge
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
            WHERE c.id::text = related_id
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