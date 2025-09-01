-- ============================================================================
-- RECORD COMPLETE MATCH FUNCTION - WORKING VERSION
-- Fixed to match actual database schema (no last_activity column)
-- ============================================================================

CREATE OR REPLACE FUNCTION record_complete_match(p_match_data JSON)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  new_match_id UUID;
  match_club_id UUID;
BEGIN
  -- Extract club ID for validation
  SELECT (p_match_data->>'club_id')::UUID INTO match_club_id;
  
  -- Validate user has permission to record match in this club
  IF NOT EXISTS (
    SELECT 1 FROM club_members 
    WHERE club_members.club_id = match_club_id 
    AND club_members.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User not authorized to record matches in this club';
  END IF;
  
  -- Generate UUID for new match
  new_match_id := gen_random_uuid();
  
  -- Insert match (this triggers realtime event automatically)
  INSERT INTO matches (
    id,
    club_id, 
    player1_id, 
    player2_id, 
    player3_id, 
    player4_id,
    scores, 
    match_type, 
    date, 
    opponent2_name, 
    partner3_name, 
    partner4_name,
    notes, 
    invitation_id, 
    challenge_id,
    created_at
  )
  VALUES (
    new_match_id,
    (p_match_data->>'club_id')::UUID,
    (p_match_data->>'player1_id')::UUID,
    (p_match_data->>'player2_id')::UUID,
    (p_match_data->>'player3_id')::UUID,
    (p_match_data->>'player4_id')::UUID,
    p_match_data->>'scores',
    p_match_data->>'match_type',
    (p_match_data->>'date')::DATE,
    p_match_data->>'opponent2_name',
    p_match_data->>'partner3_name',
    p_match_data->>'partner4_name',
    p_match_data->>'notes',
    (p_match_data->>'invitation_id')::UUID,
    (p_match_data->>'challenge_id')::UUID,
    NOW()
  );
  
  -- Skip club update since last_activity column doesn't exist
  -- Club activity can be tracked via match creation timestamp
  
  -- Return success with match ID
  RETURN json_build_object(
    'success', true,
    'match_id', new_match_id,
    'message', 'Match created successfully'
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION record_complete_match(JSON) TO authenticated;