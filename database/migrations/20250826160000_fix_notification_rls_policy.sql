-- Fix Notification RLS Policy for Challenge Contact Sharing
-- This fixes the issue where users cannot create notifications for other users during challenge acceptance

-- Drop existing insert policy for notifications
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;

-- Create a new insert policy that allows:
-- 1. Users to create their own notifications
-- 2. Users to create notifications for challenge participants when accepting/creating challenges
CREATE POLICY "Users can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    -- User can create their own notifications
    auth.uid() = user_id
    OR
    -- User can create notifications for challenge participants (contact sharing)
    -- This allows the challenged user to notify the challenger when accepting
    (
      type = 'challenge' AND
      related_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.challenges c
        WHERE c.id = related_id::uuid
        AND (
          -- Challenger can notify challenged
          (c.challenger_id = auth.uid() AND c.challenged_id = user_id) OR
          -- Challenged can notify challenger (when accepting)
          (c.challenged_id = auth.uid() AND c.challenger_id = user_id)
        )
      )
    )
  );

