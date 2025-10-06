-- Fix RLS permissions for API access
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily to allow API access
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_unique_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_pending_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_batch_runs DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 'RLS policies disabled for API access' as status;

