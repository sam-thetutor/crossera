-- Fix the get_user_total_rewards function to match API expectations
-- Run this in Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS get_user_total_rewards(character varying) CASCADE;

-- Create the function with the correct return field names that the API expects
CREATE OR REPLACE FUNCTION get_user_total_rewards(
    p_user_address VARCHAR(42)
)
RETURNS TABLE (
    total_rewards VARCHAR(78),
    total_claims INTEGER,
    total_fees_generated VARCHAR(78),
    total_volume_generated VARCHAR(78)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(cc.claim_amount::NUMERIC), 0)::VARCHAR(78) as total_rewards,
        COUNT(DISTINCT cc.id)::INTEGER as total_claims,
        '0'::VARCHAR(78) as total_fees_generated, -- Will be calculated from transactions
        '0'::VARCHAR(78) as total_volume_generated -- Will be calculated from transactions
    FROM campaign_claims cc
    WHERE cc.claimed_by = p_user_address;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_user_total_rewards('0x7818ced1298849b47a9b56066b5adc72cddaf733');

