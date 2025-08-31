-- ============================================================================
-- CREATE USER PROFILE FUNCTION
-- Creates the missing function that your app calls during signup
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Function to create user profile from auth data
CREATE OR REPLACE FUNCTION public.create_user_profile_from_auth(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Insert or update user profile in public.users table
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_phone,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO v_user_id;

  -- Log the creation for debugging
  RAISE NOTICE 'Created user profile for: % (%) with phone: %', p_full_name, p_email, p_phone;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile_from_auth(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ============================================================================
-- VERIFICATION
-- Test the function (optional - uncomment to test)
-- ============================================================================

/*
-- Test the function with dummy data
SELECT public.create_user_profile_from_auth(
  gen_random_uuid(),
  'test@example.com',
  'Test User',
  '1234567890'
);
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
This function:
✅ Creates user profiles in public.users table
✅ Handles phone numbers from signup metadata
✅ Uses UPSERT (INSERT ... ON CONFLICT) for safety
✅ Returns the user ID for confirmation
✅ Has proper security settings (SECURITY DEFINER + search_path)
✅ Includes logging for debugging

Your app will now be able to call:
public.create_user_profile_from_auth(p_email, p_full_name, p_phone, p_user_id)

And it will create the user profile with all the data from signup.
*/

-- ============================================================================
-- END OF USER PROFILE FUNCTION
-- ============================================================================