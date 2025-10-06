-- Test database functions to verify they work correctly
-- Run this in Supabase SQL Editor to test

-- Test 1: Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 2: Check if all functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Test 3: Test the get_user_total_rewards function
SELECT * FROM get_user_total_rewards('0x7818CEd1298849B47a9B56066b5adc72CDDAf733');

-- Test 4: Test the get_project_stats function
SELECT * FROM get_project_stats();

-- Test 5: Test the get_campaign_claims_data function
SELECT * FROM get_campaign_claims_data(1, '0x7818CEd1298849B47a9B56066b5adc72CDDAf733');

-- Test 6: Check if sample campaign was created
SELECT * FROM campaigns WHERE campaign_id = 1;

-- Test 7: Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

