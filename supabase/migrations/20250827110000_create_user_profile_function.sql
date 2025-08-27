-- Create User Profile Management Function
-- Handles user profile creation/updates with proper error handling and race condition protection

CREATE OR REPLACE FUNCTION create_or_update_user_profile(
    p_user_id uuid,
    p_email text,
    p_full_name text,
    p_phone text DEFAULT '',
    p_role text DEFAULT 'player'
) RETURNS json AS $$
DECLARE
    user_profile users%ROWTYPE;
    is_new_user boolean := false;
BEGIN
    -- Try to get existing user profile
    SELECT * INTO user_profile FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        -- User doesn't exist, create new profile
        is_new_user := true;
        
        INSERT INTO users (
            id, email, full_name, phone, role, 
            rating, wins, losses, total_matches, 
            active_status, created_at, updated_at
        ) VALUES (
            p_user_id, p_email, p_full_name, p_phone, p_role,
            1200, 0, 0, 0, -- Default rating and stats
            'active', NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            updated_at = NOW()
        RETURNING * INTO user_profile;
        
    ELSE
        -- User exists, update profile if needed
        UPDATE users SET
            email = p_email,
            full_name = p_full_name,
            phone = COALESCE(NULLIF(p_phone, ''), phone), -- Keep existing phone if new one is empty
            updated_at = NOW()
        WHERE id = p_user_id
        RETURNING * INTO user_profile;
    END IF;
    
    -- Return success response with user profile
    RETURN json_build_object(
        'success', true,
        'is_new_user', is_new_user,
        'user_profile', row_to_json(user_profile),
        'message', CASE 
            WHEN is_new_user THEN 'User profile created successfully'
            ELSE 'User profile updated successfully'
        END
    );
    
EXCEPTION
    WHEN unique_violation THEN
        -- Handle race condition - another process created the user
        SELECT * INTO user_profile FROM users WHERE id = p_user_id;
        
        IF FOUND THEN
            RETURN json_build_object(
                'success', true,
                'is_new_user', false,
                'user_profile', row_to_json(user_profile),
                'message', 'User profile already exists (race condition handled)'
            );
        ELSE
            RETURN json_build_object(
                'success', false,
                'error', 'Race condition: User creation failed'
            );
        END IF;
        
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_or_update_user_profile(uuid, text, text, text, text) TO authenticated;

-- Create a simpler wrapper function for common use case
CREATE OR REPLACE FUNCTION create_user_profile_from_auth(
    p_user_id uuid,
    p_email text,
    p_full_name text,
    p_phone text DEFAULT ''
) RETURNS json AS $$
BEGIN
    RETURN create_or_update_user_profile(p_user_id, p_email, p_full_name, p_phone, 'player');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_user_profile_from_auth(uuid, text, text, text) TO authenticated;

-- Log the creation
DO $$
BEGIN
    RAISE NOTICE '✅ Created user profile management functions:';
    RAISE NOTICE '   - create_or_update_user_profile() - Full control with role';
    RAISE NOTICE '   - create_user_profile_from_auth() - Simplified for auth context';
    RAISE NOTICE '🔐 Functions handle race conditions and duplicate key errors automatically';
END $$;