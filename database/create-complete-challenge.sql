-- ============================================================================
-- CREATE COMPLETE CHALLENGE FUNCTION
-- Replaces complex client-side challenge creation with single database function
-- Based on actual challenges table schema
-- ============================================================================

CREATE OR REPLACE FUNCTION create_complete_challenge(p_challenge_data JSON)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  new_challenge_id UUID;
  challenge_club_id UUID;
  challenger_id UUID;
  challenged_id UUID;
  expires_at TIMESTAMP;
  challenger_name TEXT;
  notification_result JSON;
BEGIN
  -- Extract data from JSON parameter
  SELECT 
    (p_challenge_data->>'club_id')::UUID,
    (p_challenge_data->>'challenger_id')::UUID,
    (p_challenge_data->>'challenged_id')::UUID
  INTO challenge_club_id, challenger_id, challenged_id;
  
  -- Validate user has permission to create challenges in this club
  IF NOT EXISTS (
    SELECT 1 FROM club_members 
    WHERE club_members.club_id = challenge_club_id 
    AND club_members.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User not authorized to create challenges in this club';
  END IF;
  
  -- Validate both challenger and challenged are club members
  IF NOT EXISTS (
    SELECT 1 FROM club_members 
    WHERE club_members.club_id = challenge_club_id 
    AND club_members.user_id = challenger_id
  ) THEN
    RAISE EXCEPTION 'Challenger is not a member of this club';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM club_members 
    WHERE club_members.club_id = challenge_club_id 
    AND club_members.user_id = challenged_id
  ) THEN
    RAISE EXCEPTION 'Challenged player is not a member of this club';
  END IF;
  
  -- Generate UUID for new challenge
  new_challenge_id := gen_random_uuid();
  
  -- Set expiration to 7 days from now if not provided
  expires_at := COALESCE(
    (p_challenge_data->>'expires_at')::TIMESTAMP,
    NOW() + INTERVAL '7 days'
  );
  
  -- Get challenger name for notifications
  SELECT users.full_name INTO challenger_name
  FROM users
  WHERE users.id = challenger_id;
  
  IF challenger_name IS NULL THEN
    RAISE EXCEPTION 'Challenger not found';
  END IF;
  
  -- Insert challenge (this triggers realtime event automatically)
  INSERT INTO challenges (
    id,
    club_id,
    challenger_id,
    challenged_id,
    match_type,
    proposed_date,
    proposed_time,
    message,
    status,
    expires_at,
    contacts_shared,
    created_at,
    updated_at
  )
  VALUES (
    new_challenge_id,
    challenge_club_id,
    challenger_id,
    challenged_id,
    p_challenge_data->>'match_type',
    (p_challenge_data->>'proposed_date')::DATE,
    p_challenge_data->>'proposed_time',
    p_challenge_data->>'message',
    'pending',
    expires_at,
    false,
    NOW(),
    NOW()
  );
  
  -- Create challenge notifications using existing function
  SELECT create_challenge_notifications(
    new_challenge_id::TEXT,
    challenger_id::TEXT,
    'challenge_created'
  ) INTO notification_result;
  
  RETURN json_build_object(
    'success', true,
    'challenge_id', new_challenge_id,
    'challenger_name', challenger_name,
    'expires_at', expires_at,
    'notifications_created', COALESCE(notification_result->>'notifications_created', '0')::INTEGER
  );
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_complete_challenge(JSON) TO authenticated;

-- ============================================================================
-- USAGE EXAMPLE
-- ============================================================================

/*
-- Client code becomes:
const { data } = await supabase.rpc('create_complete_challenge', {
  p_challenge_data: {
    club_id: 'club-uuid-here',
    challenger_id: 'challenger-uuid-here',
    challenged_id: 'challenged-uuid-here',
    match_type: 'singles',
    proposed_date: '2024-01-15',
    proposed_time: '14:00',
    message: 'Ready for a match?',
    expires_at: null  // Optional, defaults to 7 days
  }
});

// Response:
{
  "success": true,
  "challenge_id": "new-challenge-uuid",
  "challenger_name": "John Doe", 
  "expires_at": "2024-01-22T10:30:00Z",
  "notifications_created": 1
}
*/