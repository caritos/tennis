-- Fix migration state after manual SQL execution
-- This migration ensures all functions and policies are in the correct final state

-- ============================================================================
-- PART 1: ENSURE ALL NOTIFICATION FUNCTIONS EXIST
-- ============================================================================

-- Create or replace match result notifications function
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
    SELECT ARRAY[
        COALESCE((SELECT full_name FROM users WHERE id = match_record.player1_id), match_record.opponent_name),
        COALESCE((SELECT full_name FROM users WHERE id = match_record.player2_id), match_record.opponent2_name),
        COALESCE((SELECT full_name FROM users WHERE id = match_record.player3_id), ''),
        COALESCE((SELECT full_name FROM users WHERE id = match_record.player4_id), '')
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
                        WHEN i <= 2 THEN player_names[3] || ' & ' || player_names[4]
                        ELSE player_names[1] || ' & ' || player_names[2]
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

-- Create or replace club creation notifications function  
CREATE OR REPLACE FUNCTION create_club_creation_notifications(
    p_club_id uuid,
    p_club_lat numeric,
    p_club_lng numeric
) RETURNS json AS $$
DECLARE
    club_record clubs%ROWTYPE;
    nearby_users RECORD;
    notification_count integer := 0;
    max_notifications integer := 20; -- Limit to prevent spam
BEGIN
    -- Get club details
    SELECT * INTO club_record FROM clubs WHERE id = p_club_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Club not found');
    END IF;
    
    -- Find nearby users (within 50km) using Haversine formula
    -- Exclude the club creator
    FOR nearby_users IN
        SELECT 
            u.id as user_id,
            u.full_name,
            -- Calculate distance using Haversine formula (approximate)
            (
                6371 * acos(
                    cos(radians(p_club_lat)) * 
                    cos(radians(u.lat)) * 
                    cos(radians(u.lng) - radians(p_club_lng)) + 
                    sin(radians(p_club_lat)) * 
                    sin(radians(u.lat))
                )
            ) as distance_km
        FROM users u 
        WHERE u.lat IS NOT NULL 
          AND u.lng IS NOT NULL
          AND u.id != club_record.creator_id
          AND (
            6371 * acos(
                cos(radians(p_club_lat)) * 
                cos(radians(u.lat)) * 
                cos(radians(u.lng) - radians(p_club_lng)) + 
                sin(radians(p_club_lat)) * 
                sin(radians(u.lat))
            )
        ) <= 50 -- Within 50km
        ORDER BY distance_km
        LIMIT max_notifications
    LOOP
        -- Create notification for nearby user
        INSERT INTO notifications (
            user_id, type, title, message,
            related_id, action_type, action_data
        ) VALUES (
            nearby_users.user_id,
            'club_activity',
            '🏟️ New Tennis Club Nearby!',
            club_record.name || ' was just created ' || 
            ROUND(nearby_users.distance_km, 1) || 'km from you in ' || 
            club_record.location || '. Join to connect with local players!',
            p_club_id,
            'join_club',
            json_build_object('clubId', p_club_id, 'distance', ROUND(nearby_users.distance_km, 1))
        );
        
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'notifications_created', notification_count,
        'club_name', club_record.name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_club_creation_notifications(uuid, numeric, numeric) TO authenticated;

-- Create or replace club join notifications function
CREATE OR REPLACE FUNCTION create_club_join_notifications(
    p_club_id uuid,
    p_new_member_id uuid
) RETURNS json AS $$
DECLARE
    club_record clubs%ROWTYPE;
    new_member_record users%ROWTYPE;
    creator_record users%ROWTYPE;
    member_record RECORD;
    welcome_notification_id uuid;
    notification_count integer := 0;
    max_member_notifications integer := 10; -- Limit notifications to existing members
BEGIN
    -- Get club and member details
    SELECT * INTO club_record FROM clubs WHERE id = p_club_id;
    SELECT * INTO new_member_record FROM users WHERE id = p_new_member_id;
    SELECT * INTO creator_record FROM users WHERE id = club_record.creator_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Club or member not found');
    END IF;
    
    -- Create welcome notification for the new member
    INSERT INTO notifications (
        user_id, type, title, message,
        related_id, action_type, action_data
    ) VALUES (
        p_new_member_id,
        'club_activity', 
        '🎾 Welcome to ' || club_record.name || '!',
        CASE 
            WHEN club_record.creator_id = p_new_member_id THEN
                'You created ' || club_record.name || '! Start inviting players and organizing matches.'
            ELSE 
                'Welcome to ' || club_record.name || '! You can now challenge other members and join matches. Created by ' || creator_record.full_name || '.'
        END,
        p_club_id,
        'view_club',
        json_build_object('clubId', p_club_id)
    ) RETURNING id INTO welcome_notification_id;
    
    notification_count := notification_count + 1;
    
    -- Notify existing club members (excluding the new member)
    FOR member_record IN
        SELECT u.id, u.full_name, cm.joined_at
        FROM users u
        JOIN club_members cm ON cm.user_id = u.id  
        WHERE cm.club_id = p_club_id 
          AND u.id != p_new_member_id
        ORDER BY cm.joined_at DESC -- Most recent members first
        LIMIT max_member_notifications
    LOOP
        INSERT INTO notifications (
            user_id, type, title, message,
            related_id, action_type, action_data  
        ) VALUES (
            member_record.id,
            'club_activity',
            '👋 New Member Joined!',
            new_member_record.full_name || ' just joined ' || club_record.name || 
            '! Say hello and maybe challenge them to a match.',
            p_club_id,
            'view_club',
            json_build_object('clubId', p_club_id, 'newMemberId', p_new_member_id)
        );
        
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'notifications_created', notification_count,
        'welcome_notification_id', welcome_notification_id,
        'club_name', club_record.name,
        'member_name', new_member_record.full_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_club_join_notifications(uuid, uuid) TO authenticated;

-- ============================================================================
-- PART 2: ENSURE CONSTRAINTS ARE CORRECT
-- ============================================================================

-- Update action_type constraint to include all needed types
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_action_type_check') THEN
        ALTER TABLE notifications DROP CONSTRAINT notifications_action_type_check;
    END IF;
    
    -- Add updated constraint
    ALTER TABLE notifications ADD CONSTRAINT notifications_action_type_check 
    CHECK (action_type = ANY (ARRAY[
        'accept_challenge'::text, 
        'decline_challenge'::text, 
        'view_match'::text, 
        'view_ranking'::text, 
        'join_club'::text, 
        'view_club'::text
    ]));
END $$;

-- ============================================================================
-- PART 3: CLEAN UP DUPLICATE POLICIES
-- ============================================================================

-- Function to safely drop policy if it exists
CREATE OR REPLACE FUNCTION drop_policy_if_exists(table_name text, policy_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
EXCEPTION WHEN others THEN
    -- Ignore errors if policy doesn't exist
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Clean up any duplicate notification policies
SELECT drop_policy_if_exists('notifications', 'notifications_delete');
SELECT drop_policy_if_exists('notifications', 'notifications_insert'); 
SELECT drop_policy_if_exists('notifications', 'notifications_select');
SELECT drop_policy_if_exists('notifications', 'notifications_update');

-- Drop the helper function
DROP FUNCTION drop_policy_if_exists(text, text);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration state fixed - all functions and policies are now properly configured';
    RAISE NOTICE '🚀 Ready for proper migration workflow going forward';
END $$;