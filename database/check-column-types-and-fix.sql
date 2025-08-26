-- Check the actual column types in notifications table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what type related_id actually is by looking at some data
SELECT 
    related_id,
    pg_typeof(related_id) as related_id_type,
    type,
    user_id,
    pg_typeof(user_id) as user_id_type
FROM notifications 
WHERE type = 'challenge'
LIMIT 3;

-- Create overloaded functions for both text and uuid types
-- Drop any existing functions
DROP FUNCTION IF EXISTS can_create_notification(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS can_create_notification(uuid, uuid, text, uuid);

-- Function for text related_id
CREATE OR REPLACE FUNCTION can_create_notification(
    p_auth_uid uuid,
    p_user_id uuid,
    p_type text,
    p_related_id text
) RETURNS boolean AS $$
BEGIN
    IF p_auth_uid = p_user_id THEN
        RETURN true;
    END IF;
    
    IF p_type = 'challenge' AND p_related_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM challenges c 
            WHERE c.id::text = p_related_id
            AND (
                (c.challenger_id = p_auth_uid OR c.challenged_id = p_auth_uid)
                AND 
                (c.challenger_id = p_user_id OR c.challenged_id = p_user_id)
            )
        );
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for uuid related_id (if that's what it actually is)
CREATE OR REPLACE FUNCTION can_create_notification(
    p_auth_uid uuid,
    p_user_id uuid,
    p_type text,
    p_related_id uuid
) RETURNS boolean AS $$
BEGIN
    IF p_auth_uid = p_user_id THEN
        RETURN true;
    END IF;
    
    IF p_type = 'challenge' AND p_related_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM challenges c 
            WHERE c.id = p_related_id
            AND (
                (c.challenger_id = p_auth_uid OR c.challenged_id = p_auth_uid)
                AND 
                (c.challenger_id = p_user_id OR c.challenged_id = p_user_id)
            )
        );
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;