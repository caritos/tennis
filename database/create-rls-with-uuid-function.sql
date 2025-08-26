-- Create RLS policy using the UUID function (since related_id is uuid type)

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

-- Create INSERT policy using the UUID function
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

-- Test the function with actual challenge data
SELECT can_create_notification(
    '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid,  -- Nina (auth_uid)
    '26008694-f9db-4a14-9b28-e089fac97440'::uuid,  -- Eladio (user_id) 
    'challenge'::text,                               -- type
    '8d78e3ba-f4f7-4147-afc9-af0032b3f027'::uuid    -- related_id as UUID
) as should_allow_notification;

-- Verify the policy was created
SELECT 
    policyname,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
AND cmd = 'INSERT';

-- Check RLS status
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'notifications' 
AND schemaname = 'public';