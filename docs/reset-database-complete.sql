-- Complete Database Reset Script
-- This will remove all data and reset the database to a clean state

-- =============================================================================
-- WARNING: This will delete ALL data in the database!
-- Make sure you have backups if needed before running this script.
-- =============================================================================

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS campaign_claims CASCADE;
DROP TABLE IF EXISTS sdk_pending_transactions CASCADE;
DROP TABLE IF EXISTS sdk_batch_runs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS project_unique_users CASCADE;
DROP TABLE IF EXISTS project_user_stats CASCADE;
DROP TABLE IF EXISTS project_campaign_registrations CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- =============================================================================
-- Recreate all tables with fresh schema
-- =============================================================================

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id VARCHAR(255) UNIQUE NOT NULL,
  app_name VARCHAR(255) NOT NULL,
  description TEXT,
  website_url TEXT,
  github_url TEXT,
  twitter_url TEXT,
  discord_url TEXT,
  logo_url TEXT,
  banner_url TEXT,
  category VARCHAR(100),
  owner_address VARCHAR(42) NOT NULL,
  created_by VARCHAR(42) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  banner_image_url TEXT,
  logo_url TEXT,
  category VARCHAR(100),
  total_pool NUMERIC(78, 0) DEFAULT 0,
  distributed_rewards NUMERIC(78, 0) DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  eligibility_criteria TEXT,
  terms_url TEXT,
  website_url TEXT,
  twitter_url TEXT,
  discord_url TEXT,
  registered_apps_count INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'upcoming',
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER,
  tags TEXT[],
  created_by VARCHAR(42) NOT NULL,
  blockchain_tx_hash VARCHAR(66),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Campaign Registrations table
CREATE TABLE project_campaign_registrations (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, campaign_id)
);

-- Transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  app_id VARCHAR(255) NOT NULL,
  project_id UUID REFERENCES projects(id),
  campaign_id INTEGER REFERENCES campaigns(campaign_id),
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42),
  user_address VARCHAR(42) NOT NULL,
  amount NUMERIC(78, 0) DEFAULT 0,
  gas_used NUMERIC(78, 0) DEFAULT 0,
  gas_price NUMERIC(78, 0) DEFAULT 0,
  fee_generated NUMERIC(78, 0) DEFAULT 0,
  block_number BIGINT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  process_tx_hash VARCHAR(66),
  is_unique_user BOOLEAN DEFAULT false,
  reward_calculated NUMERIC(78, 0) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Unique Users table
CREATE TABLE project_unique_users (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_address VARCHAR(42) NOT NULL,
  first_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_transactions INTEGER DEFAULT 0,
  total_volume NUMERIC(78, 0) DEFAULT 0,
  total_fees NUMERIC(78, 0) DEFAULT 0,
  total_rewards NUMERIC(78, 0) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_address)
);

-- Project User Stats table
CREATE TABLE project_user_stats (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  unique_users_count INTEGER DEFAULT 0,
  total_users_transactions INTEGER DEFAULT 0,
  total_users_volume NUMERIC(78, 0) DEFAULT 0,
  total_users_fees NUMERIC(78, 0) DEFAULT 0,
  total_users_rewards NUMERIC(78, 0) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Campaign Claims table
CREATE TABLE campaign_claims (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  app_id VARCHAR(255) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_address VARCHAR(42) NOT NULL,
  claimed_by VARCHAR(42) NOT NULL,
  claim_amount NUMERIC(78, 0) NOT NULL,
  claim_tx_hash VARCHAR(66) NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, app_id, user_address)
);

-- SDK Batch Processing tables
CREATE TABLE sdk_batch_runs (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'running',
  total_transactions INTEGER DEFAULT 0,
  processed_transactions INTEGER DEFAULT 0,
  failed_transactions INTEGER DEFAULT 0,
  skipped_transactions INTEGER DEFAULT 0,
  total_gas_used NUMERIC(78, 0) DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sdk_pending_transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  app_id VARCHAR(255) NOT NULL,
  project_id UUID REFERENCES projects(id),
  user_address VARCHAR(42) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  batch_run_id INTEGER REFERENCES sdk_batch_runs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- Create indexes for performance
-- =============================================================================

-- Projects indexes
CREATE INDEX idx_projects_app_id ON projects(app_id);
CREATE INDEX idx_projects_owner_address ON projects(owner_address);
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- Campaigns indexes
CREATE INDEX idx_campaigns_campaign_id ON campaigns(campaign_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- Transactions indexes
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_app_id ON transactions(app_id);
CREATE INDEX idx_transactions_project_id ON transactions(project_id);
CREATE INDEX idx_transactions_campaign_id ON transactions(campaign_id);
CREATE INDEX idx_transactions_user_address ON transactions(user_address);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);

-- Project Unique Users indexes
CREATE INDEX idx_project_unique_users_project_id ON project_unique_users(project_id);
CREATE INDEX idx_project_unique_users_user_address ON project_unique_users(user_address);

-- Campaign Claims indexes
CREATE INDEX idx_campaign_claims_campaign_id ON campaign_claims(campaign_id);
CREATE INDEX idx_campaign_claims_app_id ON campaign_claims(app_id);
CREATE INDEX idx_campaign_claims_user_address ON campaign_claims(user_address);

-- SDK tables indexes
CREATE INDEX idx_sdk_pending_transactions_status ON sdk_pending_transactions(status, submitted_at);
CREATE INDEX idx_sdk_pending_transactions_app_id ON sdk_pending_transactions(app_id);
CREATE INDEX idx_sdk_pending_transactions_project_id ON sdk_pending_transactions(project_id);
CREATE INDEX idx_sdk_batch_runs_status ON sdk_batch_runs(status);

-- =============================================================================
-- Enable Row Level Security (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_campaign_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_unique_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_batch_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_pending_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Create RLS policies
-- =============================================================================

-- Projects policies
CREATE POLICY "Allow read access to all projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access for project owners" ON projects FOR UPDATE USING (auth.role() = 'authenticated');

-- Campaigns policies
CREATE POLICY "Allow read access to all campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON campaigns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access for authenticated users" ON campaigns FOR UPDATE USING (auth.role() = 'authenticated');

-- Project Campaign Registrations policies
CREATE POLICY "Allow read access to all project_campaign_registrations" ON project_campaign_registrations FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON project_campaign_registrations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Transactions policies
CREATE POLICY "Allow read access to all transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Project Unique Users policies
CREATE POLICY "Allow read access to all project_unique_users" ON project_unique_users FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON project_unique_users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access for authenticated users" ON project_unique_users FOR UPDATE USING (auth.role() = 'authenticated');

-- Project User Stats policies
CREATE POLICY "Allow read access to all project_user_stats" ON project_user_stats FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON project_user_stats FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access for authenticated users" ON project_user_stats FOR UPDATE USING (auth.role() = 'authenticated');

-- Campaign Claims policies
CREATE POLICY "Allow read access to all campaign_claims" ON campaign_claims FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON campaign_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- SDK tables policies
CREATE POLICY "Allow read access to all sdk_pending_transactions" ON sdk_pending_transactions FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON sdk_pending_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow read access to all sdk_batch_runs" ON sdk_batch_runs FOR SELECT USING (true);

-- =============================================================================
-- Create database functions
-- =============================================================================

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_campaign_claims_data(integer, character varying) CASCADE;
DROP FUNCTION IF EXISTS insert_new_unique_user(UUID, VARCHAR(42), NUMERIC(78, 0), NUMERIC(78, 0), NUMERIC(78, 0)) CASCADE;
DROP FUNCTION IF EXISTS update_existing_user_stats(UUID, VARCHAR(42), NUMERIC(78, 0), NUMERIC(78, 0), NUMERIC(78, 0)) CASCADE;

-- Function to insert new unique user
CREATE OR REPLACE FUNCTION insert_new_unique_user(
  p_project_id UUID,
  p_user_address VARCHAR(42),
  p_transaction_volume NUMERIC(78, 0),
  p_transaction_fees NUMERIC(78, 0),
  p_transaction_rewards NUMERIC(78, 0)
) RETURNS VOID AS $$
BEGIN
  -- Insert new unique user
  INSERT INTO project_unique_users (
    project_id, user_address, total_transactions, total_volume, total_fees, total_rewards
  ) VALUES (
    p_project_id, p_user_address, 1, p_transaction_volume, p_transaction_fees, p_transaction_rewards
  );
  
  -- Update or insert project stats
  INSERT INTO project_user_stats (
    project_id, unique_users_count, total_users_transactions, total_users_volume, total_users_fees, total_users_rewards
  ) VALUES (
    p_project_id, 1, 1, p_transaction_volume, p_transaction_fees, p_transaction_rewards
  )
  ON CONFLICT (project_id) DO UPDATE SET
    unique_users_count = project_user_stats.unique_users_count + 1,
    total_users_transactions = project_user_stats.total_users_transactions + 1,
    total_users_volume = project_user_stats.total_users_volume + p_transaction_volume,
    total_users_fees = project_user_stats.total_users_fees + p_transaction_fees,
    total_users_rewards = project_user_stats.total_users_rewards + p_transaction_rewards,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update existing user stats
CREATE OR REPLACE FUNCTION update_existing_user_stats(
  p_project_id UUID,
  p_user_address VARCHAR(42),
  p_transaction_volume NUMERIC(78, 0),
  p_transaction_fees NUMERIC(78, 0),
  p_transaction_rewards NUMERIC(78, 0)
) RETURNS VOID AS $$
BEGIN
  -- Update user stats
  UPDATE project_unique_users SET
    last_transaction_at = NOW(),
    total_transactions = total_transactions + 1,
    total_volume = total_volume + p_transaction_volume,
    total_fees = total_fees + p_transaction_fees,
    total_rewards = total_rewards + p_transaction_rewards,
    updated_at = NOW()
  WHERE project_id = p_project_id AND user_address = p_user_address;
  
  -- Update project stats
  UPDATE project_user_stats SET
    total_users_transactions = total_users_transactions + 1,
    total_users_volume = total_users_volume + p_transaction_volume,
    total_users_fees = total_users_fees + p_transaction_fees,
    total_users_rewards = total_users_rewards + p_transaction_rewards,
    updated_at = NOW()
  WHERE project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get campaign claims data
CREATE OR REPLACE FUNCTION get_campaign_claims_data(
  p_campaign_id INTEGER,
  p_user_address VARCHAR(42)
) RETURNS TABLE (
  app_id VARCHAR(255),
  app_name VARCHAR(255),
  project_id UUID,
  total_fees NUMERIC(78, 0),
  total_volume NUMERIC(78, 0),
  estimated_reward NUMERIC(78, 0),
  can_claim BOOLEAN,
  claim_status VARCHAR(20),
  claim_amount NUMERIC(78, 0),
  claim_tx_hash VARCHAR(66),
  claimed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.app_id,
    p.app_name,
    p.id as project_id,
    COALESCE(t.fee_generated, 0) as total_fees,
    COALESCE(t.amount, 0) as total_volume,
    COALESCE(t.reward_calculated, 0) as estimated_reward,
    CASE 
      WHEN cc.id IS NOT NULL THEN false
      WHEN c.end_date > NOW() THEN false
      ELSE true
    END as can_claim,
    CASE 
      WHEN cc.id IS NOT NULL THEN 'claimed'
      WHEN c.end_date > NOW() THEN 'campaign_active'
      ELSE 'claimable'
    END as claim_status,
    COALESCE(cc.claim_amount, 0) as claim_amount,
    COALESCE(cc.claim_tx_hash, '') as claim_tx_hash,
    cc.claimed_at
  FROM projects p
  LEFT JOIN transactions t ON p.id = t.project_id AND t.campaign_id = p_campaign_id
  LEFT JOIN campaign_claims cc ON p.id = cc.project_id AND cc.campaign_id = p_campaign_id AND cc.user_address = p_user_address
  LEFT JOIN campaigns c ON c.campaign_id = p_campaign_id
  WHERE p.owner_address = p_user_address
  GROUP BY p.app_id, p.app_name, p.id, cc.id, cc.claim_amount, cc.claim_tx_hash, cc.claimed_at, c.end_date;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Reset complete
-- =============================================================================

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'Database reset completed successfully!';
  RAISE NOTICE 'All tables have been dropped and recreated with fresh schema.';
  RAISE NOTICE 'All indexes, RLS policies, and functions have been recreated.';
  RAISE NOTICE 'The database is now ready for fresh data.';
END $$;
