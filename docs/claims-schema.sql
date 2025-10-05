-- Claims Feature Database Schema
-- This file adds the necessary tables and functions for tracking reward claims

-- Create campaign_claims table to track successful claims
CREATE TABLE IF NOT EXISTS campaign_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id VARCHAR(32) NOT NULL,
    campaign_id INTEGER NOT NULL,
    claim_amount VARCHAR(50) NOT NULL,
    claim_tx_hash VARCHAR(66) UNIQUE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_by VARCHAR(42) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_app_campaign_claim UNIQUE(app_id, campaign_id),
    CONSTRAINT valid_claim_amount CHECK (claim_amount ~ '^[0-9]+(\.[0-9]+)?$'),
    CONSTRAINT valid_claim_tx_hash CHECK (claim_tx_hash IS NULL OR claim_tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
    CONSTRAINT valid_claimed_by CHECK (claimed_by ~ '^0x[a-fA-F0-9]{40}$')
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaign_claims_campaign_id ON campaign_claims(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_claims_app_id ON campaign_claims(app_id);
CREATE INDEX IF NOT EXISTS idx_campaign_claims_claimed_by ON campaign_claims(claimed_by);
CREATE INDEX IF NOT EXISTS idx_campaign_claims_claimed_at ON campaign_claims(claimed_at);

-- Enable RLS (Row Level Security)
ALTER TABLE campaign_claims ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Campaign claims are viewable by everyone" ON campaign_claims;
CREATE POLICY "Campaign claims are viewable by everyone" ON campaign_claims
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own claims" ON campaign_claims;
CREATE POLICY "Users can insert their own claims" ON campaign_claims
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaign_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_campaign_claims_updated_at ON campaign_claims;
CREATE TRIGGER trigger_update_campaign_claims_updated_at
    BEFORE UPDATE ON campaign_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_claims_updated_at();

-- Create function to get campaign claims data for a specific campaign and user
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

-- Create function to get user's claims history
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

-- Create function to get user's total rewards earned
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

-- Grant necessary permissions
GRANT SELECT, INSERT ON campaign_claims TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_claims_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_claims_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_total_rewards TO authenticated;

-- Insert some sample data for testing (optional - remove in production)
-- This will be handled by the API endpoints
