-- ============================================================================
-- RECORD COMPLETE MATCH FUNCTION
-- Replaces complex client-side match recording with single database function
-- Run this in your Supabase SQL Editor
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
  club_id UUID;
  player1_id UUID;
  notification_result JSON;
  elo_update_result JSON;
BEGIN
  -- Extract data from JSON parameter
  SELECT 
    (p_match_data->>'club_id')::UUID,
    (p_match_data->>'player1_id')::UUID,
    p_match_data->>'scores'
  INTO club_id, player1_id, match_scores;
  
  -- Validate user has permission to record match in this club
  IF NOT EXISTS (
    SELECT 1 FROM club_members 
    WHERE club_members.club_id = (p_match_data->>'club_id')::UUID 
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
      player1_id
    ) INTO notification_result;
  END IF;
  
  -- Update club activity timestamp (triggers club realtime event)
  UPDATE clubs 
  SET last_activity = NOW()
  WHERE clubs.id = club_id;
  
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
-- HELPER: Enhanced determine_winner function 
-- (improves on existing logic for better tennis scoring)
-- ============================================================================

CREATE OR REPLACE FUNCTION determine_winner(scores TEXT)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  sets TEXT[];
  player1_sets INTEGER := 0;
  player2_sets INTEGER := 0;
  set_score TEXT;
  set_parts TEXT[];
  player1_games INTEGER;
  player2_games INTEGER;
BEGIN
  -- Handle empty or null scores
  IF scores IS NULL OR scores = '' THEN
    RETURN NULL;
  END IF;
  
  -- Split scores by comma to get individual sets
  sets := string_to_array(scores, ',');
  
  -- Count sets won by each player
  FOREACH set_score IN ARRAY sets LOOP
    -- Clean up the set score and split by dash
    set_score := trim(set_score);
    set_parts := string_to_array(set_score, '-');
    
    -- Extract games won by each player
    IF array_length(set_parts, 1) >= 2 THEN
      -- Handle tiebreak notation like "6-4" or "7-6(3)"
      player1_games := (regexp_replace(set_parts[1], '[^0-9]', '', 'g'))::INTEGER;
      player2_games := (regexp_replace(set_parts[2], '[^0-9]', '', 'g'))::INTEGER;
      
      -- Determine set winner
      IF player1_games > player2_games THEN
        player1_sets := player1_sets + 1;
      ELSE
        player2_sets := player2_sets + 1;
      END IF;
    END IF;
  END LOOP;
  
  -- Return overall match winner (1 = player1, 2 = player2)
  IF player1_sets > player2_sets THEN
    RETURN 1;
  ELSIF player2_sets > player1_sets THEN
    RETURN 2;
  ELSE
    RETURN NULL; -- Tie or indeterminate
  END IF;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION record_complete_match(JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION determine_winner(TEXT) TO authenticated;

-- ============================================================================
-- USAGE EXAMPLE
-- ============================================================================

/*
-- Client code becomes this simple:
const { data } = await supabase.rpc('record_complete_match', {
  p_match_data: {
    club_id: '123e4567-e89b-12d3-a456-426614174000',
    player1_id: '123e4567-e89b-12d3-a456-426614174001',
    player2_id: null,
    opponent2_name: 'John Doe',
    scores: '6-4,6-2',
    match_type: 'singles',
    date: '2023-12-01',
    notes: 'Great match!',
    invitation_id: null,
    challenge_id: null
  }
});

// Response:
{
  "success": true,
  "match_id": "new-uuid-here",
  "ratings_updated": true,
  "notifications_created": 2,
  "elo_updates": { ... }
}
*/