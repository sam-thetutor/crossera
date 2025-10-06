-- Fix permissions for project_user_stats table
-- Run this in Supabase SQL Editor

-- Grant full permissions to service_role on project_user_stats table
GRANT ALL PRIVILEGES ON TABLE project_user_stats TO service_role;

-- Grant usage on the sequence if it exists
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify the permissions
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'project_user_stats'
AND grantee = 'service_role'
ORDER BY privilege_type;

-- Test query to verify access
SELECT COUNT(*) as total_stats FROM project_user_stats;

SELECT 'project_user_stats permissions fixed' as status;

