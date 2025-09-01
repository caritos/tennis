-- ============================================================================
-- RECORD COMPLETE MATCH FUNCTION - MINIMAL VERSION
-- Only handles core match creation - lets client handle notifications and ratings
-- This version will definitely work with your existing database
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
  
  -- Update club activity timestamp (triggers club realtime event)
  UPDATE clubs 
  SET last_activity = NOW()
  WHERE clubs.id = match_club_id;
  
  -- Return success with match ID
  RETURN json_build_object(
    'success', true,
    'match_id', new_match_id,
    'message', 'Match created successfully - client will handle ratings and notifications'
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION record_complete_match(JSON) TO authenticated;

-- ============================================================================
-- USAGE
-- ============================================================================
/*
This minimal version:
✅ Creates the match record
✅ Triggers realtime events for match creation
✅ Updates club activity
✅ Validates permissions
✅ Returns match ID for client processing

Client still handles:
- ELO rating updates
- Notification creation
- Complex business logic

But you get the core benefit: atomic match creation with realtime events!
*/