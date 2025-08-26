-- Complete RLS Fix for Notifications Table
-- This fixes all notification policies to allow challenge contact sharing

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