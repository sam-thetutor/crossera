-- Quick fix for missing github_url column
-- Run this in your Supabase SQL Editor to add the missing column

ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url TEXT;
