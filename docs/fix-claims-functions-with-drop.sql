-- Fix Claims Functions - Run this in Supabase SQL Editor
-- This drops and recreates the functions with correct table structure

-- 1. Drop existing functions first
DROP FUNCTION IF EXISTS get_campaign_claims_data(integer, character varying);
DROP FUNCTION IF EXISTS get_user_claims_history(character varying, integer, integer);
DROP FUNCTION IF EXISTS get_user_total_rewards(character varying);

-- 2. Create get_campaign_claims_data function
CREATE OR REPLACE FUNCTION get_campaign_claims_data(
    p_campaign_id INTEGER,
    p_user_address VARCHAR(42)
)
RETURNS TABLE (
    app_id VARCHAR(32),
    app_name VARCHAR(100),
    project_id UUID,
    fees_generated VARCHAR(50),
    volume_generated VARCHAR(50),
    estimated_reward VARCHAR(50),
    can_claim BOOLEAN,
    already_claimed BOOLEAN,
    claim_amount VARCHAR(50),
    claim_tx_hash VARCHAR(66),
    claimed_at TIMESTAMP WITH TIME ZONE,
    campaign_active BOOLEAN,
    campaign_ended BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.app_id,
        p.app_name,
        p.id as project_id,
        COALESCE(tx_metrics.total_fees, '0') as fees_generated,
        COALESCE(tx_metrics.total_volume, '0') as volume_generated,
        COALESCE(tx_metrics.estimated_reward, '0') as estimated_reward,
        CASE 
            WHEN c.active = false OR 
                 EXTRACT(EPOCH FROM NOW()) < c.start_date OR 
                 EXTRACT(EPOCH FROM NOW()) > c.end_date THEN false
            ELSE true
        END as can_claim,
        CASE WHEN cc.id IS NOT NULL THEN true ELSE false END as already_claimed,
        COALESCE(cc.claim_amount, '0') as claim_amount,
        cc.claim_tx_hash,
        cc.claimed_at,
        CASE 
            WHEN c.active = true AND 
                 EXTRACT(EPOCH FROM NOW()) >= c.start_date AND 
                 EXTRACT(EPOCH FROM NOW()) <= c.end_date THEN true
            ELSE false
        END as campaign_active,
        CASE 
            WHEN c.active = true AND EXTRACT(EPOCH FROM NOW()) > c.end_date THEN true
            ELSE false
        END as campaign_ended
    FROM 
        projects p
    JOIN 
        campaigns c ON c.id = p_campaign_id
    LEFT JOIN 
        campaign_claims cc ON cc.app_id = p.app_id AND cc.campaign_id = p_campaign_id
    LEFT JOIN (
        SELECT 
            t.app_id,
            SUM(CAST(t.fee_generated AS NUMERIC)) as total_fees,
            SUM(CAST(t.amount AS NUMERIC)) as total_volume,
            -- Calculate estimated reward: 70% of fees + 30% of volume
            SUM(CAST(t.fee_generated AS NUMERIC) * 0.7 + CAST(t.amount AS NUMERIC) * 0.3) as estimated_reward
        FROM 
            transactions t
        WHERE 
            t.app_id IN (
                SELECT app_id 
                FROM projects 
                WHERE created_by = p_user_address
            )
        GROUP BY t.app_id
    ) tx_metrics ON tx_metrics.app_id = p.app_id
    WHERE 
        p.created_by = p_user_address
        AND p.app_id = ANY(c.registered_apps)
    ORDER BY 
        CAST(tx_metrics.estimated_reward AS NUMERIC) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create get_user_claims_history function
CREATE OR REPLACE FUNCTION get_user_claims_history(
    p_user_address VARCHAR(42),
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    app_id VARCHAR(32),
    app_name VARCHAR(100),
    campaign_id INTEGER,
    campaign_name VARCHAR(100),
    claim_amount VARCHAR(50),
    claim_tx_hash VARCHAR(66),
    claimed_at TIMESTAMP WITH TIME ZONE,
    total_claims INTEGER
) AS $$
DECLARE
    total_count INTEGER;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count
    FROM campaign_claims cc
    JOIN projects p ON cc.app_id = p.app_id
    WHERE p.created_by = p_user_address;
    
    RETURN QUERY
    SELECT 
        cc.id,
        cc.app_id,
        p.app_name,
        cc.campaign_id,
        c.name as campaign_name,
        cc.claim_amount,
        cc.claim_tx_hash,
        cc.claimed_at,
        total_count
    FROM 
        campaign_claims cc
    JOIN 
        projects p ON cc.app_id = p.app_id
    JOIN 
        campaigns c ON c.id = cc.campaign_id
    WHERE 
        p.created_by = p_user_address
    ORDER BY 
        cc.claimed_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create get_user_total_rewards function
CREATE OR REPLACE FUNCTION get_user_total_rewards(
    p_user_address VARCHAR(42)
)
RETURNS TABLE (
    total_rewards VARCHAR(50),
    total_claims INTEGER,
    total_fees_generated VARCHAR(50),
    total_volume_generated VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CAST(cc.claim_amount AS NUMERIC)), 0)::TEXT as total_rewards,
        COUNT(cc.id)::INTEGER as total_claims,
        COALESCE(SUM(CAST(t.fee_generated AS NUMERIC)), 0)::TEXT as total_fees_generated,
        COALESCE(SUM(CAST(t.amount AS NUMERIC)), 0)::TEXT as total_volume_generated
    FROM 
        campaign_claims cc
    JOIN 
        projects p ON cc.app_id = p.app_id
    LEFT JOIN 
        transactions t ON t.app_id = cc.app_id
    WHERE 
        p.created_by = p_user_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION get_campaign_claims_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_claims_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_total_rewards TO authenticated;
