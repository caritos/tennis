-- URGENT: Run this immediately in Supabase SQL Editor to fix critical security vulnerability
-- Go to: https://supabase.com/dashboard/project/dgkdbqloehxruoijylzw/sql/new
-- Copy and paste this entire script, then click "Run"

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

-- Create RLS policies for blocked_users table
-- Users can only view blocks they created
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

-- Verify RLS is now enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('reports', 'blocked_users');

-- This query should show 'true' for both tables in the rowsecurity column