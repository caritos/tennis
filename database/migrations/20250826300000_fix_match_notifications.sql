-- Fix match result notifications function - correct field references
-- The previous version tried to access non-existent 'opponent_name' field

CREATE OR REPLACE FUNCTION create_match_result_notifications(
    p_match_id uuid,
    p_winner integer, -- 1 for player1/team1 wins, 2 for player2/team2 wins
    p_recorder_user_id text
) RETURNS json AS $$
DECLARE
    match_record matches%ROWTYPE;
    player_names text[];
    notification_ids uuid[] := '{}';
    temp_notification_id uuid;
BEGIN
    -- Get match details
    SELECT * INTO match_record FROM matches WHERE id = p_match_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Match not found');
    END IF;
    
    -- Get player names for personalized messages
    -- Use correct field names from matches table schema
    SELECT ARRAY[
        COALESCE((SELECT full_name FROM users WHERE id = match_record.player1_id), ''),
        COALESCE((SELECT full_name FROM users WHERE id = match_record.player2_id), match_record.opponent2_name, ''),
        COALESCE((SELECT full_name FROM users WHERE id = match_record.player3_id), match_record.partner3_name, ''),
        COALESCE((SELECT full_name FROM users WHERE id = match_record.player4_id), match_record.partner4_name, '')
    ] INTO player_names;
    
    -- Create notifications for all players except the recorder
    FOR i IN 1..4 LOOP
        DECLARE
            current_player_id uuid;
            is_winner boolean;
            opponent_names text;
        BEGIN
            -- Get current player ID
            current_player_id := CASE i
                WHEN 1 THEN match_record.player1_id
                WHEN 2 THEN match_record.player2_id  
                WHEN 3 THEN match_record.player3_id
                WHEN 4 THEN match_record.player4_id
            END;
            
            -- Skip if no player or if this is the recorder
            CONTINUE WHEN current_player_id IS NULL OR current_player_id::text = p_recorder_user_id;
            
            -- Determine if this player won
            is_winner := (i <= 2 AND p_winner = 1) OR (i > 2 AND p_winner = 2);
            
            -- Build opponent names
            opponent_names := CASE 
                WHEN match_record.match_type = 'singles' THEN
                    CASE WHEN i = 1 THEN player_names[2] ELSE player_names[1] END
                ELSE
                    -- For doubles, show the opposing team
                    CASE 
                        WHEN i <= 2 THEN 
                            CASE 
                                WHEN player_names[3] != '' AND player_names[4] != '' THEN player_names[3] || ' & ' || player_names[4]
                                WHEN player_names[3] != '' THEN player_names[3]
                                WHEN player_names[4] != '' THEN player_names[4]
                                ELSE 'opponents'
                            END
                        ELSE 
                            CASE 
                                WHEN player_names[1] != '' AND player_names[2] != '' THEN player_names[1] || ' & ' || player_names[2]
                                WHEN player_names[1] != '' THEN player_names[1]
                                WHEN player_names[2] != '' THEN player_names[2]
                                ELSE 'opponents'
                            END
                    END
            END;
            
            -- Create notification
            INSERT INTO notifications (
                user_id, type, title, message, 
                related_id, action_type, action_data
            ) VALUES (
                current_player_id,
                'match_result',
                CASE WHEN is_winner THEN '🏆 Match Won!' ELSE '🎾 Match Recorded' END,
                CASE WHEN is_winner 
                    THEN 'Congratulations! You won against ' || opponent_names || '. Score: ' || match_record.scores
                    ELSE 'Match completed against ' || opponent_names || '. Better luck next time! Score: ' || match_record.scores
                END,
                p_match_id,
                'view_match',
                json_build_object('matchId', p_match_id)
            ) RETURNING id INTO temp_notification_id;
            
            notification_ids := notification_ids || temp_notification_id;
        END;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'notifications_created', array_length(notification_ids, 1),
        'notification_ids', notification_ids
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_match_result_notifications(uuid, integer, text) TO authenticated;