-- Fix Return Types - Run this in Supabase SQL Editor
-- This fixes the TEXT vs VARCHAR return type mismatch

-- 1. Drop and recreate get_user_total_rewards with correct return types
DROP FUNCTION IF EXISTS get_user_total_rewards(character varying);

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
        COALESCE(SUM(CAST(cc.claim_amount AS NUMERIC)), 0)::VARCHAR(50) as total_rewards,
        COUNT(cc.id)::INTEGER as total_claims,
        COALESCE(SUM(CAST(t.fee_generated AS NUMERIC)), 0)::VARCHAR(50) as total_fees_generated,
        COALESCE(SUM(CAST(t.amount AS NUMERIC)), 0)::VARCHAR(50) as total_volume_generated
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

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION get_user_total_rewards TO authenticated;
