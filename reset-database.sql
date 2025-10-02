-- =====================================================
-- RESET DATABASE - Clear all data
-- =====================================================
-- Run this in Supabase SQL Editor to start fresh
-- CAUTION: This will delete ALL data from the database!

BEGIN;

-- Disable triggers temporarily to avoid conflicts
SET session_replication_role = replica;

-- Delete all data from related tables (order matters due to foreign keys)
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE project_campaigns CASCADE;
TRUNCATE TABLE campaigns CASCADE;
TRUNCATE TABLE projects CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;

-- Verify all tables are empty
SELECT 'projects' as table_name, COUNT(*) as count FROM projects
UNION ALL
SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'project_campaigns', COUNT(*) FROM project_campaigns
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;

-- Show summary
SELECT 
  '✅ Database reset complete!' as status,
  'All tables cleared. Ready for fresh data!' as message;

