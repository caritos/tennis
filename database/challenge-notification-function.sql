-- Challenge Notification Function - Bypasses RLS completely
-- This function runs with SECURITY DEFINER (elevated privileges) 
-- and handles all challenge notification creation logic

-- Create function to handle challenge notifications
CREATE OR REPLACE FUNCTION create_challenge_notifications(
    p_challenge_id uuid,
    p_notification_type text, -- 'challenge_created', 'challenge_accepted', etc.
    p_initiator_user_id uuid  -- The user who triggered this (challenger or accepter)
) RETURNS json AS $$
DECLARE
    challenge_record challenges%ROWTYPE;
    challenger_notification_id uuid;
    challenged_notification_id uuid;
    result json;
BEGIN
    -- Get challenge details
    SELECT * INTO challenge_record 
    FROM challenges 
    WHERE id = p_challenge_id;
    
    -- Validate challenge exists
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Challenge not found');
    END IF;
    
    -- Validate initiator is involved in the challenge
    IF p_initiator_user_id != challenge_record.challenger_id 
       AND p_initiator_user_id != challenge_record.challenged_id THEN
        RETURN json_build_object('success', false, 'error', 'User not involved in challenge');
    END IF;
    
    -- Handle different notification types
    IF p_notification_type = 'challenge_accepted' THEN
        
        -- Create notification for challenger (contact sharing)
        INSERT INTO notifications (
            id, user_id, type, title, message, 
            related_id, action_type, action_data, 
            expires_at, created_at, updated_at
        ) 
        SELECT 
            gen_random_uuid(),
            challenge_record.challenger_id,
            'challenge',
            '🎾 Challenge Accepted - Contact Info Shared',
            CASE 
                WHEN challenge_record.challenger_id = p_initiator_user_id 
                THEN 'You accepted ' || (SELECT full_name FROM users WHERE id = challenge_record.challenged_id) || '''s ' || challenge_record.match_type || ' challenge! Contact: ' || (SELECT full_name FROM users WHERE id = challenge_record.challenged_id) || ': ' || (SELECT phone FROM users WHERE id = challenge_record.challenged_id)
                ELSE (SELECT full_name FROM users WHERE id = challenge_record.challenged_id) || ' accepted your ' || challenge_record.match_type || ' challenge! Contact: ' || (SELECT full_name FROM users WHERE id = challenge_record.challenged_id) || ': ' || (SELECT phone FROM users WHERE id = challenge_record.challenged_id)
            END,
            p_challenge_id,
            'view_match',
            json_build_object('challengeId', p_challenge_id),
            NULL, -- No expiration for contact sharing
            NOW(),
            NOW()
        RETURNING id INTO challenger_notification_id;
        
        -- Create notification for challenged user (contact sharing) 
        INSERT INTO notifications (
            id, user_id, type, title, message,
            related_id, action_type, action_data,
            expires_at, created_at, updated_at
        )
        SELECT 
            gen_random_uuid(),
            challenge_record.challenged_id,
            'challenge', 
            '🎾 Challenge Accepted - Contact Info Shared',
            CASE 
                WHEN challenge_record.challenged_id = p_initiator_user_id
                THEN 'You accepted ' || (SELECT full_name FROM users WHERE id = challenge_record.challenger_id) || '''s ' || challenge_record.match_type || ' challenge! Contact: ' || (SELECT full_name FROM users WHERE id = challenge_record.challenger_id) || ': ' || (SELECT phone FROM users WHERE id = challenge_record.challenger_id)
                ELSE (SELECT full_name FROM users WHERE id = challenge_record.challenger_id) || ' accepted your ' || challenge_record.match_type || ' challenge! Contact: ' || (SELECT full_name FROM users WHERE id = challenge_record.challenger_id) || ': ' || (SELECT phone FROM users WHERE id = challenge_record.challenger_id)
            END,
            p_challenge_id,
            'view_match', 
            json_build_object('challengeId', p_challenge_id),
            NULL,
            NOW(),
            NOW()
        RETURNING id INTO challenged_notification_id;
        
        RETURN json_build_object(
            'success', true,
            'notifications_created', 2,
            'challenger_notification_id', challenger_notification_id,
            'challenged_notification_id', challenged_notification_id
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
GRANT EXECUTE ON FUNCTION create_challenge_notifications(uuid, text, uuid) TO authenticated;

-- Test the function with a real challenge
SELECT create_challenge_notifications(
    '045ea7a3-a77e-4b1a-8ed9-6dd110baf8d3'::uuid,
    'challenge_accepted',
    '1c4f895b-88fb-485f-ad09-506e5677e536'::uuid  -- Nina accepting
) as test_result;