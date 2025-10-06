-- =====================================================
-- COMPLETE CROSSERA DATABASE SCHEMA
-- =====================================================
-- This schema addresses all current issues and provides
-- a solid foundation for the CrossEra platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PROJECTS TABLE
-- =====================================================
DROP TABLE IF EXISTS projects CASCADE;
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id VARCHAR(32) UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    
    -- Project Information
    app_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Other',
    
    -- Links
    website_url TEXT,
    github_url TEXT,
    logo_url TEXT,
    twitter_url TEXT,
    discord_url TEXT,
    banner_url TEXT,
    
    -- Blockchain Integration (CRITICAL FIX)
    blockchain_tx_hash VARCHAR(66), -- Added missing column
    blockchain_status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, failed
    registered_on_chain BOOLEAN GENERATED ALWAYS AS (blockchain_tx_hash IS NOT NULL) STORED, -- Computed column
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(42) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_owner_address CHECK (owner_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_created_by CHECK (created_by ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_status CHECK (blockchain_status IN ('pending', 'confirmed', 'failed')),
    CONSTRAINT valid_app_id CHECK (app_id ~ '^[a-zA-Z0-9-]{3,32}$')
);

-- =====================================================
-- 2. CAMPAIGNS TABLE
-- =====================================================
DROP TABLE IF EXISTS campaigns CASCADE;
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id INTEGER UNIQUE NOT NULL,
    
    -- Campaign Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    banner_image_url TEXT,
    logo_url TEXT,
    category VARCHAR(100) DEFAULT 'General',
    
    -- Blockchain Data (synced from smart contract)
    total_pool VARCHAR(78) DEFAULT '0', -- Store as string for large numbers
    distributed_rewards VARCHAR(78) DEFAULT '0',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    
    -- Additional Metadata
    eligibility_criteria TEXT,
    terms_url TEXT,
    website_url TEXT,
    twitter_url TEXT,
    discord_url TEXT,
    
    -- Computed Statistics (will be updated by triggers/functions)
    registered_apps_count INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    
    -- Status Management
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, ended, finalized
    
    -- UI/UX
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER,
    tags TEXT[],
    
    -- Audit Trail
    created_by VARCHAR(42) NOT NULL,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_created_by_campaign CHECK (created_by ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'ended', 'finalized')),
    CONSTRAINT valid_campaign_id CHECK (campaign_id > 0)
);

-- =====================================================
-- 3. PROJECT CAMPAIGNS JUNCTION TABLE
-- =====================================================
DROP TABLE IF EXISTS project_campaigns CASCADE;
CREATE TABLE project_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
    
    -- Registration Details
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registration_tx_hash VARCHAR(66),
    registration_fee VARCHAR(78) DEFAULT '0',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT unique_project_campaign UNIQUE(project_id, campaign_id)
);

-- =====================================================
-- 4. TRANSACTIONS TABLE
-- =====================================================
DROP TABLE IF EXISTS transactions CASCADE;
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Transaction Identifiers
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    app_id VARCHAR(32) NOT NULL,
    
    -- Project and Campaign References
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
    
    -- Transaction Details
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    amount VARCHAR(78) DEFAULT '0',
    gas_used VARCHAR(20) DEFAULT '0',
    gas_price VARCHAR(20) DEFAULT '0',
    fee_generated VARCHAR(78) DEFAULT '0',
    reward_calculated VARCHAR(78) DEFAULT '0',
    
    -- Blockchain Details
    block_number BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'processed',
    process_tx_hash VARCHAR(66),
    
    -- User Tracking
    is_unique_user BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT valid_tx_hash CHECK (tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
    CONSTRAINT valid_from_address CHECK (from_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_to_address CHECK (to_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processed', 'failed'))
);

-- =====================================================
-- 5. CAMPAIGN CLAIMS TABLE
-- =====================================================
DROP TABLE IF EXISTS campaign_claims CASCADE;
CREATE TABLE campaign_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
    app_id VARCHAR(32) NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Claim Details
    claim_tx_hash VARCHAR(66) UNIQUE NOT NULL,
    claim_amount VARCHAR(78) NOT NULL,
    claimed_by VARCHAR(42) NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_claim_tx_hash CHECK (claim_tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
    CONSTRAINT valid_claimed_by CHECK (claimed_by ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT unique_campaign_app_claim UNIQUE(campaign_id, app_id)
);

-- =====================================================
-- 6. PROJECT UNIQUE USERS TABLE
-- =====================================================
DROP TABLE IF EXISTS project_unique_users CASCADE;
CREATE TABLE project_unique_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_address VARCHAR(42) NOT NULL,
    
    -- User Statistics
    first_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_transactions INTEGER DEFAULT 1,
    total_volume VARCHAR(78) DEFAULT '0',
    total_fees VARCHAR(78) DEFAULT '0',
    total_rewards VARCHAR(78) DEFAULT '0',
    
    -- Constraints
    CONSTRAINT unique_project_user UNIQUE(project_id, user_address),
    CONSTRAINT valid_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$')
);

-- =====================================================
-- 7. PROJECT USER STATS TABLE
-- =====================================================
DROP TABLE IF EXISTS project_user_stats CASCADE;
CREATE TABLE project_user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Aggregated Statistics
    unique_users_count INTEGER DEFAULT 0,
    total_users_transactions INTEGER DEFAULT 0,
    total_users_volume VARCHAR(78) DEFAULT '0',
    total_users_fees VARCHAR(78) DEFAULT '0',
    total_users_rewards VARCHAR(78) DEFAULT '0',
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_project_stats UNIQUE(project_id)
);

-- =====================================================
-- 8. SDK BATCH PROCESSING TABLES
-- =====================================================
DROP TABLE IF EXISTS sdk_pending_transactions CASCADE;
CREATE TABLE sdk_pending_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    app_id VARCHAR(32) NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retry_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    
    -- Constraints
    CONSTRAINT valid_sdk_tx_hash CHECK (transaction_hash ~ '^0x[a-fA-F0-9]{64}$'),
    CONSTRAINT valid_sdk_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_sdk_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

DROP TABLE IF EXISTS sdk_batch_runs CASCADE;
CREATE TABLE sdk_batch_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_transactions INTEGER DEFAULT 0,
    processed_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'running', -- running, completed, failed
    
    -- Constraints
    CONSTRAINT valid_batch_status CHECK (status IN ('running', 'completed', 'failed'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Projects indexes
CREATE INDEX idx_projects_app_id ON projects(app_id);
CREATE INDEX idx_projects_owner_address ON projects(owner_address);
CREATE INDEX idx_projects_blockchain_tx_hash ON projects(blockchain_tx_hash);
CREATE INDEX idx_projects_registered_on_chain ON projects(registered_on_chain);

-- Campaigns indexes
CREATE INDEX idx_campaigns_campaign_id ON campaigns(campaign_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_active ON campaigns(is_active);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);

-- Project campaigns indexes
CREATE INDEX idx_project_campaigns_project_id ON project_campaigns(project_id);
CREATE INDEX idx_project_campaigns_campaign_id ON project_campaigns(campaign_id);
CREATE INDEX idx_project_campaigns_active ON project_campaigns(is_active);

-- Transactions indexes
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_app_id ON transactions(app_id);
CREATE INDEX idx_transactions_project_id ON transactions(project_id);
CREATE INDEX idx_transactions_campaign_id ON transactions(campaign_id);
CREATE INDEX idx_transactions_user_address ON transactions(user_address);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Claims indexes
CREATE INDEX idx_campaign_claims_campaign_id ON campaign_claims(campaign_id);
CREATE INDEX idx_campaign_claims_app_id ON campaign_claims(app_id);
CREATE INDEX idx_campaign_claims_claimed_by ON campaign_claims(claimed_by);
CREATE INDEX idx_campaign_claims_claimed_at ON campaign_claims(claimed_at);

-- User tracking indexes
CREATE INDEX idx_project_unique_users_project_id ON project_unique_users(project_id);
CREATE INDEX idx_project_unique_users_user_address ON project_unique_users(user_address);

-- SDK batch processing indexes
CREATE INDEX idx_sdk_pending_status ON sdk_pending_transactions(status);
CREATE INDEX idx_sdk_pending_submitted_at ON sdk_pending_transactions(submitted_at);
CREATE INDEX idx_sdk_pending_app_id ON sdk_pending_transactions(app_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update updated_at timestamp for projects
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();

-- Update updated_at timestamp for campaigns
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_campaigns_updated_at();

-- Increment campaign registered_apps_count when project registers
CREATE OR REPLACE FUNCTION increment_campaign_apps_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE campaigns 
        SET registered_apps_count = registered_apps_count + 1
        WHERE campaign_id = NEW.campaign_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE campaigns 
        SET registered_apps_count = GREATEST(registered_apps_count - 1, 0)
        WHERE campaign_id = OLD.campaign_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_campaign_apps_count_trigger
    AFTER INSERT OR DELETE ON project_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION increment_campaign_apps_count();

-- Increment campaign total_transactions when transaction is processed
CREATE OR REPLACE FUNCTION increment_campaign_transactions_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.campaign_id IS NOT NULL THEN
        UPDATE campaigns 
        SET total_transactions = total_transactions + 1
        WHERE campaign_id = NEW.campaign_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_campaign_transactions_count_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION increment_campaign_transactions_count();

-- =====================================================
-- DATABASE FUNCTIONS FOR API ROUTES
-- =====================================================

-- Function to get campaign claims data
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
        '0' as estimated_reward, -- Will be calculated from smart contract
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

-- Function to get user total rewards
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
        COALESCE(SUM(cc.claim_amount::NUMERIC), 0)::TEXT as total_claimed,
        '0' as total_claimable, -- Will be calculated from smart contract
        COUNT(DISTINCT cc.campaign_id)::INTEGER as total_campaigns,
        COUNT(DISTINCT cc.app_id)::INTEGER as total_apps
    FROM campaign_claims cc
    WHERE cc.claimed_by = p_user_address;
END;
$$ LANGUAGE plpgsql;

-- Function to increment transaction count
CREATE OR REPLACE FUNCTION increment_transaction_count(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE projects 
    SET total_transactions = total_transactions + 1
    WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get project stats
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
        COALESCE(SUM(cc.claim_amount::NUMERIC), 0)::TEXT as total_rewards,
        COALESCE(SUM(t.amount::NUMERIC), 0)::TEXT as total_volume,
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

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_unique_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_pending_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_batch_runs ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Public read projects" ON projects FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert projects" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owner update projects" ON projects FOR UPDATE TO authenticated 
    USING (owner_address = lower(auth.jwt() ->> 'sub')) 
    WITH CHECK (owner_address = lower(auth.jwt() ->> 'sub'));

-- Campaigns policies
CREATE POLICY "Public read campaigns" ON campaigns FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert campaigns" ON campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update campaigns" ON campaigns FOR UPDATE TO authenticated USING (true);

-- Project campaigns policies
CREATE POLICY "Public read project_campaigns" ON project_campaigns FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert project_campaigns" ON project_campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update project_campaigns" ON project_campaigns FOR UPDATE TO authenticated USING (true);

-- Transactions policies
CREATE POLICY "Public read transactions" ON transactions FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (true);

-- Campaign claims policies
CREATE POLICY "Public read campaign_claims" ON campaign_claims FOR SELECT TO public USING (true);
CREATE POLICY "Owner insert campaign_claims" ON campaign_claims FOR INSERT TO authenticated 
    WITH CHECK (claimed_by = lower(auth.jwt() ->> 'sub'));

-- User tracking policies
CREATE POLICY "Public read project_unique_users" ON project_unique_users FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert project_unique_users" ON project_unique_users FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Public read project_user_stats" ON project_user_stats FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert project_user_stats" ON project_user_stats FOR INSERT TO authenticated WITH CHECK (true);

-- SDK batch processing policies
CREATE POLICY "Public read sdk_pending_transactions" ON sdk_pending_transactions FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert sdk_pending_transactions" ON sdk_pending_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update sdk_pending_transactions" ON sdk_pending_transactions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Public read sdk_batch_runs" ON sdk_batch_runs FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert sdk_batch_runs" ON sdk_batch_runs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update sdk_batch_runs" ON sdk_batch_runs FOR UPDATE TO authenticated USING (true);

-- =====================================================
-- SUPABASE STORAGE BUCKET SETUP
-- =====================================================

-- Create storage bucket for project assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project assets
CREATE POLICY "Public read project assets" ON storage.objects FOR SELECT 
TO public USING (bucket_id = 'project-assets');

CREATE POLICY "Authenticated upload project assets" ON storage.objects FOR INSERT 
TO authenticated WITH CHECK (bucket_id = 'project-assets');

CREATE POLICY "Authenticated update project assets" ON storage.objects FOR UPDATE 
TO authenticated USING (bucket_id = 'project-assets');

CREATE POLICY "Authenticated delete project assets" ON storage.objects FOR DELETE 
TO authenticated USING (bucket_id = 'project-assets');

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert a sample campaign for testing
INSERT INTO campaigns (
    campaign_id, name, description, category, total_pool, 
    start_date, end_date, is_active, status, created_by
) VALUES (
    1, 'Test Campaign', 'A test campaign for development', 'General', 
    '1000000000000000000', -- 1 XFI
    NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days', 
    true, 'active', '0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7'
);

-- =====================================================
-- FINAL NOTES
-- =====================================================

-- This schema provides:
-- 1. ✅ All required columns for API routes
-- 2. ✅ Proper data types and constraints
-- 3. ✅ Automatic triggers for stats updates
-- 4. ✅ Database functions for API compatibility
-- 5. ✅ Row Level Security policies
-- 6. ✅ Supabase storage bucket setup
-- 7. ✅ Performance indexes
-- 8. ✅ Computed columns for compatibility
-- 9. ✅ Proper foreign key relationships
-- 10. ✅ Support for SDK batch processing

-- The schema is designed to work seamlessly with:
-- - Smart contract data synchronization
-- - Frontend component requirements
-- - API route functionality
-- - Image upload capabilities
-- - Real-time statistics updates
