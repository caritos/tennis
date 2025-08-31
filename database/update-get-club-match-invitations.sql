-- Update get_club_match_invitations to include targeted player fields
-- This ensures the function returns targeted_players and targeted_player_names

DROP FUNCTION IF EXISTS get_club_match_invitations(uuid, uuid);

CREATE OR REPLACE FUNCTION get_club_match_invitations(
  p_club_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  club_id uuid,
  creator_id uuid,
  date date,
  "time" text,
  location text,
  match_type text,
  notes text,
  status text,
  created_at timestamptz,
  creator_full_name text,
  creator_phone text,
  response_count bigint,
  responses json,
  targeted_players uuid[],
  targeted_player_names text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := COALESCE(p_user_id, auth.uid());
  
  IF p_club_id IS NULL THEN
    RAISE EXCEPTION 'club_id cannot be null';
  END IF;
  
  -- Return match invitations with all related data including targeted fields
  RETURN QUERY
  SELECT 
    mi.id,
    mi.club_id,
    mi.creator_id,
    mi.date,
    mi."time"::text,
    mi.location,
    mi.match_type,
    mi.notes,
    mi.status,
    mi.created_at,
    u.full_name as creator_full_name,
    u.phone as creator_phone,
    COALESCE(response_counts.response_count, 0) as response_count,
    COALESCE(responses.responses, '[]'::json) as responses,
    mi.targeted_players,
    mi.targeted_player_names  -- Use the column directly from the table
  FROM match_invitations mi
  LEFT JOIN users u ON mi.creator_id = u.id
  LEFT JOIN (
    SELECT invitation_id, COUNT(*) as response_count
    FROM invitation_responses mir
    GROUP BY invitation_id
  ) response_counts ON mi.id = response_counts.invitation_id
  LEFT JOIN (
    SELECT 
      mir.invitation_id,
      json_agg(
        json_build_object(
          'id', mir.id,
          'user_id', mir.user_id,
          'status', mir.status,
          'full_name', resp_users.full_name,
          'user_elo_rating', resp_users.elo_rating,
          'user_games_played', resp_users.games_played,
          'user_phone', resp_users.phone,
          'created_at', mir.created_at
        )
      ) as responses
    FROM invitation_responses mir
    LEFT JOIN users resp_users ON mir.user_id = resp_users.id
    GROUP BY mir.invitation_id
  ) responses ON mi.id = responses.invitation_id
  WHERE mi.club_id = p_club_id
    AND mi.status != 'cancelled'
  ORDER BY mi.date ASC, mi.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_club_match_invitations(uuid, uuid) TO authenticated;