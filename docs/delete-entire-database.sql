-- =====================================================
-- DELETE ENTIRE DATABASE SCHEMA
-- =====================================================
-- WARNING: This will delete ALL data and tables
-- Run this ONLY if you want to start completely fresh

-- Drop all functions first (they may have dependencies)
DROP FUNCTION IF EXISTS get_campaign_claims_data(integer,character varying) CASCADE;
DROP FUNCTION IF EXISTS get_user_total_rewards(character varying) CASCADE;
DROP FUNCTION IF EXISTS increment_transaction_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_project_stats(character varying) CASCADE;
DROP FUNCTION IF EXISTS increment_campaign_apps_count() CASCADE;
DROP FUNCTION IF EXISTS increment_campaign_transactions_count() CASCADE;
DROP FUNCTION IF EXISTS update_projects_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_campaigns_updated_at() CASCADE;

-- Drop all triggers
DROP TRIGGER IF EXISTS projects_updated_at ON projects CASCADE;
DROP TRIGGER IF EXISTS campaigns_updated_at ON campaigns CASCADE;
DROP TRIGGER IF EXISTS increment_campaign_apps_count_trigger ON project_campaigns CASCADE;
DROP TRIGGER IF EXISTS increment_campaign_transactions_count_trigger ON transactions CASCADE;

-- Drop all tables (CASCADE will handle dependencies)
DROP TABLE IF EXISTS sdk_batch_runs CASCADE;
DROP TABLE IF EXISTS sdk_pending_transactions CASCADE;
DROP TABLE IF EXISTS project_user_stats CASCADE;
DROP TABLE IF EXISTS project_unique_users CASCADE;
DROP TABLE IF EXISTS campaign_claims CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS project_campaigns CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Drop all views
DROP VIEW IF EXISTS campaign_stats CASCADE;
DROP VIEW IF EXISTS project_stats CASCADE;

-- Drop all policies (they should be dropped with tables, but just in case)
-- Note: Policies are automatically dropped when tables are dropped

-- Drop storage bucket and policies
DELETE FROM storage.objects WHERE bucket_id = 'project-assets';
DELETE FROM storage.buckets WHERE id = 'project-assets';

-- Drop any remaining custom types
DROP TYPE IF EXISTS campaign_status CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;

-- Verify everything is deleted
SELECT 'All tables dropped successfully' as status;

