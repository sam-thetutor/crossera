-- Force disable RLS and drop all policies
-- Run this in Supabase SQL Editor

-- Drop all existing policies first
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON campaigns;
DROP POLICY IF EXISTS "Users can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete campaigns" ON campaigns;

DROP POLICY IF EXISTS "Project campaigns are viewable by everyone" ON project_campaigns;
DROP POLICY IF EXISTS "Users can insert project campaigns" ON project_campaigns;
DROP POLICY IF EXISTS "Users can update project campaigns" ON project_campaigns;
DROP POLICY IF EXISTS "Users can delete project campaigns" ON project_campaigns;

DROP POLICY IF EXISTS "Transactions are viewable by everyone" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete transactions" ON transactions;

DROP POLICY IF EXISTS "Campaign claims are viewable by everyone" ON campaign_claims;
DROP POLICY IF EXISTS "Users can insert campaign claims" ON campaign_claims;
DROP POLICY IF EXISTS "Users can update campaign claims" ON campaign_claims;
DROP POLICY IF EXISTS "Users can delete campaign claims" ON campaign_claims;

DROP POLICY IF EXISTS "Project unique users are viewable by everyone" ON project_unique_users;
DROP POLICY IF EXISTS "Users can insert project unique users" ON project_unique_users;
DROP POLICY IF EXISTS "Users can update project unique users" ON project_unique_users;
DROP POLICY IF EXISTS "Users can delete project unique users" ON project_unique_users;

DROP POLICY IF EXISTS "Project user stats are viewable by everyone" ON project_user_stats;
DROP POLICY IF EXISTS "Users can insert project user stats" ON project_user_stats;
DROP POLICY IF EXISTS "Users can update project user stats" ON project_user_stats;
DROP POLICY IF EXISTS "Users can delete project user stats" ON project_user_stats;

DROP POLICY IF EXISTS "SDK pending transactions are viewable by everyone" ON sdk_pending_transactions;
DROP POLICY IF EXISTS "Users can insert SDK pending transactions" ON sdk_pending_transactions;
DROP POLICY IF EXISTS "Users can update SDK pending transactions" ON sdk_pending_transactions;
DROP POLICY IF EXISTS "Users can delete SDK pending transactions" ON sdk_pending_transactions;

DROP POLICY IF EXISTS "SDK batch runs are viewable by everyone" ON sdk_batch_runs;
DROP POLICY IF EXISTS "Users can insert SDK batch runs" ON sdk_batch_runs;
DROP POLICY IF EXISTS "Users can update SDK batch runs" ON sdk_batch_runs;
DROP POLICY IF EXISTS "Users can delete SDK batch runs" ON sdk_batch_runs;

-- Now disable RLS on all tables
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
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

SELECT 'RLS disabled and all policies dropped' as status;

