-- Debug function to investigate match invitation visibility issues
-- This function will help us understand why invitations aren't showing up

CREATE OR REPLACE FUNCTION debug_match_invitations(
  p_club_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'timestamp', now(),
    'inputs', json_build_object(
      'club_id', p_club_id,
      'user_id', p_user_id,
      'current_user_id', auth.uid()
    ),
    'club_info', (
      SELECT json_build_object(
        'exists', EXISTS(SELECT 1 FROM clubs WHERE id = p_club_id),
        'name', (SELECT name FROM clubs WHERE id = p_club_id)
      )
    ),
    'raw_invitations', (
      SELECT json_agg(
        json_build_object(
          'id', mi.id,
          'club_id', mi.club_id,
          'creator_id', mi.creator_id,
          'date', mi.date,
          'status', mi.status,
          'created_at', mi.created_at,
          'creator_name', u.full_name
        )
      )
      FROM match_invitations mi
      LEFT JOIN users u ON mi.creator_id = u.id
      WHERE mi.club_id = p_club_id
    ),
    'user_membership', (
      SELECT json_build_object(
        'is_member', EXISTS(
          SELECT 1 FROM club_members 
          WHERE club_id = p_club_id 
          AND user_id = COALESCE(p_user_id, auth.uid())
        )
      )
    ),
    'rls_context', (
      SELECT json_build_object(
        'auth_uid', auth.uid(),
        'is_authenticated', auth.uid() IS NOT NULL
      )
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION debug_match_invitations(uuid, uuid) TO authenticated;