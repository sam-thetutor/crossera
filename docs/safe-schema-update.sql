-- Safe Schema Update for CrossEra Database
-- This version handles existing policies and constraints gracefully
-- Run this in your Supabase SQL Editor

-- ==============================================
-- 1. UPDATE TRANSACTIONS TABLE
-- ==============================================

-- Add all missing columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS app_id VARCHAR(32),
ADD COLUMN IF NOT EXISTS from_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS to_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS user_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS block_number BIGINT,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'processed',
ADD COLUMN IF NOT EXISTS process_tx_hash VARCHAR(66),
ADD COLUMN IF NOT EXISTS is_unique_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS amount VARCHAR(50);

-- Handle transaction_value -> amount migration
DO $$ 
BEGIN
    -- If transaction_value exists and amount doesn't, copy the data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'transaction_value') THEN
        UPDATE transactions SET amount = transaction_value WHERE amount IS NULL AND transaction_value IS NOT NULL;
    END IF;
    
    -- If transaction_value exists and we've copied the data, drop the old column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'transaction_value') THEN
        ALTER TABLE transactions DROP COLUMN transaction_value;
    END IF;
END $$;

-- ==============================================
-- 2. CREATE UNIQUE USER TRACKING TABLES
-- ==============================================

-- Create unique users per project tracking table
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
    
    CONSTRAINT unique_project_user UNIQUE(project_id, user_address),
    CONSTRAINT valid_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$')
);

-- Create project user statistics aggregation table
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

-- ==============================================
-- 3. ADD CONSTRAINTS (Safe version)
-- ==============================================

-- Add constraints for transactions table (using DO block to handle IF NOT EXISTS)
DO $$ 
BEGIN
    -- Add constraints only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'valid_from_address' AND table_name = 'transactions') THEN
        ALTER TABLE transactions ADD CONSTRAINT valid_from_address CHECK (from_address IS NULL OR from_address ~ '^0x[a-fA-F0-9]{40}$');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'valid_to_address' AND table_name = 'transactions') THEN
        ALTER TABLE transactions ADD CONSTRAINT valid_to_address CHECK (to_address IS NULL OR to_address ~ '^0x[a-fA-F0-9]{40}$');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'valid_user_address' AND table_name = 'transactions') THEN
        ALTER TABLE transactions ADD CONSTRAINT valid_user_address CHECK (user_address IS NULL OR user_address ~ '^0x[a-fA-F0-9]{40}$');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'valid_process_tx_hash' AND table_name = 'transactions') THEN
        ALTER TABLE transactions ADD CONSTRAINT valid_process_tx_hash CHECK (process_tx_hash IS NULL OR process_tx_hash ~ '^0x[a-fA-F0-9]{64}$');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'valid_status' AND table_name = 'transactions') THEN
        ALTER TABLE transactions ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'processed', 'failed'));
    END IF;
END $$;

-- ==============================================
-- 4. CREATE INDEXES
-- ==============================================

-- Indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_app_id ON transactions(app_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_address ON transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_process_tx_hash ON transactions(process_tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_is_unique_user ON transactions(is_unique_user);

-- Indexes for unique user tracking
CREATE INDEX IF NOT EXISTS idx_project_unique_users_project ON project_unique_users(project_id);
CREATE INDEX IF NOT EXISTS idx_project_unique_users_address ON project_unique_users(user_address);
CREATE INDEX IF NOT EXISTS idx_project_unique_users_first_tx ON project_unique_users(first_transaction_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_user_stats_project ON project_user_stats(project_id);

-- ==============================================
-- 5. CREATE DATABASE FUNCTIONS
-- ==============================================

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
        total_volume, 
        total_fees, 
        total_rewards
    ) VALUES (
        p_project_id, 
        p_user_address, 
        p_transaction_volume, 
        p_transaction_fees, 
        p_transaction_rewards
    );
    
    -- Update or insert project stats
    INSERT INTO project_user_stats (
        project_id, 
        unique_users_count, 
        total_users_transactions, 
        total_users_volume, 
        total_users_fees, 
        total_users_rewards
    ) VALUES (
        p_project_id, 
        1, 
        1, 
        p_transaction_volume, 
        p_transaction_fees, 
        p_transaction_rewards
    )
    ON CONFLICT (project_id) 
    DO UPDATE SET
        unique_users_count = project_user_stats.unique_users_count + 1,
        total_users_transactions = project_user_stats.total_users_transactions + 1,
        total_users_volume = (
            CAST(project_user_stats.total_users_volume AS NUMERIC) + CAST(p_transaction_volume AS NUMERIC)
        )::TEXT,
        total_users_fees = (
            CAST(project_user_stats.total_users_fees AS NUMERIC) + CAST(p_transaction_fees AS NUMERIC)
        )::TEXT,
        total_users_rewards = (
            CAST(project_user_stats.total_users_rewards AS NUMERIC) + CAST(p_transaction_rewards AS NUMERIC)
        )::TEXT,
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
    -- Update existing user stats
    UPDATE project_unique_users SET
        last_transaction_at = NOW(),
        total_transactions = total_transactions + 1,
        total_volume = (
            CAST(total_volume AS NUMERIC) + CAST(p_transaction_volume AS NUMERIC)
        )::TEXT,
        total_fees = (
            CAST(total_fees AS NUMERIC) + CAST(p_transaction_fees AS NUMERIC)
        )::TEXT,
        total_rewards = (
            CAST(total_rewards AS NUMERIC) + CAST(p_transaction_rewards AS NUMERIC)
        )::TEXT
    WHERE project_id = p_project_id AND user_address = p_user_address;
    
    -- Update project stats
    UPDATE project_user_stats SET
        total_users_transactions = total_users_transactions + 1,
        total_users_volume = (
            CAST(total_users_volume AS NUMERIC) + CAST(p_transaction_volume AS NUMERIC)
        )::TEXT,
        total_users_fees = (
            CAST(total_users_fees AS NUMERIC) + CAST(p_transaction_fees AS NUMERIC)
        )::TEXT,
        total_users_rewards = (
            CAST(total_users_rewards AS NUMERIC) + CAST(p_transaction_rewards AS NUMERIC)
        )::TEXT,
        last_updated = NOW()
    WHERE project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 6. UPDATE RLS POLICIES (Safe version)
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE project_unique_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_user_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Transactions are viewable by everyone" ON transactions;
DROP POLICY IF EXISTS "Project unique users are viewable by everyone" ON project_unique_users;
DROP POLICY IF EXISTS "Users can insert project unique users" ON project_unique_users;
DROP POLICY IF EXISTS "Project user stats are viewable by everyone" ON project_user_stats;
DROP POLICY IF EXISTS "Users can insert project user stats" ON project_user_stats;

-- Recreate policies for transactions
CREATE POLICY "Transactions are viewable by everyone"
    ON transactions FOR SELECT
    USING (true);

CREATE POLICY "Users can insert transactions"
    ON transactions FOR INSERT
    WITH CHECK (true);

-- Policies for project_unique_users
CREATE POLICY "Project unique users are viewable by everyone"
    ON project_unique_users FOR SELECT
    USING (true);

CREATE POLICY "Users can insert project unique users"
    ON project_unique_users FOR INSERT
    WITH CHECK (true);

-- Policies for project_user_stats
CREATE POLICY "Project user stats are viewable by everyone"
    ON project_user_stats FOR SELECT
    USING (true);

CREATE POLICY "Users can insert project user stats"
    ON project_user_stats FOR INSERT
    WITH CHECK (true);

-- ==============================================
-- 7. SUCCESS MESSAGE
-- ==============================================

SELECT 'Safe schema update completed successfully! ✅' as status;
