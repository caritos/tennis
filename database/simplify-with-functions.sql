-- ============================================================================
-- SIMPLIFY APP WITH POSTGRESQL FUNCTIONS + REALTIME
-- Shows how to move complex client logic to database functions
-- while keeping RLS security and realtime updates
-- ============================================================================

-- EXAMPLE 1: Complete Match Recording Function
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
    WHERE club_id = (p_match_data->>'club_id')::UUID 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User not authorized to record matches in this club';
  END IF;
  
  -- Insert match (this triggers realtime event automatically)
  INSERT INTO matches (
    club_id, player1_id, player2_id, player3_id, player4_id,
    scores, match_type, date, opponent2_name, partner3_name, partner4_name,
    notes, invitation_id, challenge_id
  )
  SELECT 
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
    (p_match_data->>'challenge_id')::UUID
  RETURNING id INTO new_match_id;
  
  -- Update player ratings if scores provided
  IF match_scores IS NOT NULL AND match_scores != '' THEN
    PERFORM update_player_ratings(new_match_id);
    
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
  WHERE id = club_id;
  
  RETURN json_build_object(
    'success', true,
    'match_id', new_match_id,
    'ratings_updated', match_scores IS NOT NULL,
    'notifications_created', COALESCE(notification_result->>'notifications_created', '0')::INTEGER
  );
END;
$$;

-- EXAMPLE 2: Complete Club Join Function
-- ============================================================================
CREATE OR REPLACE FUNCTION join_club_complete(p_club_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  user_id UUID;
  club_name TEXT;
  member_count INTEGER;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO user_id;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM club_members 
    WHERE club_id = p_club_id AND user_id = user_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this club';
  END IF;
  
  -- Get club info
  SELECT name INTO club_name FROM clubs WHERE id = p_club_id;
  
  IF club_name IS NULL THEN
    RAISE EXCEPTION 'Club not found';
  END IF;
  
  -- Add user to club (triggers realtime event for club_members table)
  INSERT INTO club_members (club_id, user_id, joined_at)
  VALUES (p_club_id, user_id, NOW());
  
  -- Update club member count (triggers realtime event for clubs table)
  UPDATE clubs 
  SET 
    member_count = (SELECT COUNT(*) FROM club_members WHERE club_id = p_club_id),
    last_activity = NOW()
  WHERE id = p_club_id;
  
  -- Get updated member count
  SELECT member_count INTO member_count FROM clubs WHERE id = p_club_id;
  
  -- Create welcome notification (triggers realtime event for notifications table)
  PERFORM create_club_join_notifications(p_club_id, user_id);
  
  RETURN json_build_object(
    'success', true,
    'club_name', club_name,
    'member_count', member_count,
    'joined_at', NOW()
  );
END;
$$;

-- EXAMPLE 3: Helper function to determine match winner
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

-- EXAMPLE 4: Dashboard Data Aggregation Function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_club_dashboard_data(p_club_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  club_info RECORD;
  recent_matches JSON;
  member_stats JSON;
  upcoming_events JSON;
  result JSON;
BEGIN
  -- Verify user has access to this club
  IF NOT EXISTS (
    SELECT 1 FROM club_members 
    WHERE club_id = p_club_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to club dashboard';
  END IF;
  
  -- Get club basic info
  SELECT * INTO club_info FROM clubs WHERE id = p_club_id;
  
  -- Get recent matches (last 10)
  SELECT json_agg(
    json_build_object(
      'id', m.id,
      'date', m.date,
      'match_type', m.match_type,
      'scores', m.scores,
      'player1_name', u1.full_name,
      'player2_name', COALESCE(u2.full_name, m.opponent2_name)
    )
  ) INTO recent_matches
  FROM matches m
  LEFT JOIN users u1 ON m.player1_id = u1.id
  LEFT JOIN users u2 ON m.player2_id = u2.id
  WHERE m.club_id = p_club_id
  ORDER BY m.date DESC, m.created_at DESC
  LIMIT 10;
  
  -- Get member statistics
  SELECT json_build_object(
    'total_members', COUNT(*),
    'active_this_week', COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '7 days'),
    'new_this_month', COUNT(*) FILTER (WHERE joined_at > NOW() - INTERVAL '30 days')
  ) INTO member_stats
  FROM club_members cm
  LEFT JOIN users u ON cm.user_id = u.id
  WHERE cm.club_id = p_club_id;
  
  -- Get upcoming match invitations
  SELECT json_agg(
    json_build_object(
      'id', mi.id,
      'date', mi.date,
      'match_type', mi.match_type,
      'creator_name', u.full_name,
      'response_count', mi.response_count
    )
  ) INTO upcoming_events
  FROM match_invitations mi
  LEFT JOIN users u ON mi.creator_id = u.id
  WHERE mi.club_id = p_club_id 
    AND mi.date >= CURRENT_DATE
  ORDER BY mi.date ASC
  LIMIT 5;
  
  -- Build complete dashboard response
  SELECT json_build_object(
    'club', json_build_object(
      'id', club_info.id,
      'name', club_info.name,
      'description', club_info.description,
      'member_count', club_info.member_count,
      'last_activity', club_info.last_activity
    ),
    'recent_matches', COALESCE(recent_matches, '[]'::JSON),
    'member_stats', member_stats,
    'upcoming_events', COALESCE(upcoming_events, '[]'::JSON),
    'generated_at', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================================================
-- USAGE EXAMPLES FOR CLIENT
-- ============================================================================

/*
-- Instead of complex client-side match recording:
const { data } = await supabase.rpc('record_complete_match', {
  p_match_data: {
    club_id: '123e4567-e89b-12d3-a456-426614174000',
    player1_id: '123e4567-e89b-12d3-a456-426614174001',
    player2_id: null,
    opponent2_name: 'John Doe',
    scores: '6-4,6-2',
    match_type: 'singles',
    date: '2023-12-01'
  }
});

-- Instead of multiple club join operations:
const { data } = await supabase.rpc('join_club_complete', {
  p_club_id: '123e4567-e89b-12d3-a456-426614174000'
});

-- Instead of complex dashboard queries:
const { data } = await supabase.rpc('get_club_dashboard_data', {
  p_club_id: '123e4567-e89b-12d3-a456-426614174000'
});
*/

-- ============================================================================
-- REALTIME EVENTS STILL WORK AUTOMATICALLY
-- ============================================================================

/*
Client-side realtime subscriptions work unchanged:

// Still works! Gets events from function operations
supabase.channel('club_matches')
  .on('postgres_changes', {
    event: '*',
    schema: 'public', 
    table: 'matches',
    filter: `club_id=eq.${clubId}`
  }, (payload) => {
    // Triggered when record_complete_match() inserts a match
    console.log('New match from function:', payload.new);
  })
  .subscribe();

// RLS still applies - user only gets events for clubs they're in
// But functions can perform operations across any clubs as needed
*/