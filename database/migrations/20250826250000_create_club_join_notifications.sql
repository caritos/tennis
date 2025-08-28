-- Create Club Join Notification Function
-- Migration: Create PostgreSQL function for club join notifications

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_club_join_notifications(uuid, uuid);

CREATE OR REPLACE FUNCTION create_club_join_notifications(
    p_club_id uuid,
    p_new_member_id uuid
) RETURNS json AS $$
DECLARE
    club_record clubs%ROWTYPE;
    new_member_record users%ROWTYPE;
    existing_member_record RECORD;
    notification_count integer DEFAULT 0;
    max_member_notifications integer DEFAULT 10; -- Limit notifications to avoid spam
BEGIN
    -- Get club details
    SELECT * INTO club_record 
    FROM clubs 
    WHERE id = p_club_id;
    
    -- Validate club exists
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Club not found');
    END IF;
    
    -- Get new member details
    SELECT * INTO new_member_record
    FROM users
    WHERE id = p_new_member_id;
    
    -- Validate new member exists
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'New member not found');
    END IF;
    
    -- Create welcome notification for new member
    INSERT INTO notifications (
        id, user_id, type, title, message, 
        related_id, action_type, action_data, 
        expires_at, created_at
    ) 
    SELECT 
        gen_random_uuid(),
        p_new_member_id,
        'club_activity',
        '🎾 Welcome to ' || club_record.name || '!',
        'You''ve successfully joined "' || club_record.name || '" in ' || club_record.location || '. Start exploring matches, challenges, and connect with other tennis players!',
        p_club_id,
        'view_club',
        json_build_object('clubId', p_club_id, 'isWelcome', true),
        NOW() + INTERVAL '30 days',
        NOW();
        
    notification_count := notification_count + 1;
    
    -- Create notifications for existing club members (excluding new member and creator gets different message)
    FOR existing_member_record IN
        SELECT 
            u.id as user_id,
            u.full_name,
            cm.joined_at,
            CASE WHEN u.id = club_record.creator_id THEN true ELSE false END as is_creator
        FROM club_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.club_id = p_club_id 
        AND u.id != p_new_member_id -- Don't notify the new member
        ORDER BY cm.joined_at ASC -- Older members first
        LIMIT max_member_notifications -- Limit to avoid spam
    LOOP
        -- Create notification for existing member
        INSERT INTO notifications (
            id, user_id, type, title, message, 
            related_id, action_type, action_data, 
            expires_at, created_at
        ) 
        SELECT 
            gen_random_uuid(),
            existing_member_record.user_id,
            'club_activity',
            CASE 
                WHEN existing_member_record.is_creator THEN '👋 New Member Joined Your Club!'
                ELSE '👋 New Member Joined ' || club_record.name
            END,
            CASE 
                WHEN existing_member_record.is_creator THEN 
                    new_member_record.full_name || ' just joined "' || club_record.name || '"! Welcome them and help them get started.'
                ELSE 
                    new_member_record.full_name || ' just joined "' || club_record.name || '"! Say hello and maybe challenge them to a match.'
            END,
            p_club_id,
            'view_club',
            json_build_object('clubId', p_club_id, 'newMemberId', p_new_member_id, 'newMemberName', new_member_record.full_name),
            NOW() + INTERVAL '7 days', -- Shorter expiry for member join notifications
            NOW();
            
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'notifications_created', notification_count,
        'club_name', club_record.name,
        'new_member_name', new_member_record.full_name,
        'existing_members_notified', notification_count - 1 -- Subtract the welcome notification
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Database error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_club_join_notifications(uuid, uuid) TO authenticated;