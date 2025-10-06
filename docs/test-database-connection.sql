-- Test database connection and basic queries
-- Run this in Supabase SQL Editor

-- Test basic table access
SELECT 'Testing table access...' as status;

-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Test basic query on campaigns table
SELECT COUNT(*) as campaign_count FROM campaigns;

-- Test basic query on projects table
SELECT COUNT(*) as project_count FROM projects;

-- Test function calls
SELECT 'Testing functions...' as status;
SELECT * FROM get_user_total_rewards('0x7818ced1298849b47a9b56066b5adc72cddaf733');

-- Check RLS status
SELECT 'Checking RLS status...' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

