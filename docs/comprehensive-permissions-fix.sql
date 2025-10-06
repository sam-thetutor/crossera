-- Comprehensive permissions fix for all tables
-- Run this in Supabase SQL Editor

-- First, check if the table exists
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'project_user_stats';

-- Check current permissions for project_user_stats
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'project_user_stats'
ORDER BY grantee, privilege_type;

-- Grant ALL permissions to service_role on ALL tables in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- Specifically for project_user_stats if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_user_stats') THEN
        GRANT ALL PRIVILEGES ON TABLE project_user_stats TO service_role;
        RAISE NOTICE 'Permissions granted to project_user_stats table';
    ELSE
        RAISE NOTICE 'project_user_stats table does not exist';
    END IF;
END $$;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify the fix
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'project_user_stats'
AND grantee = 'service_role'
ORDER BY privilege_type;

-- Test query
SELECT 'Testing project_user_stats access...' as status;
SELECT COUNT(*) as total_rows FROM project_user_stats;

SELECT 'Permissions fix completed' as status;

