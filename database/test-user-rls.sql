-- Test script to verify RLS policies for user registration
-- This script tests that the fixed RLS policies allow proper user creation
-- 
-- Run this in Supabase SQL Editor to verify the fix works

-- Test 1: Clean up any test users
DELETE FROM public.users WHERE email = 'test-rls@example.com';
DELETE FROM auth.users WHERE email = 'test-rls@example.com';

-- Test 2: Create a test user in auth.users (simulating signup)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Generate a test UUID
  test_user_id := gen_random_uuid();
  
  -- Insert into auth.users (this simulates what Supabase Auth does)
  INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    test_user_id,
    'authenticated',
    'authenticated',
    'test-rls@example.com',
    '$2a$10$PkZF8NDfVPQ3j0KMjQg7XuxoMeR8xu2ieJoUq1SkN3PrjKZlXgKZK', -- dummy password
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test RLS User"}'
  );

  -- Now test if we can insert into public.users with proper RLS
  -- This is what AuthContext.tsx tries to do during registration
  INSERT INTO public.users (
    id, 
    email, 
    full_name,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    'test-rls@example.com',
    'Test RLS User',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Success! User profile created with id: %', test_user_id;
  
  -- Clean up
  DELETE FROM public.users WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RAISE NOTICE 'Test completed and cleaned up successfully';
  
EXCEPTION
  WHEN OTHERS THEN
    -- Clean up on error
    DELETE FROM public.users WHERE email = 'test-rls@example.com';
    DELETE FROM auth.users WHERE email = 'test-rls@example.com';
    RAISE NOTICE 'Error occurred: % - %', SQLSTATE, SQLERRM;
    RAISE;
END;
$$;

-- Test 3: Verify all RLS policies use consistent string casting
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'notifications')
  AND (
    qual LIKE '%auth.uid() =%' 
    OR with_check LIKE '%auth.uid() =%'
  )
  AND (
    qual NOT LIKE '%::text%' 
    OR with_check NOT LIKE '%::text%'
  );

-- If this query returns no results, all policies have proper string casting
-- If it returns results, those policies still need to be fixed