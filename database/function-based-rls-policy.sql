-- Function-based RLS Policy to avoid table prefix issues
-- Create a helper function that can be called by the policy

-- Create function to check if notification is allowed
CREATE OR REPLACE FUNCTION can_create_notification(
    p_auth_uid uuid,
    p_user_id uuid,
    p_type text,
    p_related_id text
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
            WHERE c.id::text = p_related_id::text
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

-- Create INSERT policy using the function
CREATE POLICY "notifications_insert" ON public.notifications
FOR INSERT WITH CHECK (
    can_create_notification(auth.uid(), user_id, type, related_id)
);

-- Create other basic policies
CREATE POLICY "notifications_select" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON public.notifications  
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON public.notifications
FOR DELETE USING (auth.uid() = user_id);

-- Verify the policy was created
SELECT 
    policyname,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
AND cmd = 'INSERT';