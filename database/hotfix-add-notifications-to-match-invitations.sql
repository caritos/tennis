-- HOTFIX: Add notification creation to match invitation function
-- This fixes the issue where creating match invitations doesn't notify club members
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION create_match_invitation(
  p_club_id uuid,
  p_creator_id uuid,
  p_match_type text,
  p_date date,
  p_time text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_notes text DEFAULT NULL
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
    created_at
  ) VALUES (
    v_invitation_id,
    p_club_id,
    p_creator_id,
    p_match_type::match_type_enum,
    p_date,
    p_time,
    p_location,
    p_notes,
    'active',
    now()
  ) RETURNING * INTO v_invitation_record;
  
  -- Log the creation for debugging
  RAISE LOG 'Match invitation created: % by user % in club %', v_invitation_id, p_creator_id, p_club_id;
  
  -- Create notifications for all club members including the creator
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
    'match_invitation',
    '🎾 New ' || INITCAP(p_match_type) || ' Match Available',
    u.full_name || ' is looking to play ' || p_match_type || ' on ' || p_date || 
    CASE WHEN p_time IS NOT NULL THEN ' at ' || p_time ELSE '' END ||
    CASE WHEN p_location IS NOT NULL THEN ' at ' || p_location ELSE '' END,
    v_invitation_id,
    'join_match',
    jsonb_build_object('invitationId', v_invitation_id, 'clubId', p_club_id),
    p_date + INTERVAL '1 day', -- Expire after match date
    now()
  FROM club_members cm
  INNER JOIN users u ON u.id = p_creator_id -- Get creator name for notification
  WHERE cm.club_id = p_club_id 
    AND cm.user_id IN (SELECT id FROM users WHERE id = cm.user_id); -- Ensure user still exists
  
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
GRANT EXECUTE ON FUNCTION create_match_invitation TO authenticated;