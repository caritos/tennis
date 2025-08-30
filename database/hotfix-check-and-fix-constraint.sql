-- HOTFIX: Check current constraint and fix action_type issue
-- This script checks the current constraint and updates it if needed
-- Run this in Supabase SQL Editor

-- First, let's see what the current constraint allows
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = 'notifications'::regclass 
AND conname = 'notifications_action_type_check';

-- Drop the existing constraint to be safe
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_action_type_check;

-- Add the correct constraint with all needed values
ALTER TABLE notifications ADD CONSTRAINT notifications_action_type_check 
CHECK (action_type = ANY (ARRAY[
    'accept_challenge'::text, 
    'decline_challenge'::text, 
    'view_match'::text, 
    'view_ranking'::text, 
    'join_club'::text, 
    'view_club'::text
]));

-- Now drop and recreate the function with the correct action_type
DROP FUNCTION IF EXISTS create_match_invitation(uuid, uuid, text, date, time, text, text);

CREATE OR REPLACE FUNCTION create_match_invitation(
  p_club_id uuid,
  p_creator_id uuid,
  p_match_type text,
  p_date date,
  p_time time DEFAULT NULL,
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
  notification_count integer;
BEGIN
  -- Generate UUID for the invitation
  v_invitation_id := gen_random_uuid();
  
  -- Validate inputs
  IF p_club_id IS NULL OR p_creator_id IS NULL OR p_match_type IS NULL OR p_date IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing required parameters'
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
  
  -- Check if user is a member of the club
  SELECT EXISTS(
    SELECT 1 FROM club_members 
    WHERE club_id = p_club_id AND user_id = p_creator_id
  ) INTO v_user_is_member;
  
  IF NOT v_user_is_member THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not a member of this club'
    );
  END IF;
  
  -- Validate match type
  IF p_match_type NOT IN ('singles', 'doubles') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid match type. Must be singles or doubles'
    );
  END IF;
  
  -- Validate date is not in the past
  IF p_date < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Match date cannot be in the past'
    );
  END IF;
  
  -- Create the match invitation
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
    p_match_type,
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
    'view_match', -- This should now work with the updated constraint
    jsonb_build_object('invitationId', v_invitation_id, 'clubId', p_club_id),
    p_date + INTERVAL '1 day', -- Expire after match date
    now()
  FROM club_members cm
  INNER JOIN users u ON u.id = p_creator_id -- Get creator name for notification
  WHERE cm.club_id = p_club_id 
    AND cm.user_id IN (SELECT id FROM users WHERE id = cm.user_id); -- Ensure user still exists
  
  -- Log notification creation for debugging
  GET DIAGNOSTICS notification_count = ROW_COUNT;
  RAISE LOG 'Created % notifications for match invitation % in club %', notification_count, v_invitation_id, p_club_id;
  
  -- Return success with the created invitation data
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Match invitation created successfully',
    'invitation', row_to_json(v_invitation_record)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE LOG 'Error creating match invitation: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_match_invitation(uuid, uuid, text, date, time, text, text) TO authenticated;

-- Verify the constraint was applied correctly
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = 'notifications'::regclass 
AND conname = 'notifications_action_type_check';