-- Force Fix RLS Policies for Notifications
-- This completely rebuilds the notification policies

-- First, check what policies exist
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public';

-- Drop ALL policies on notifications table
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

-- Create a single, comprehensive INSERT policy
CREATE POLICY "allow_notification_inserts" ON public.notifications
FOR INSERT WITH CHECK (
    -- Always allow users to create their own notifications
    auth.uid() = user_id
    OR
    -- Allow creating notifications for challenge participants
    (
        type = 'challenge' AND
        related_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = related_id::uuid
            AND (
                (c.challenger_id = auth.uid() AND c.challenged_id = user_id) OR
                (c.challenged_id = auth.uid() AND c.challenger_id = user_id)
            )
        )
    )
);

-- Create SELECT policy
CREATE POLICY "allow_notification_select" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

-- Create UPDATE policy  
CREATE POLICY "allow_notification_update" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Create DELETE policy
CREATE POLICY "allow_notification_delete" ON public.notifications
FOR DELETE USING (auth.uid() = user_id);

-- Verify the policies are created
SELECT 
    policyname,
    cmd,
    CASE cmd
        WHEN 'INSERT' THEN 'Allows own + challenge cross-user notifications'
        WHEN 'SELECT' THEN 'View own only'
        WHEN 'UPDATE' THEN 'Update own only'
        WHEN 'DELETE' THEN 'Delete own only'
    END as description
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
ORDER BY cmd;