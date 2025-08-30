-- Fix time type conversion in create_match_invitation function

CREATE OR REPLACE FUNCTION create_match_invitation(
  p_club_id uuid,
  p_creator_id uuid,
  p_match_type text,
  p_date date,
  p_time text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_targeted_players uuid[] DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
LANGUAGE plpgsql
AS $$
DECLARE
  v_invitation_id uuid;
  v_invitation_record match_invitations%ROWTYPE;
  v_club_exists boolean := false;
  v_user_is_member boolean := false;
  notification_count integer;
  v_time_value time := NULL;
BEGIN
  -- Generate UUID for the invitation
  v_invitation_id := gen_random_uuid();
  
  -- Validate inputs
  IF p_club_id IS NULL OR p_creator_id IS NULL OR p_match_type IS NULL OR p_date IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing required parameters: club_id, creator_id, match_type, and date are required'
    );
  END IF;
  
  -- Validate match type
  IF p_match_type NOT IN ('singles', 'doubles') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid match_type. Must be either singles or doubles'
    );
  END IF;
  
  -- Convert text time to TIME type if provided
  IF p_time IS NOT NULL AND p_time != '' THEN
    BEGIN
      v_time_value := p_time::time;
    EXCEPTION
      WHEN OTHERS THEN
        -- If time conversion fails, set to NULL
        v_time_value := NULL;
        RAISE LOG 'Warning: Could not convert time value "%" to TIME type', p_time;
    END;
  END IF;
  
  -- Check if club exists
  SELECT EXISTS(SELECT 1 FROM clubs WHERE id = p_club_id) INTO v_club_exists;
  IF NOT v_club_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Club not found'
    );
  END IF;
  
  -- Check if user exists and is a member of the club
  SELECT EXISTS(
    SELECT 1 FROM club_members cm 
    INNER JOIN users u ON cm.user_id = u.id 
    WHERE cm.club_id = p_club_id AND cm.user_id = p_creator_id
  ) INTO v_user_is_member;
  
  IF NOT v_user_is_member THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You must be a member of this club to create match invitations'
    );
  END IF;
  
  -- Insert the match invitation (bypassing RLS due to SECURITY DEFINER)
  INSERT INTO match_invitations (
    id,
    club_id,
    creator_id,
    match_type,
    date,
    time,
    location,
    notes,
    status,
    targeted_players,
    created_at
  ) VALUES (
    v_invitation_id,
    p_club_id,
    p_creator_id,
    p_match_type,
    p_date,
    v_time_value, -- Use converted TIME value
    p_location,
    p_notes,
    'active',
    p_targeted_players,
    now()
  ) RETURNING * INTO v_invitation_record;
  
  -- Log the creation for debugging
  RAISE LOG 'Match invitation created: % by user % in club % with targeted players: %', v_invitation_id, p_creator_id, p_club_id, p_targeted_players;
  
  -- Create notifications for appropriate recipients based on invitation type
  INSERT INTO notifications (
    id,
    user_id,
    type,
    title,
    message,
    related_id,
    action_type,
    action_data,
    expires_at,
    created_at
  )
  SELECT 
    gen_random_uuid(),
    cm.user_id,
    CASE 
      WHEN p_targeted_players IS NOT NULL THEN 'match_challenge'
      ELSE 'match_invitation'
    END,
    CASE 
      WHEN p_targeted_players IS NOT NULL THEN '⚔️ New ' || INITCAP(p_match_type) || ' Challenge'
      ELSE '🎾 New ' || INITCAP(p_match_type) || ' Match Available'
    END,
    u.full_name || 
    CASE 
      WHEN p_targeted_players IS NOT NULL THEN ' challenged you to ' || p_match_type || ' on ' || p_date
      ELSE ' is looking to play ' || p_match_type || ' on ' || p_date
    END ||
    CASE WHEN p_time IS NOT NULL AND p_time != '' THEN ' at ' || p_time ELSE '' END ||
    CASE WHEN p_location IS NOT NULL THEN ' at ' || p_location ELSE '' END,
    v_invitation_id,
    'view_match', -- Use valid action_type value
    jsonb_build_object('invitationId', v_invitation_id, 'clubId', p_club_id),
    p_date + INTERVAL '1 day', -- Expire after match date
    now()
  FROM club_members cm
  INNER JOIN users u ON u.id = p_creator_id -- Get creator name for notification
  WHERE cm.club_id = p_club_id 
    AND cm.user_id IN (SELECT id FROM users WHERE id = cm.user_id) -- Ensure user still exists
    AND (
      p_targeted_players IS NULL OR -- For open invitations, notify all members
      cm.user_id = ANY(p_targeted_players) OR -- For targeted invitations, notify targeted players
      cm.user_id = p_creator_id -- Always notify the creator
    );
  
  -- Log notification creation for debugging
  GET DIAGNOSTICS notification_count = ROW_COUNT;
  RAISE LOG 'Created % notifications for match invitation % in club %', notification_count, v_invitation_id, p_club_id;
  
  -- If no notifications were created, that's a problem
  IF notification_count = 0 THEN
    RAISE LOG 'WARNING: No notifications were created for match invitation % in club %', v_invitation_id, p_club_id;
  END IF;
  
  -- Return success with the created invitation data
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Match invitation created successfully',
    'invitation', row_to_json(v_invitation_record)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE LOG 'Error creating match invitation: % %', SQLSTATE, SQLERRM;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Database error: %s', SQLERRM),
      'sqlstate', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_match_invitation(uuid, uuid, text, date, text, text, text, uuid[]) TO authenticated;