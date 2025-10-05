-- Unique User Tracking Schema - Off-Chain Implementation
-- Run this in your Supabase SQL Editor

-- 1. Add user tracking fields to existing transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_address VARCHAR(42);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_unique_user BOOLEAN DEFAULT FALSE;

-- 2. Create unique users per project tracking table
CREATE TABLE IF NOT EXISTS project_unique_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_address VARCHAR(42) NOT NULL,
    first_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_transactions INTEGER DEFAULT 1,
    total_volume VARCHAR(50) DEFAULT '0',
    total_fees VARCHAR(50) DEFAULT '0',
    total_rewards VARCHAR(50) DEFAULT '0',
    
    -- Constraints
    CONSTRAINT unique_project_user UNIQUE(project_id, user_address),
    CONSTRAINT valid_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$')
);

-- 3. Create project user statistics aggregation table
CREATE TABLE IF NOT EXISTS project_user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    unique_users_count INTEGER DEFAULT 0,
    total_users_transactions INTEGER DEFAULT 0,
    total_users_volume VARCHAR(50) DEFAULT '0',
    total_users_fees VARCHAR(50) DEFAULT '0',
    total_users_rewards VARCHAR(50) DEFAULT '0',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_project_stats UNIQUE(project_id)
);

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_address ON transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_project_unique_users_project ON project_unique_users(project_id);
CREATE INDEX IF NOT EXISTS idx_project_unique_users_address ON project_unique_users(user_address);
CREATE INDEX IF NOT EXISTS idx_project_unique_users_first_tx ON project_unique_users(first_transaction_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_user_stats_project ON project_user_stats(project_id);

-- 5. Database functions for unique user management

-- Function to increment unique users count
CREATE OR REPLACE FUNCTION increment_unique_users_count(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO project_user_stats (project_id, unique_users_count, total_users_transactions)
    VALUES (p_project_id, 1, 1)
    ON CONFLICT (project_id)
    DO UPDATE SET 
        unique_users_count = project_user_stats.unique_users_count + 1,
        total_users_transactions = project_user_stats.total_users_transactions + 1,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update existing user stats
CREATE OR REPLACE FUNCTION update_existing_user_stats(
    p_project_id UUID,
    p_user_address VARCHAR(42),
    p_transaction_volume VARCHAR(50),
    p_transaction_fees VARCHAR(50),
    p_transaction_rewards VARCHAR(50)
)
RETURNS VOID AS $$
BEGIN
    UPDATE project_unique_users
    SET 
        last_transaction_at = NOW(),
        total_transactions = total_transactions + 1,
        total_volume = (total_volume::NUMERIC + p_transaction_volume::NUMERIC)::TEXT,
        total_fees = (total_fees::NUMERIC + p_transaction_fees::NUMERIC)::TEXT,
        total_rewards = (total_rewards::NUMERIC + p_transaction_rewards::NUMERIC)::TEXT
    WHERE project_id = p_project_id AND user_address = p_user_address;
    
    -- Update project stats
    UPDATE project_user_stats
    SET 
        total_users_transactions = total_users_transactions + 1,
        total_users_volume = (total_users_volume::NUMERIC + p_transaction_volume::NUMERIC)::TEXT,
        total_users_fees = (total_users_fees::NUMERIC + p_transaction_fees::NUMERIC)::TEXT,
        total_users_rewards = (total_users_rewards::NUMERIC + p_transaction_rewards::NUMERIC)::TEXT,
        last_updated = NOW()
    WHERE project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to insert new unique user
CREATE OR REPLACE FUNCTION insert_new_unique_user(
    p_project_id UUID,
    p_user_address VARCHAR(42),
    p_transaction_volume VARCHAR(50),
    p_transaction_fees VARCHAR(50),
    p_transaction_rewards VARCHAR(50)
)
RETURNS VOID AS $$
BEGIN
    -- Insert new unique user
    INSERT INTO project_unique_users (
        project_id, 
        user_address, 
        first_transaction_at, 
        last_transaction_at,
        total_transactions,
        total_volume,
        total_fees,
        total_rewards
    ) VALUES (
        p_project_id, 
        p_user_address, 
        NOW(), 
        NOW(),
        1,
        p_transaction_volume,
        p_transaction_fees,
        p_transaction_rewards
    );
    
    -- Update project stats
    INSERT INTO project_user_stats (project_id, unique_users_count, total_users_transactions, total_users_volume, total_users_fees, total_users_rewards)
    VALUES (p_project_id, 1, 1, p_transaction_volume, p_transaction_fees, p_transaction_rewards)
    ON CONFLICT (project_id)
    DO UPDATE SET 
        unique_users_count = project_user_stats.unique_users_count + 1,
        total_users_transactions = project_user_stats.total_users_transactions + 1,
        total_users_volume = (project_user_stats.total_users_volume::NUMERIC + p_transaction_volume::NUMERIC)::TEXT,
        total_users_fees = (project_user_stats.total_users_fees::NUMERIC + p_transaction_fees::NUMERIC)::TEXT,
        total_users_rewards = (project_user_stats.total_users_rewards::NUMERIC + p_transaction_rewards::NUMERIC)::TEXT,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. Row Level Security (RLS) Policies
ALTER TABLE project_unique_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_user_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read project unique users
CREATE POLICY "Project unique users are viewable by everyone"
    ON project_unique_users FOR SELECT
    USING (true);

-- Policy: Anyone can read project user stats
CREATE POLICY "Project user stats are viewable by everyone"
    ON project_user_stats FOR SELECT
    USING (true);

-- Policy: Service role can insert/update project unique users
CREATE POLICY "Service role can manage project unique users"
    ON project_unique_users FOR ALL
    USING (true);

-- Policy: Service role can insert/update project user stats
CREATE POLICY "Service role can manage project user stats"
    ON project_user_stats FOR ALL
    USING (true);

-- 7. Views for analytics
CREATE OR REPLACE VIEW project_user_analytics AS
SELECT 
    p.id as project_id,
    p.app_id,
    p.app_name,
    p.owner_address,
    p.category,
    
    -- User metrics
    COALESCE(pus.unique_users_count, 0) as unique_users_count,
    COALESCE(pus.total_users_transactions, 0) as total_users_transactions,
    COALESCE(pus.total_users_volume, '0') as total_users_volume,
    COALESCE(pus.total_users_fees, '0') as total_users_fees,
    COALESCE(pus.total_users_rewards, '0') as total_users_rewards,
    
    -- Calculated metrics
    CASE 
        WHEN COALESCE(pus.unique_users_count, 0) > 0 
        THEN ROUND(COALESCE(pus.total_users_transactions, 0)::NUMERIC / pus.unique_users_count::NUMERIC, 2)
        ELSE 0 
    END as avg_transactions_per_user,
    
    pus.last_updated as user_stats_updated_at,
    p.created_at as project_created_at
    
FROM projects p
LEFT JOIN project_user_stats pus ON p.id = pus.project_id;

-- Success message
SELECT 'Unique user tracking schema created successfully! ✅' as status;
