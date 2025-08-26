-- Complete RLS Fix for Notifications Table
-- Run this in Supabase Dashboard: https://supabase.com/dashboard/project/dgkdbqloehxruoijylzw/sql/new

-- First, check existing policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications' AND schemaname = 'public';

-- Drop ALL existing notification policies to start fresh
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Create comprehensive INSERT policy for notifications
CREATE POLICY "notification_insert_policy" ON public.notifications
  FOR INSERT WITH CHECK (
    -- Case 1: User creates their own notifications
    auth.uid() = user_id
    OR
    -- Case 2: System/Challenge notifications - allow cross-user notifications for challenges
    (
      type = 'challenge' AND
      related_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.challenges c
        WHERE c.id = related_id::uuid
        AND (
          -- Challenger notifying challenged
          (c.challenger_id = auth.uid() AND c.challenged_id = user_id) OR
          -- Challenged notifying challenger (when accepting)
          (c.challenged_id = auth.uid() AND c.challenger_id = user_id)
        )
      )
    )
  );

-- Create SELECT policy - users can only see their own notifications
CREATE POLICY "notification_select_policy" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Create UPDATE policy - users can update their own notifications (mark as read)
CREATE POLICY "notification_update_policy" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create DELETE policy - users can delete their own notifications
CREATE POLICY "notification_delete_policy" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname = 'notification_insert_policy' THEN 'Allows own + challenge notifications'
    WHEN policyname = 'notification_select_policy' THEN 'View own notifications only'
    WHEN policyname = 'notification_update_policy' THEN 'Update own notifications only'
    WHEN policyname = 'notification_delete_policy' THEN 'Delete own notifications only'
  END as description
FROM pg_policies 
WHERE tablename = 'notifications' AND schemaname = 'public'
ORDER BY policyname;

-- Test the policy with actual challenge IDs from logs
-- This should return TRUE if the policy is working
SELECT 
  'Test: Nina can notify Eladio' as test_case,
  EXISTS (
    SELECT 1 FROM public.challenges 
    WHERE id IN ('0a01ff63-637d-4a46-9bbb-95fc11b0ce50', 'c2eb8f21-15eb-445c-97e1-9fc1526df8cd')
    LIMIT 1
  ) as has_test_challenges;