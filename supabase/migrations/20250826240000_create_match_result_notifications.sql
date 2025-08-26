-- Create Match Result Notification Function
-- Migration: Create PostgreSQL function for match result notifications

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_match_result_notifications(uuid, integer, text);

CREATE OR REPLACE FUNCTION create_match_result_notifications(
    p_match_id uuid,
    p_winner integer, -- 1 or 2
    p_recorder_user_id text -- Who recorded the match
) RETURNS json AS $$
DECLARE
    match_record matches%ROWTYPE;
    club_record clubs%ROWTYPE;
    recorder_user_record users%ROWTYPE;
    player1_user_record users%ROWTYPE;
    player2_user_record users%ROWTYPE;
    player3_user_record users%ROWTYPE;
    player4_user_record users%ROWTYPE;
    notification_count integer DEFAULT 0;
BEGIN
    -- Get match details
    SELECT * INTO match_record 
    FROM matches 
    WHERE id = p_match_id;
    
    -- Validate match exists
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Match not found');
    END IF;
    
    -- Get club details
    SELECT * INTO club_record
    FROM clubs
    WHERE id = match_record.club_id;
    
    -- Get recorder user details
    SELECT * INTO recorder_user_record
    FROM users
    WHERE id = p_recorder_user_id::uuid;
    
    -- Get player details
    SELECT * INTO player1_user_record
    FROM users
    WHERE id = match_record.player1_id;
    
    -- Get player 2 if they exist (registered user, not opponent name)
    IF match_record.player2_id IS NOT NULL THEN
        SELECT * INTO player2_user_record
        FROM users
        WHERE id = match_record.player2_id;
    END IF;
    
    -- Get player 3 if doubles match
    IF match_record.player3_id IS NOT NULL THEN
        SELECT * INTO player3_user_record
        FROM users
        WHERE id = match_record.player3_id;
    END IF;
    
    -- Get player 4 if doubles match
    IF match_record.player4_id IS NOT NULL THEN
        SELECT * INTO player4_user_record
        FROM users
        WHERE id = match_record.player4_id;
    END IF;
    
    -- Create notification for Player 1 (if they didn't record it)
    IF match_record.player1_id != p_recorder_user_id::uuid AND player1_user_record.id IS NOT NULL THEN
        INSERT INTO notifications (
            id, user_id, type, title, message, 
            related_id, action_type, action_data, 
            expires_at, created_at
        ) 
        SELECT 
            gen_random_uuid(),
            match_record.player1_id,
            'match_result',
            CASE 
                WHEN p_winner = 1 THEN '🎾 Victory! Match Result Recorded'
                ELSE '🎾 Match Result Recorded' 
            END,
            CASE 
                WHEN p_winner = 1 THEN 'Congratulations! Your match win vs ' || COALESCE(player2_user_record.full_name, match_record.opponent2_name, 'opponent') || ' has been recorded. Score: ' || match_record.scores
                ELSE 'Your match vs ' || COALESCE(player2_user_record.full_name, match_record.opponent2_name, 'opponent') || ' has been recorded. Score: ' || match_record.scores
            END,
            p_match_id,
            'view_match',
            json_build_object('matchId', p_match_id, 'clubId', match_record.club_id, 'winner', p_winner),
            NOW() + INTERVAL '30 days',
            NOW();
            
        notification_count := notification_count + 1;
    END IF;
    
    -- Create notification for Player 2 (if they exist and didn't record it)
    IF match_record.player2_id IS NOT NULL AND match_record.player2_id != p_recorder_user_id::uuid AND player2_user_record.id IS NOT NULL THEN
        INSERT INTO notifications (
            id, user_id, type, title, message, 
            related_id, action_type, action_data, 
            expires_at, created_at
        ) 
        SELECT 
            gen_random_uuid(),
            match_record.player2_id,
            'match_result',
            CASE 
                WHEN p_winner = 2 THEN '🎾 Victory! Match Result Recorded'
                ELSE '🎾 Match Result Recorded' 
            END,
            CASE 
                WHEN p_winner = 2 THEN 'Congratulations! Your match win vs ' || COALESCE(player1_user_record.full_name, 'opponent') || ' has been recorded. Score: ' || match_record.scores
                ELSE 'Your match vs ' || COALESCE(player1_user_record.full_name, 'opponent') || ' has been recorded. Score: ' || match_record.scores
            END,
            p_match_id,
            'view_match',
            json_build_object('matchId', p_match_id, 'clubId', match_record.club_id, 'winner', p_winner),
            NOW() + INTERVAL '30 days',
            NOW();
            
        notification_count := notification_count + 1;
    END IF;
    
    -- Create notification for Player 3 (doubles - if they exist and didn't record it)
    IF match_record.player3_id IS NOT NULL AND match_record.player3_id != p_recorder_user_id::uuid AND player3_user_record.id IS NOT NULL THEN
        INSERT INTO notifications (
            id, user_id, type, title, message, 
            related_id, action_type, action_data, 
            expires_at, created_at
        ) 
        SELECT 
            gen_random_uuid(),
            match_record.player3_id,
            'match_result',
            CASE 
                WHEN p_winner = 1 THEN '🎾 Victory! Doubles Match Result Recorded'
                ELSE '🎾 Doubles Match Result Recorded' 
            END,
            CASE 
                WHEN p_winner = 1 THEN 'Congratulations! Your doubles match win has been recorded. Score: ' || match_record.scores
                ELSE 'Your doubles match result has been recorded. Score: ' || match_record.scores
            END,
            p_match_id,
            'view_match',
            json_build_object('matchId', p_match_id, 'clubId', match_record.club_id, 'winner', p_winner),
            NOW() + INTERVAL '30 days',
            NOW();
            
        notification_count := notification_count + 1;
    END IF;
    
    -- Create notification for Player 4 (doubles - if they exist and didn't record it)
    IF match_record.player4_id IS NOT NULL AND match_record.player4_id != p_recorder_user_id::uuid AND player4_user_record.id IS NOT NULL THEN
        INSERT INTO notifications (
            id, user_id, type, title, message, 
            related_id, action_type, action_data, 
            expires_at, created_at
        ) 
        SELECT 
            gen_random_uuid(),
            match_record.player4_id,
            'match_result',
            CASE 
                WHEN p_winner = 2 THEN '🎾 Victory! Doubles Match Result Recorded'
                ELSE '🎾 Doubles Match Result Recorded' 
            END,
            CASE 
                WHEN p_winner = 2 THEN 'Congratulations! Your doubles match win has been recorded. Score: ' || match_record.scores
                ELSE 'Your doubles match result has been recorded. Score: ' || match_record.scores
            END,
            p_match_id,
            'view_match',
            json_build_object('matchId', p_match_id, 'clubId', match_record.club_id, 'winner', p_winner),
            NOW() + INTERVAL '30 days',
            NOW();
            
        notification_count := notification_count + 1;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'notifications_created', notification_count,
        'match_id', p_match_id,
        'club_name', club_record.name,
        'recorder_name', recorder_user_record.full_name
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Database error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_match_result_notifications(uuid, integer, text) TO authenticated;