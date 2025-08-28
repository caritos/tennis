-- Create Club Creation Notification Function
-- Notifies nearby users when a new club is created

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_club_creation_notifications(uuid, decimal, decimal);

CREATE OR REPLACE FUNCTION create_club_creation_notifications(
    p_club_id uuid,
    p_club_lat decimal,
    p_club_lng decimal
) RETURNS json AS $$
DECLARE
    club_record clubs%ROWTYPE;
    creator_user_record users%ROWTYPE;
    nearby_user_record RECORD;
    notification_count integer DEFAULT 0;
    max_distance_km decimal DEFAULT 50; -- Notify users within 50km
    earth_radius_km decimal DEFAULT 6371; -- Earth's radius in km
BEGIN
    -- Get club details
    SELECT * INTO club_record 
    FROM clubs 
    WHERE id = p_club_id;
    
    -- Validate club exists
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Club not found');
    END IF;
    
    -- Get creator details
    SELECT * INTO creator_user_record
    FROM users
    WHERE id = club_record.creator_id;
    
    -- Validate creator exists
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Creator not found');
    END IF;
    
    -- Find nearby users and create notifications
    -- Calculate distance using Haversine formula
    FOR nearby_user_record IN
        SELECT 
            u.id as user_id,
            u.full_name,
            u.email,
            -- Calculate distance using Haversine formula
            (earth_radius_km * acos(
                cos(radians(p_club_lat)) * 
                cos(radians(COALESCE(cm.last_location_lat, 40.7128))) * -- Default to NYC if no location
                cos(radians(COALESCE(cm.last_location_lng, -74.0060)) - radians(p_club_lng)) + 
                sin(radians(p_club_lat)) * 
                sin(radians(COALESCE(cm.last_location_lat, 40.7128)))
            )) AS distance_km
        FROM users u
        LEFT JOIN (
            -- Get user's latest location from club searches/activity
            SELECT DISTINCT user_id, 
                   FIRST_VALUE(lat) OVER (PARTITION BY user_id ORDER BY joined_at DESC) as last_location_lat,
                   FIRST_VALUE(lng) OVER (PARTITION BY user_id ORDER BY joined_at DESC) as last_location_lng
            FROM club_members cm2
            JOIN clubs c2 ON cm2.club_id = c2.id
        ) cm ON u.id = cm.user_id
        WHERE u.id != club_record.creator_id -- Don't notify creator
        HAVING distance_km <= max_distance_km
        ORDER BY distance_km ASC
        LIMIT 20 -- Limit to 20 nearest users to avoid spam
    LOOP
        -- Create notification for nearby user
        INSERT INTO notifications (
            id, user_id, type, title, message, 
            related_id, action_type, action_data, 
            expires_at, created_at
        ) 
        SELECT 
            gen_random_uuid(),
            nearby_user_record.user_id,
            'club_activity',
            '🎾 New Tennis Club Near You!',
            creator_user_record.full_name || ' created "' || club_record.name || '" in ' || club_record.location || '. Join the club to find tennis partners!',
            p_club_id,
            'join_club',
            json_build_object('clubId', p_club_id, 'distance', ROUND(nearby_user_record.distance_km::numeric, 1)),
            NOW() + INTERVAL '30 days', -- Expire after 30 days
            NOW();
            
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'notifications_created', notification_count,
        'club_name', club_record.name,
        'creator_name', creator_user_record.full_name
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
GRANT EXECUTE ON FUNCTION create_club_creation_notifications(uuid, decimal, decimal) TO authenticated;