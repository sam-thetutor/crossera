-- Fix Ambiguous Column References - Run this in Supabase SQL Editor
-- This fixes the "column reference 'app_id' is ambiguous" error

-- 1. Drop and recreate get_campaign_claims_data function with explicit table prefixes
DROP FUNCTION IF EXISTS get_campaign_claims_data(integer, character varying);

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
        COALESCE(tx_metrics.total_fees::VARCHAR(50), '0') as fees_generated,
        COALESCE(tx_metrics.total_volume::VARCHAR(50), '0') as volume_generated,
        COALESCE(tx_metrics.estimated_reward::VARCHAR(50), '0') as estimated_reward,
        CASE 
            WHEN c.is_active = false OR 
                 NOW() < c.start_date OR 
                 NOW() > c.end_date THEN false
            ELSE true
        END as can_claim,
        CASE WHEN cc.id IS NOT NULL THEN true ELSE false END as already_claimed,
        COALESCE(cc.claim_amount, '0') as claim_amount,
        cc.claim_tx_hash,
        cc.claimed_at,
        CASE 
            WHEN c.is_active = true AND 
                 NOW() >= c.start_date AND 
                 NOW() <= c.end_date THEN true
            ELSE false
        END as campaign_active,
        CASE 
            WHEN c.is_active = true AND NOW() > c.end_date THEN true
            ELSE false
        END as campaign_ended
    FROM 
        projects p
    JOIN 
        campaigns c ON c.campaign_id = p_campaign_id
    JOIN 
        project_campaigns pc ON pc.project_id = p.id AND pc.campaign_id = p_campaign_id
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
                SELECT p2.app_id 
                FROM projects p2 
                WHERE p2.created_by = p_user_address
            )
        GROUP BY t.app_id
    ) tx_metrics ON tx_metrics.app_id = p.app_id
    WHERE 
        p.created_by = p_user_address
    ORDER BY 
        CAST(tx_metrics.estimated_reward AS NUMERIC) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION get_campaign_claims_data TO authenticated;
