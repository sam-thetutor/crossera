-- Fix database functions with correct data types
-- Run this in Supabase SQL Editor to fix the function return type issues

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_user_total_rewards(character varying) CASCADE;
DROP FUNCTION IF EXISTS get_project_stats(character varying) CASCADE;
DROP FUNCTION IF EXISTS get_campaign_claims_data(integer,character varying) CASCADE;

-- Fix 1: get_user_total_rewards function with correct return types
CREATE OR REPLACE FUNCTION get_user_total_rewards(
    p_user_address VARCHAR(42)
)
RETURNS TABLE (
    total_claimed VARCHAR(78),
    total_claimable VARCHAR(78),
    total_campaigns INTEGER,
    total_apps INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(cc.claim_amount::NUMERIC), 0)::VARCHAR(78) as total_claimed,
        '0'::VARCHAR(78) as total_claimable, -- Will be calculated from smart contract
        COUNT(DISTINCT cc.campaign_id)::INTEGER as total_campaigns,
        COUNT(DISTINCT cc.app_id)::INTEGER as total_apps
    FROM campaign_claims cc
    WHERE cc.claimed_by = p_user_address;
END;
$$ LANGUAGE plpgsql;

-- Fix 2: get_project_stats function with correct return types
CREATE OR REPLACE FUNCTION get_project_stats(p_owner_address VARCHAR(42) DEFAULT NULL)
RETURNS TABLE (
    app_id VARCHAR(32),
    app_name VARCHAR(255),
    owner_address VARCHAR(42),
    category VARCHAR(100),
    campaign_count BIGINT,
    transaction_count BIGINT,
    total_rewards VARCHAR(78),
    total_volume VARCHAR(78),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.app_id,
        p.app_name,
        p.owner_address,
        p.category,
        COUNT(DISTINCT pc.campaign_id) as campaign_count,
        COUNT(DISTINCT t.id) as transaction_count,
        COALESCE(SUM(cc.claim_amount::NUMERIC), 0)::VARCHAR(78) as total_rewards,
        COALESCE(SUM(t.amount::NUMERIC), 0)::VARCHAR(78) as total_volume,
        p.created_at
    FROM projects p
    LEFT JOIN project_campaigns pc ON p.id = pc.project_id
    LEFT JOIN transactions t ON p.id = t.project_id
    LEFT JOIN campaign_claims cc ON p.app_id = cc.app_id
    WHERE (p_owner_address IS NULL OR p.owner_address = p_owner_address)
    GROUP BY p.app_id, p.app_name, p.owner_address, p.category, p.created_at
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Fix 3: get_campaign_claims_data function with correct return types
CREATE OR REPLACE FUNCTION get_campaign_claims_data(
    p_campaign_id INTEGER,
    p_user_address VARCHAR(42)
)
RETURNS TABLE (
    app_id VARCHAR(32),
    app_name VARCHAR(255),
    project_id UUID,
    estimated_reward VARCHAR(78),
    already_claimed BOOLEAN,
    claim_tx_hash VARCHAR(66),
    claimed_amount VARCHAR(78)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.app_id,
        p.app_name,
        p.id as project_id,
        '0'::VARCHAR(78) as estimated_reward, -- Will be calculated from smart contract
        CASE WHEN cc.claim_tx_hash IS NOT NULL THEN TRUE ELSE FALSE END as already_claimed,
        cc.claim_tx_hash,
        cc.claim_amount
    FROM projects p
    INNER JOIN project_campaigns pc ON p.id = pc.project_id
    LEFT JOIN campaign_claims cc ON cc.app_id = p.app_id AND cc.campaign_id = p_campaign_id
    WHERE pc.campaign_id = p_campaign_id
    AND p.owner_address = p_user_address
    AND p.blockchain_tx_hash IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Test the functions to make sure they work
SELECT 'Functions fixed successfully' as status;

-- Test get_user_total_rewards
SELECT * FROM get_user_total_rewards('0x7818CEd1298849B47a9B56066b5adc72CDDAf733');

-- Test get_project_stats
SELECT * FROM get_project_stats();

-- Test get_campaign_claims_data
SELECT * FROM get_campaign_claims_data(1, '0x7818CEd1298849B47a9B56066b5adc72CDDAf733');

