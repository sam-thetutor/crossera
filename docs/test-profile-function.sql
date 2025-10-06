-- Test the get_user_total_rewards function directly
-- Run this in Supabase SQL Editor

-- Test with the user address
SELECT * FROM get_user_total_rewards('0x7818ced1298849b47a9b56066b5adc72cddaf733');

-- Test with a different case
SELECT * FROM get_user_total_rewards('0x7818CEd1298849B47a9B56066b5adc72CDDAf733');

-- Check if there are any claims in the database
SELECT COUNT(*) as total_claims FROM campaign_claims;

-- Check if there are any claims for this specific user
SELECT COUNT(*) as user_claims FROM campaign_claims 
WHERE claimed_by = '0x7818ced1298849b47a9b56066b5adc72cddaf733';

