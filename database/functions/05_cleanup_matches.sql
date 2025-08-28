-- CLEANUP MATCHES FUNCTION
-- This function bypasses RLS policies to clean up match data for testing

CREATE OR REPLACE FUNCTION cleanup_all_matches(
  p_confirm_cleanup text DEFAULT 'no'
)
RETURNS jsonb
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_responses integer := 0;
  v_deleted_invitations integer := 0;
  v_deleted_matches integer := 0;
  v_deleted_notifications integer := 0;
BEGIN
  -- Safety check - require explicit confirmation
  IF p_confirm_cleanup != 'YES_DELETE_ALL_MATCHES' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Confirmation required. Call with p_confirm_cleanup => ''YES_DELETE_ALL_MATCHES'''
    );
  END IF;
  
  -- Delete invitation responses first (foreign key dependency)
  DELETE FROM invitation_responses;
  GET DIAGNOSTICS v_deleted_responses = ROW_COUNT;
  
  -- Delete match invitations
  DELETE FROM match_invitations;
  GET DIAGNOSTICS v_deleted_invitations = ROW_COUNT;
  
  -- Delete regular matches
  DELETE FROM matches;
  GET DIAGNOSTICS v_deleted_matches = ROW_COUNT;
  
  -- Delete match-related notifications
  DELETE FROM notifications 
  WHERE type = 'match_invitation' OR action_type = 'view_match';
  GET DIAGNOSTICS v_deleted_notifications = ROW_COUNT;
  
  -- Log the cleanup
  RAISE LOG 'Match cleanup completed: % responses, % invitations, % matches, % notifications deleted', 
    v_deleted_responses, v_deleted_invitations, v_deleted_matches, v_deleted_notifications;
  
  -- Return success with counts
  RETURN jsonb_build_object(
    'success', true,
    'message', 'All matches cleaned up successfully',
    'deleted', jsonb_build_object(
      'responses', v_deleted_responses,
      'invitations', v_deleted_invitations,  
      'matches', v_deleted_matches,
      'notifications', v_deleted_notifications
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE LOG 'Error cleaning up matches: % %', SQLSTATE, SQLERRM;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Database error: %s', SQLERRM),
      'sqlstate', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_all_matches TO authenticated;