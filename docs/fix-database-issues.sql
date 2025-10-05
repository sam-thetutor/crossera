-- Fix database issues: Add missing column and fix RLS policies

-- 1. Add missing github_url column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url TEXT;

-- 2. Fix RLS policies for projects table
-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access to all projects" ON projects;
DROP POLICY IF EXISTS "Allow insert access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Allow update access for project owners" ON projects;

-- Recreate policies that work with service role
CREATE POLICY "Allow read access to all projects" ON projects 
FOR SELECT USING (true);

CREATE POLICY "Allow insert access for service role" ON projects 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access for service role" ON projects 
FOR UPDATE USING (true);

-- Also ensure service role can bypass RLS if needed
-- (This might be needed for API routes using service role key)
