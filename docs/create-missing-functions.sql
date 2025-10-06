-- Create the missing get_user_claims_history function
-- Run this in Supabase SQL Editor

-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS get_user_claims_history(character varying,integer,integer) CASCADE;

-- Create the get_user_claims_history function that the API expects
CREATE OR REPLACE FUNCTION get_user_claims_history(
    p_user_address VARCHAR(42),
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    campaign_id INTEGER,
    app_id VARCHAR(32),
    claim_amount VARCHAR(78),
    claim_tx_hash VARCHAR(66),
    claimed_at TIMESTAMP WITH TIME ZONE,
    campaign_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.campaign_id,
        cc.app_id,
        cc.claim_amount,
        cc.claim_tx_hash,
        cc.claimed_at,
        c.name as campaign_name
    FROM campaign_claims cc
    LEFT JOIN campaigns c ON cc.campaign_id = c.campaign_id
    WHERE cc.claimed_by = p_user_address
    ORDER BY cc.claimed_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_user_claims_history('0x7818ced1298849b47a9b56066b5adc72cddaf733', 10, 0);

-- Also test the total rewards function
SELECT * FROM get_user_total_rewards('0x7818ced1298849b47a9b56066b5adc72cddaf733');
