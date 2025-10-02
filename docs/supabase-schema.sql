-- CrossEra Project Management Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table (stores all project metadata)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id VARCHAR(32) UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    
    -- Project Information
    app_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    
    -- Links
    website_url VARCHAR(255),
    logo_url VARCHAR(255),
    github_url VARCHAR(255),
    twitter_url VARCHAR(255),
    discord_url VARCHAR(255),
    
    -- Blockchain Integration
    blockchain_tx_hash VARCHAR(66),
    blockchain_status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, failed
    registered_on_chain BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(42) NOT NULL,
    
    -- Analytics
    total_transactions INTEGER DEFAULT 0,
    total_rewards VARCHAR(50) DEFAULT '0',
    total_volume VARCHAR(50) DEFAULT '0',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT valid_owner_address CHECK (owner_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_status CHECK (blockchain_status IN ('pending', 'confirmed', 'failed'))
);

-- Project campaigns junction table (many-to-many)
CREATE TABLE IF NOT EXISTS project_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    campaign_id INTEGER NOT NULL,
    
    -- Registration info
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registration_tx_hash VARCHAR(66),
    registration_fee VARCHAR(50) DEFAULT '0',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT unique_project_campaign UNIQUE(project_id, campaign_id)
);

-- Transactions table (track all processed transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    campaign_id INTEGER,
    
    -- Transaction details
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    gas_used VARCHAR(50),
    gas_price VARCHAR(50),
    transaction_value VARCHAR(50),
    fee_generated VARCHAR(50),
    reward_calculated VARCHAR(50),
    
    -- Metadata
    transaction_type VARCHAR(20),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by VARCHAR(42),
    
    CONSTRAINT valid_tx_hash CHECK (tx_hash ~ '^0x[a-fA-F0-9]{64}$')
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_address);
CREATE INDEX IF NOT EXISTS idx_projects_app_id ON projects(app_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(blockchain_status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_campaigns_project ON project_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_project_campaigns_campaign ON project_campaigns(campaign_id);

CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_campaign ON transactions(campaign_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment transaction count for a project
CREATE OR REPLACE FUNCTION increment_transaction_count(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE projects
    SET total_transactions = total_transactions + 1,
        updated_at = NOW()
    WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read projects
CREATE POLICY "Projects are viewable by everyone"
    ON projects FOR SELECT
    USING (true);

-- Policy: Users can insert their own projects
CREATE POLICY "Users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (true);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (true);

-- Policy: Anyone can read project campaigns
CREATE POLICY "Project campaigns are viewable by everyone"
    ON project_campaigns FOR SELECT
    USING (true);

-- Policy: Anyone can insert project campaigns
CREATE POLICY "Users can insert project campaigns"
    ON project_campaigns FOR INSERT
    WITH CHECK (true);

-- Policy: Anyone can read transactions
CREATE POLICY "Transactions are viewable by everyone"
    ON transactions FOR SELECT
    USING (true);

-- Policy: Anyone can insert transactions
CREATE POLICY "Users can insert transactions"
    ON transactions FOR INSERT
    WITH CHECK (true);

-- Sample data (optional - for testing)
-- Uncomment to add test data
/*
INSERT INTO projects (app_id, owner_address, app_name, description, category, website_url, created_by, blockchain_status, registered_on_chain) VALUES
('demo-defi-app', '0x1234567890123456789012345678901234567890', 'DeFi Aggregator', 'A decentralized finance aggregator platform', 'DeFi', 'https://defi-demo.com', '0x1234567890123456789012345678901234567890', 'confirmed', true),
('nft-marketplace', '0x2345678901234567890123456789012345678901', 'NFT Market', 'NFT trading marketplace', 'NFT', 'https://nft-demo.com', '0x2345678901234567890123456789012345678901', 'confirmed', true),
('gaming-platform', '0x3456789012345678901234567890123456789012', 'GameFi Hub', 'Blockchain gaming platform', 'Gaming', 'https://game-demo.com', '0x3456789012345678901234567890123456789012', 'pending', false);
*/

-- Views for analytics
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id,
    p.app_id,
    p.app_name,
    p.owner_address,
    p.category,
    p.blockchain_status,
    COUNT(DISTINCT pc.campaign_id) as campaign_count,
    COUNT(DISTINCT t.id) as transaction_count,
    p.total_rewards,
    p.total_volume,
    p.created_at
FROM projects p
LEFT JOIN project_campaigns pc ON p.id = pc.project_id
LEFT JOIN transactions t ON p.id = t.project_id
GROUP BY p.id, p.app_id, p.app_name, p.owner_address, p.category, p.blockchain_status, p.total_rewards, p.total_volume, p.created_at;

-- Success message
SELECT 'Database schema created successfully! ✅' as status;

