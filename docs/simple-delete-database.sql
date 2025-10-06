-- Simple Database Deletion Script
-- This script will cleanly delete everything without errors
-- Run this in Supabase SQL Editor

-- Drop the entire public schema and recreate it
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Grant permissions back to the schema
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Clean up storage bucket if it exists
DELETE FROM storage.objects WHERE bucket_id = 'project-assets';
DELETE FROM storage.buckets WHERE id = 'project-assets';

-- Verify deletion
SELECT 'Database completely deleted and schema recreated' as status;

