-- Fix Critical RLS Security Issues
-- Migration: 20250826150000_fix_critical_rls_security.sql
-- Enables Row Level Security on tables that are missing it

-- CRITICAL SECURITY FIX: Enable RLS on reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- CRITICAL SECURITY FIX: Enable RLS on blocked_users table  
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reports table
-- Users can only view reports they created or that involve them
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (
    auth.uid() = reporter_id OR 
    auth.uid() = reported_user_id
  );

-- Users can only create reports where they are the reporter
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users cannot update or delete reports (maintain audit trail)
-- Only admins should be able to update reports through admin functions

-- Create RLS policies for blocked_users table
-- Users can only view blocks they created or blocks against them
CREATE POLICY "Users can view blocks they created" ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can only create blocks where they are the blocker
CREATE POLICY "Users can create blocks" ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can only delete blocks they created
CREATE POLICY "Users can delete their own blocks" ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- Prevent users from blocking themselves
ALTER TABLE public.blocked_users 
ADD CONSTRAINT check_no_self_block 
CHECK (blocker_id != blocked_user_id);

-- Create indexes for performance with RLS queries
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON public.blocked_users(blocked_user_id);

-- Add helpful comments for future developers
COMMENT ON POLICY "Users can view their own reports" ON public.reports IS 
'Users can view reports they filed or reports filed against them for transparency';

COMMENT ON POLICY "Users can create reports" ON public.reports IS 
'Users can only file reports where they are the reporter to prevent abuse';

COMMENT ON POLICY "Users can view blocks they created" ON public.blocked_users IS 
'Users can view their block list for management purposes';

COMMENT ON POLICY "Users can create blocks" ON public.blocked_users IS 
'Users can block other users but only through their own account';

COMMENT ON POLICY "Users can delete their own blocks" ON public.blocked_users IS 
'Users can unblock users they previously blocked';

-- Security verification queries (for testing):
-- These should return no rows when RLS is working correctly for unauthorized access
/*
Test queries to run after migration:

-- Should fail if user tries to view others' reports
SELECT * FROM reports WHERE reporter_id != auth.uid();

-- Should fail if user tries to view blocks they didn't create  
SELECT * FROM blocked_users WHERE blocker_id != auth.uid();

-- Should succeed for own data
SELECT * FROM reports WHERE reporter_id = auth.uid();
SELECT * FROM blocked_users WHERE blocker_id = auth.uid();
*/

-- Rollback instructions (DANGER - this will disable security):
-- ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.blocked_users DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
-- DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
-- DROP POLICY IF EXISTS "Users can view blocks they created" ON public.blocked_users;
-- DROP POLICY IF EXISTS "Users can create blocks" ON public.blocked_users;
-- DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.blocked_users;