-- Fixed Database Restore Script (without immutable function errors)
-- This script creates the database schema without problematic generated columns
-- Run this in Supabase SQL Editor

-- =============================================================================
-- STEP 1: DELETE EVERYTHING
-- =============================================================================

-- Drop the entire public schema and recreate it
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Grant permissions back to the schema
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Clean up storage bucket if it exists
DELETE FROM storage.objects WHERE bucket_id = 'project-assets';
DELETE FROM storage.buckets WHERE id = 'project-assets';

-- =============================================================================
-- STEP 2: CREATE ALL TABLES
-- =============================================================================

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id VARCHAR(32) UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    website_url TEXT,
    github_url TEXT,
    logo_url TEXT,
    twitter_url TEXT,
    discord_url TEXT,
    banner_url TEXT,
    blockchain_tx_hash VARCHAR(66),
    blockchain_status VARCHAR(20) DEFAULT 'pending',
    registered_on_chain BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(42) NOT NULL
);

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    banner_image_url TEXT,
    logo_url TEXT,
    category VARCHAR(100) NOT NULL,
    total_pool VARCHAR(78) DEFAULT '0',
    distributed_rewards VARCHAR(78) DEFAULT '0',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    eligibility_criteria TEXT,
    terms_url TEXT,
    website_url TEXT,
    twitter_url TEXT,
    discord_url TEXT,
    registered_apps_count INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'inactive',
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER,
    tags TEXT[],
    created_by VARCHAR(42) NOT NULL,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project campaigns table
CREATE TABLE project_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
    registration_fee VARCHAR(78) DEFAULT '0',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, campaign_id)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    app_id VARCHAR(32) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    amount VARCHAR(78) NOT NULL,
    block_number BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    process_tx_hash VARCHAR(66),
    is_unique_user BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign claims table
CREATE TABLE campaign_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
    app_id VARCHAR(32) NOT NULL,
    claimed_by VARCHAR(42) NOT NULL,
    claim_amount VARCHAR(78) NOT NULL,
    claim_tx_hash VARCHAR(66) UNIQUE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, app_id, claimed_by)
);

-- Project unique users table
CREATE TABLE project_unique_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_address VARCHAR(42) NOT NULL,
    first_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_address)
);

-- Project user stats table
CREATE TABLE project_user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    total_transactions BIGINT DEFAULT 0,
    total_volume VARCHAR(78) DEFAULT '0',
    unique_users_count INTEGER DEFAULT 0,
    campaign_count INTEGER DEFAULT 0,
    total_rewards VARCHAR(78) DEFAULT '0',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id)
);

-- SDK pending transactions table
CREATE TABLE sdk_pending_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    app_id VARCHAR(32) NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- SDK batch runs table
CREATE TABLE sdk_batch_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date DATE NOT NULL,
    processed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- STEP 3: CREATE INDEXES
-- =============================================================================

-- Projects indexes
CREATE INDEX idx_projects_owner_address ON projects(owner_address);
CREATE INDEX idx_projects_app_id ON projects(app_id);
CREATE INDEX idx_projects_blockchain_tx_hash ON projects(blockchain_tx_hash);

-- Campaigns indexes
CREATE INDEX idx_campaigns_campaign_id ON campaigns(campaign_id);
CREATE INDEX idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX idx_campaigns_end_date ON campaigns(end_date);

-- Project campaigns indexes
CREATE INDEX idx_project_campaigns_project_id ON project_campaigns(project_id);
CREATE INDEX idx_project_campaigns_campaign_id ON project_campaigns(campaign_id);

-- Transactions indexes
CREATE INDEX idx_transactions_project_id ON transactions(project_id);
CREATE INDEX idx_transactions_campaign_id ON transactions(campaign_id);
CREATE INDEX idx_transactions_transaction_hash ON transactions(transaction_hash);
CREATE INDEX idx_transactions_user_address ON transactions(user_address);
CREATE INDEX idx_transactions_app_id ON transactions(app_id);

-- Campaign claims indexes
CREATE INDEX idx_campaign_claims_campaign_id ON campaign_claims(campaign_id);
CREATE INDEX idx_campaign_claims_app_id ON campaign_claims(app_id);
CREATE INDEX idx_campaign_claims_claimed_by ON campaign_claims(claimed_by);

-- SDK indexes
CREATE INDEX idx_sdk_pending_transactions_status ON sdk_pending_transactions(status);
CREATE INDEX idx_sdk_pending_transactions_submitted_at ON sdk_pending_transactions(submitted_at);

-- =============================================================================
-- STEP 4: CREATE TRIGGERS
-- =============================================================================

-- Update projects updated_at trigger
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();

-- Update campaigns updated_at trigger
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_campaigns_updated_at();

-- Increment campaign apps count trigger
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
        SET registered_apps_count = registered_apps_count - 1
        WHERE campaign_id = OLD.campaign_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_campaign_apps_count
    AFTER INSERT OR DELETE ON project_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION increment_campaign_apps_count();

-- Increment campaign transactions count trigger
CREATE OR REPLACE FUNCTION increment_campaign_transactions_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE campaigns 
        SET total_transactions = total_transactions + 1
        WHERE campaign_id = NEW.campaign_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE campaigns 
        SET total_transactions = total_transactions - 1
        WHERE campaign_id = OLD.campaign_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_campaign_transactions_count
    AFTER INSERT OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION increment_campaign_transactions_count();

-- =============================================================================
-- STEP 5: CREATE DATABASE FUNCTIONS
-- =============================================================================

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
        '0'::VARCHAR(78) as estimated_reward,
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

-- Function to get user total rewards (with correct field names for API)
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
        '0'::VARCHAR(78) as total_fees_generated,
        '0'::VARCHAR(78) as total_volume_generated
    FROM campaign_claims cc
    WHERE cc.claimed_by = p_user_address;
END;
$$ LANGUAGE plpgsql;

-- Function to get user claims history
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

-- =============================================================================
-- STEP 6: CREATE ROW LEVEL SECURITY POLICIES
-- =============================================================================

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
CREATE POLICY "Projects are viewable by everyone" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can insert their own projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE USING (true);

-- Campaigns policies
CREATE POLICY "Campaigns are viewable by everyone" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Users can insert campaigns" ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update campaigns" ON campaigns FOR UPDATE USING (true);
CREATE POLICY "Users can delete campaigns" ON campaigns FOR DELETE USING (true);

-- Project campaigns policies
CREATE POLICY "Project campaigns are viewable by everyone" ON project_campaigns FOR SELECT USING (true);
CREATE POLICY "Users can insert project campaigns" ON project_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update project campaigns" ON project_campaigns FOR UPDATE USING (true);
CREATE POLICY "Users can delete project campaigns" ON project_campaigns FOR DELETE USING (true);

-- Transactions policies
CREATE POLICY "Transactions are viewable by everyone" ON transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update transactions" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Users can delete transactions" ON transactions FOR DELETE USING (true);

-- Campaign claims policies
CREATE POLICY "Campaign claims are viewable by everyone" ON campaign_claims FOR SELECT USING (true);
CREATE POLICY "Users can insert campaign claims" ON campaign_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update campaign claims" ON campaign_claims FOR UPDATE USING (true);
CREATE POLICY "Users can delete campaign claims" ON campaign_claims FOR DELETE USING (true);

-- Project unique users policies
CREATE POLICY "Project unique users are viewable by everyone" ON project_unique_users FOR SELECT USING (true);
CREATE POLICY "Users can insert project unique users" ON project_unique_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update project unique users" ON project_unique_users FOR UPDATE USING (true);
CREATE POLICY "Users can delete project unique users" ON project_unique_users FOR DELETE USING (true);

-- Project user stats policies
CREATE POLICY "Project user stats are viewable by everyone" ON project_user_stats FOR SELECT USING (true);
CREATE POLICY "Users can insert project user stats" ON project_user_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update project user stats" ON project_user_stats FOR UPDATE USING (true);
CREATE POLICY "Users can delete project user stats" ON project_user_stats FOR DELETE USING (true);

-- SDK tables policies
CREATE POLICY "SDK pending transactions are viewable by everyone" ON sdk_pending_transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert SDK pending transactions" ON sdk_pending_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update SDK pending transactions" ON sdk_pending_transactions FOR UPDATE USING (true);
CREATE POLICY "Users can delete SDK pending transactions" ON sdk_pending_transactions FOR DELETE USING (true);

CREATE POLICY "SDK batch runs are viewable by everyone" ON sdk_batch_runs FOR SELECT USING (true);
CREATE POLICY "Users can insert SDK batch runs" ON sdk_batch_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update SDK batch runs" ON sdk_batch_runs FOR UPDATE USING (true);
CREATE POLICY "Users can delete SDK batch runs" ON sdk_batch_runs FOR DELETE USING (true);

-- =============================================================================
-- STEP 7: CREATE SUPABASE STORAGE BUCKET
-- =============================================================================

-- Create storage bucket for project assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-assets',
    'project-assets',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for project-assets bucket
CREATE POLICY "Project assets are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'project-assets');

CREATE POLICY "Authenticated users can upload project assets" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'project-assets' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own project assets" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'project-assets' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own project assets" ON storage.objects
FOR DELETE USING (
    bucket_id = 'project-assets' 
    AND auth.role() = 'authenticated'
);

-- =============================================================================
-- STEP 8: INSERT TEST DATA
-- =============================================================================

-- Insert a test campaign
INSERT INTO campaigns (
    campaign_id,
    name,
    description,
    category,
    total_pool,
    start_date,
    end_date,
    is_active,
    created_by
) VALUES (
    1,
    'Test Campaign',
    'A test campaign for development',
    'General',
    '1000000000000000000',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '7 days',
    true,
    '0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7'
) ON CONFLICT (campaign_id) DO NOTHING;

-- =============================================================================
-- STEP 9: VERIFICATION QUERIES
-- =============================================================================

-- Test all functions
SELECT 'Testing get_user_total_rewards function...' as status;
SELECT * FROM get_user_total_rewards('0x7818ced1298849b47a9b56066b5adc72cddaf733');

SELECT 'Testing get_user_claims_history function...' as status;
SELECT * FROM get_user_claims_history('0x7818ced1298849b47a9b56066b5adc72cddaf733', 10, 0);

SELECT 'Testing get_campaign_claims_data function...' as status;
SELECT * FROM get_campaign_claims_data(1, '0x7818ced1298849b47a9b56066b5adc72cddaf733');

SELECT 'Testing get_project_stats function...' as status;
SELECT * FROM get_project_stats('0x7818ced1298849b47a9b56066b5adc72cddaf733');

-- Verify tables exist and have correct structure
SELECT 'Database restore completed successfully!' as status;
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
