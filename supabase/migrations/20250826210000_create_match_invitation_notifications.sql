-- Create Match Invitation Notification Function
-- Migration: Create PostgreSQL function for match invitation notifications
-- Similar to challenge notifications but for "Looking to Play" system

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_match_invitation_notifications(uuid, text, uuid);

CREATE OR REPLACE FUNCTION create_match_invitation_notifications(
    p_invitation_id uuid,
    p_notification_type text, -- 'match_confirmed'
    p_initiator_user_id uuid  -- The user who triggered this (participant joining)
) RETURNS json AS $$
DECLARE
    invitation_record match_invitations%ROWTYPE;
    creator_notification_id uuid;
    participant_notification_id uuid;
    creator_user_record users%ROWTYPE;
    participant_user_record users%ROWTYPE;
    result json;
BEGIN
    -- Get match invitation details
    SELECT * INTO invitation_record 
    FROM match_invitations 
    WHERE id = p_invitation_id;
    
    -- Validate invitation exists
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Match invitation not found');
    END IF;
    
    -- Get creator details
    SELECT * INTO creator_user_record
    FROM users
    WHERE id = invitation_record.creator_id;
    
    -- Get participant details
    SELECT * INTO participant_user_record
    FROM users
    WHERE id = p_initiator_user_id;
    
    -- Validate both users exist
    IF creator_user_record.id IS NULL OR participant_user_record.id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User details not found');
    END IF;
    
    -- Validate initiator is not the creator (someone else is joining)
    IF p_initiator_user_id = invitation_record.creator_id THEN
        RETURN json_build_object('success', false, 'error', 'Creator cannot join their own invitation');
    END IF;
    
    -- Handle match confirmed - create contact sharing notifications
    IF p_notification_type = 'match_confirmed' THEN
        
        -- Create notification for creator (contact sharing)
        INSERT INTO notifications (
            id, user_id, type, title, message, 
            related_id, action_type, action_data, 
            expires_at, created_at
        ) 
        SELECT 
            gen_random_uuid(),
            invitation_record.creator_id,
            'match_invitation',
            '🎾 Match Confirmed - Contact Info Shared',
            participant_user_record.full_name || ' joined your ' || invitation_record.match_type || ' match! Contact: ' || participant_user_record.full_name || ': ' || COALESCE(participant_user_record.phone, 'no phone number provided'),
            p_invitation_id,
            'view_match',
            json_build_object('invitationId', p_invitation_id),
            NULL, -- No expiration for contact sharing
            NOW()
        RETURNING id INTO creator_notification_id;
        
        -- Create notification for participant (contact sharing) 
        INSERT INTO notifications (
            id, user_id, type, title, message,
            related_id, action_type, action_data,
            expires_at, created_at
        )
        SELECT 
            gen_random_uuid(),
            p_initiator_user_id,
            'match_invitation',
            '🎾 Match Confirmed - Contact Info Shared',
            'You joined ' || creator_user_record.full_name || '''s ' || invitation_record.match_type || ' match! Contact: ' || creator_user_record.full_name || ': ' || COALESCE(creator_user_record.phone, 'no phone number provided'),
            p_invitation_id,
            'view_match', 
            json_build_object('invitationId', p_invitation_id),
            NULL,
            NOW()
        RETURNING id INTO participant_notification_id;
        
        RETURN json_build_object(
            'success', true,
            'notifications_created', 2,
            'creator_notification_id', creator_notification_id,
            'participant_notification_id', participant_notification_id
        );
        
    ELSE
        RETURN json_build_object('success', false, 'error', 'Unsupported notification type');
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Database error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_match_invitation_notifications(uuid, text, uuid) TO authenticated;