-- Fix RLS policies for campaigns table to allow updates
-- This allows the regular supabase client (with anon key) to update campaigns

-- First, let's see the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'campaigns';

-- Drop existing policies that might be blocking updates
DROP POLICY IF EXISTS "campaigns_update_policy" ON campaigns;
DROP POLICY IF EXISTS "campaigns_select_policy" ON campaigns;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Enable select for all users" ON campaigns;

-- Create a policy that allows all authenticated users to update campaigns
-- This is appropriate for campaign management where any authenticated user can modify campaigns
CREATE POLICY "Enable update for authenticated users" ON campaigns
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create a policy that allows all users (including anonymous) to read campaigns
-- This allows the frontend to display campaign information
CREATE POLICY "Enable select for all users" ON campaigns
    FOR SELECT 
    TO public
    USING (true);

-- Create a policy that allows authenticated users to insert campaigns
CREATE POLICY "Enable insert for authenticated users" ON campaigns
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'campaigns';

-- Test the policies by checking if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'campaigns';

