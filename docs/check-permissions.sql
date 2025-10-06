-- Check current user and permissions
-- Run this in Supabase SQL Editor

-- Check current user
SELECT current_user, session_user;

-- Check table ownership
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check table privileges for service_role
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND grantee = 'service_role'
ORDER BY table_name, privilege_type;

-- Check if service_role exists
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles 
WHERE rolname = 'service_role';

-- Grant full permissions to service_role on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

SELECT 'Permissions granted to service_role' as status;

