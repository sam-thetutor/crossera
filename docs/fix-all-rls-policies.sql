-- Comprehensive RLS policy fixes for CrossEra application
-- This script sets up proper RLS policies to allow the regular supabase client to work

-- =====================================================
-- CAMPAIGNS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "campaigns_update_policy" ON campaigns;
DROP POLICY IF EXISTS "campaigns_select_policy" ON campaigns;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Enable select for all users" ON campaigns;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON campaigns;

-- Create new policies for campaigns
CREATE POLICY "Enable select for all users" ON campaigns
    FOR SELECT 
    TO public
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON campaigns
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON campaigns
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- PROJECTS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable select for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update for owners" ON projects;

-- Create new policies for projects
CREATE POLICY "Enable select for all users" ON projects
    FOR SELECT 
    TO public
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON projects
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON projects
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "transactions_update_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON transactions;
DROP POLICY IF EXISTS "Enable select for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON transactions;

-- Create new policies for transactions
CREATE POLICY "Enable select for all users" ON transactions
    FOR SELECT 
    TO public
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON transactions
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON transactions
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- PROJECT_CAMPAIGNS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "project_campaigns_update_policy" ON project_campaigns;
DROP POLICY IF EXISTS "project_campaigns_select_policy" ON project_campaigns;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON project_campaigns;
DROP POLICY IF EXISTS "Enable select for all users" ON project_campaigns;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON project_campaigns;

-- Create new policies for project_campaigns
CREATE POLICY "Enable select for all users" ON project_campaigns
    FOR SELECT 
    TO public
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON project_campaigns
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON project_campaigns
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- CLAIMS TABLE (if it exists)
-- =====================================================

-- Check if claims table exists and create policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'claims') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "claims_update_policy" ON claims;
        DROP POLICY IF EXISTS "claims_select_policy" ON claims;
        DROP POLICY IF EXISTS "Enable update for authenticated users" ON claims;
        DROP POLICY IF EXISTS "Enable select for all users" ON claims;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON claims;

        -- Create new policies for claims
        EXECUTE 'CREATE POLICY "Enable select for all users" ON claims
            FOR SELECT 
            TO public
            USING (true)';

        EXECUTE 'CREATE POLICY "Enable insert for authenticated users" ON claims
            FOR INSERT 
            TO authenticated
            WITH CHECK (true)';

        EXECUTE 'CREATE POLICY "Enable update for authenticated users" ON claims
            FOR UPDATE 
            TO authenticated
            USING (true)
            WITH CHECK (true)';
    END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show all policies for verification
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename IN ('campaigns', 'projects', 'transactions', 'project_campaigns', 'claims')
ORDER BY tablename, policyname;

-- Show RLS status for all tables
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('campaigns', 'projects', 'transactions', 'project_campaigns', 'claims')
ORDER BY tablename;

