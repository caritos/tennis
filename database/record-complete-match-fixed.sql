-- ============================================================================
-- RECORD COMPLETE MATCH FUNCTION - FIXED VERSION
-- Fixes ambiguous column references that were causing errors
-- Run this in your Supabase SQL Editor to replace the previous version
-- ============================================================================

CREATE OR REPLACE FUNCTION record_complete_match(p_match_data JSON)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  new_match_id UUID;
  match_scores TEXT;
  winner_side INTEGER;
  match_club_id UUID;
  match_player1_id UUID;
  notification_result JSON;
  elo_update_result JSON;
BEGIN
  -- Extract data from JSON parameter (use different variable names to avoid conflicts)
  SELECT 
    (p_match_data->>'club_id')::UUID,
    (p_match_data->>'player1_id')::UUID,
    p_match_data->>'scores'
  INTO match_club_id, match_player1_id, match_scores;
  
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
  
  -- Update player ratings if scores provided and match has players
  IF match_scores IS NOT NULL AND match_scores != '' AND (
    (p_match_data->>'player2_id') IS NOT NULL OR 
    (p_match_data->>'opponent2_name') IS NOT NULL
  ) THEN
    -- Use existing update_player_ratings function
    SELECT update_player_ratings(new_match_id) INTO elo_update_result;
    
    -- Determine winner for notifications
    SELECT determine_winner(match_scores) INTO winner_side;
    
    -- Create notifications (this also triggers realtime events)
    SELECT create_match_result_notifications(
      new_match_id, 
      winner_side, 
      match_player1_id
    ) INTO notification_result;
  END IF;
  
  -- Update club activity timestamp (triggers club realtime event)
  UPDATE clubs 
  SET last_activity = NOW()
  WHERE clubs.id = match_club_id;
  
  RETURN json_build_object(
    'success', true,
    'match_id', new_match_id,
    'ratings_updated', match_scores IS NOT NULL AND match_scores != '',
    'notifications_created', COALESCE(notification_result->>'notifications_created', '0')::INTEGER,
    'elo_updates', elo_update_result
  );
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION record_complete_match(JSON) TO authenticated;

-- ============================================================================
-- TEST QUERY
-- ============================================================================

/*
-- Test the function:
SELECT record_complete_match('{
  "club_id": "your-club-id-here",
  "player1_id": "your-player-id-here", 
  "scores": "6-4,6-2",
  "match_type": "singles",
  "date": "2024-01-01",
  "opponent2_name": "Test Player"
}'::JSON);
*/