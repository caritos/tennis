-- Fix the infinite recursion in user insert policy
-- The issue is the policy is checking the users table while inserting into it

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a simpler, non-recursive policy
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid()::text = id::text
  );

-- Ensure service role can still insert (for admin purposes)  
DROP POLICY IF EXISTS "Service role can insert users" ON users;
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

RAISE NOTICE 'Fixed user insert policy - removed infinite recursion';