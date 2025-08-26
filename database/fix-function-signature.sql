-- Fix function signature - related_id is text, not uuid
-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS can_create_notification(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS can_create_notification(uuid, uuid, text, uuid);

-- Create function with correct signature - related_id is TEXT
CREATE OR REPLACE FUNCTION can_create_notification(
    p_auth_uid uuid,
    p_user_id uuid,
    p_type text,
    p_related_id text  -- This should be text, not uuid
) RETURNS boolean AS $$
BEGIN
    -- Always allow users to create notifications for themselves
    IF p_auth_uid = p_user_id THEN
        RETURN true;
    END IF;
    
    -- For challenge notifications, check if both users are in the challenge
    IF p_type = 'challenge' AND p_related_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM challenges c 
            WHERE c.id::text = p_related_id  -- No need to cast p_related_id since it's already text
            AND (
                -- Both users must be involved in this challenge
                (c.challenger_id = p_auth_uid OR c.challenged_id = p_auth_uid)
                AND 
                (c.challenger_id = p_user_id OR c.challenged_id = p_user_id)
            )
        );
    END IF;
    
    -- Default deny
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function with actual data
SELECT can_create_notification(
    '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid,  -- Nina (auth_uid)
    '26008694-f9db-4a14-9b28-e089fac97440'::uuid,  -- Eladio (user_id) 
    'challenge'::text,                               -- type
    '8d78e3ba-f4f7-4147-afc9-af0032b3f027'::text    -- related_id
) as should_allow_notification;

-- Re-create the policy using the corrected function
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

CREATE POLICY "notifications_insert" ON public.notifications
FOR INSERT WITH CHECK (
    can_create_notification(auth.uid(), user_id, type, related_id)
);

-- Verify the policy
SELECT 
    policyname,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
AND cmd = 'INSERT';