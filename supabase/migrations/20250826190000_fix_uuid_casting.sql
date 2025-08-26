-- Fix UUID casting in notification RLS policies
-- The issue: c.id (UUID) was being compared to related_id (TEXT) without casting

-- Drop the existing INSERT policy with the casting issue
DROP POLICY IF EXISTS "allow_notification_inserts" ON public.notifications;

-- Recreate with proper UUID casting (cast both to text for comparison)
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
            WHERE c.id::text = notifications.related_id::text
            AND (
                (c.challenger_id = auth.uid() AND c.challenged_id = user_id) OR
                (c.challenged_id = auth.uid() AND c.challenger_id = user_id)
            )
        )
    )
);