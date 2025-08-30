-- HOTFIX: Remove phone numbers from match confirmation notification messages
-- This updates the notification messages to be more private and clean
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION create_match_invitation_notifications(
    p_invitation_id uuid,
    p_notification_type text, -- 'match_confirmed'
    p_initiator_user_id uuid -- The user who joined the invitation
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record match_invitations%ROWTYPE;
    creator_user_record users%ROWTYPE;
    participant_user_record users%ROWTYPE;
    creator_notification_id uuid;
    participant_notification_id uuid;
BEGIN
    -- Get invitation record
    SELECT * INTO invitation_record FROM match_invitations WHERE id = p_invitation_id;
    IF invitation_record.id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Match invitation not found');
    END IF;
    
    -- Get creator user record
    SELECT * INTO creator_user_record FROM users WHERE id = invitation_record.creator_id;
    
    -- Get participant user record 
    SELECT * INTO participant_user_record FROM users WHERE id = p_initiator_user_id;
    
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
            participant_user_record.full_name || ' joined your ' || invitation_record.match_type || ' match! View match details to see contact info.',
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
            'You joined ' || creator_user_record.full_name || '''s ' || invitation_record.match_type || ' match! View match details to see contact info.',
            p_invitation_id,
            'view_match', 
            json_build_object('invitationId', p_invitation_id),
            NULL,
            NOW()
        RETURNING id INTO participant_notification_id;
        
        RETURN json_build_object(
            'success', true,
            'message', 'Contact sharing notifications created',
            'notifications_created', 2,
            'creator_notification_id', creator_notification_id,
            'participant_notification_id', participant_notification_id
        );
    END IF;
    
    -- If we reach here, notification type is not supported
    RETURN json_build_object('success', false, 'error', 'Unsupported notification type: ' || p_notification_type);
END;
$$;