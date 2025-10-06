-- =====================================================
-- FIX: Submit API Errors
-- =====================================================
-- This script fixes both PGRST202 and PGRST204 errors
-- Run this in your Supabase SQL Editor

-- =====================================================
-- ERROR 1 FIX: Add missing 'fee_generated' column to transactions
-- =====================================================

-- Check if fee_generated column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'fee_generated'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN fee_generated VARCHAR(78) DEFAULT '0';
        RAISE NOTICE 'Added fee_generated column to transactions table';
    ELSE
        RAISE NOTICE 'fee_generated column already exists';
    END IF;
END $$;

-- Add other potentially missing columns for the submit API
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
ADD COLUMN IF NOT EXISTS amount VARCHAR(50),
ADD COLUMN IF NOT EXISTS reward_calculated VARCHAR(78) DEFAULT '0';

-- =====================================================
-- ERROR 2 FIX: Create unique user tracking tables
-- =====================================================

-- Create project_unique_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_unique_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_address VARCHAR(42) NOT NULL,
    first_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_transactions INTEGER DEFAULT 1,
    total_volume VARCHAR(78) DEFAULT '0',
    total_fees VARCHAR(78) DEFAULT '0',
    total_rewards VARCHAR(78) DEFAULT '0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_project_user UNIQUE(project_id, user_address),
    CONSTRAINT valid_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$')
);

-- Create project_user_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    unique_users_count INTEGER DEFAULT 0,
    total_users_transactions INTEGER DEFAULT 0,
    total_users_volume VARCHAR(78) DEFAULT '0',
    total_users_fees VARCHAR(78) DEFAULT '0',
    total_users_rewards VARCHAR(78) DEFAULT '0',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_project_stats UNIQUE(project_id)
);

-- =====================================================
-- ERROR 3 FIX: Create missing database functions
-- =====================================================

-- Function to insert new unique user and update stats
CREATE OR REPLACE FUNCTION insert_new_unique_user(
    p_project_id UUID,
    p_user_address VARCHAR(42),
    p_transaction_volume VARCHAR(78),
    p_transaction_fees VARCHAR(78),
    p_transaction_rewards VARCHAR(78)
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
    
    -- Update or insert project stats
    INSERT INTO project_user_stats (
        project_id, 
        unique_users_count, 
        total_users_transactions, 
        total_users_volume, 
        total_users_fees, 
        total_users_rewards,
        last_updated
    ) VALUES (
        p_project_id, 
        1, 
        1, 
        p_transaction_volume, 
        p_transaction_fees, 
        p_transaction_rewards,
        NOW()
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
        
    RAISE NOTICE 'New unique user inserted for project %', p_project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update existing user stats
CREATE OR REPLACE FUNCTION update_existing_user_stats(
    p_project_id UUID,
    p_user_address VARCHAR(42),
    p_transaction_volume VARCHAR(78),
    p_transaction_fees VARCHAR(78),
    p_transaction_rewards VARCHAR(78)
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
        )::TEXT,
        updated_at = NOW()
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
    
    RAISE NOTICE 'Existing user stats updated for project %', p_project_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE INDEXES for performance
-- =====================================================

-- Indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_app_id ON transactions(app_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_address ON transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_fee_generated ON transactions(fee_generated);

-- Indexes for unique user tracking
CREATE INDEX IF NOT EXISTS idx_project_unique_users_project ON project_unique_users(project_id);
CREATE INDEX IF NOT EXISTS idx_project_unique_users_address ON project_unique_users(user_address);
CREATE INDEX IF NOT EXISTS idx_project_unique_users_combo ON project_unique_users(project_id, user_address);
CREATE INDEX IF NOT EXISTS idx_project_user_stats_project ON project_user_stats(project_id);

-- =====================================================
-- ENABLE RLS AND CREATE POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE project_unique_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_user_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "project_unique_users_select_policy" ON project_unique_users;
DROP POLICY IF EXISTS "project_unique_users_insert_policy" ON project_unique_users;
DROP POLICY IF EXISTS "project_user_stats_select_policy" ON project_user_stats;
DROP POLICY IF EXISTS "project_user_stats_insert_policy" ON project_user_stats;

-- Create policies for project_unique_users
CREATE POLICY "project_unique_users_select_policy"
    ON project_unique_users FOR SELECT
    USING (true);

CREATE POLICY "project_unique_users_insert_policy"
    ON project_unique_users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "project_unique_users_update_policy"
    ON project_unique_users FOR UPDATE
    USING (true);

-- Create policies for project_user_stats
CREATE POLICY "project_user_stats_select_policy"
    ON project_user_stats FOR SELECT
    USING (true);

CREATE POLICY "project_user_stats_insert_policy"
    ON project_user_stats FOR INSERT
    WITH CHECK (true);

CREATE POLICY "project_user_stats_update_policy"
    ON project_user_stats FOR UPDATE
    USING (true);

-- =====================================================
-- REFRESH SCHEMA CACHE
-- =====================================================

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables exist
DO $$
DECLARE
    tables_exist BOOLEAN;
    functions_exist BOOLEAN;
BEGIN
    -- Check tables
    SELECT 
        COUNT(*) = 2 INTO tables_exist
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('project_unique_users', 'project_user_stats');
    
    -- Check functions
    SELECT 
        COUNT(*) = 2 INTO functions_exist
    FROM pg_proc 
    WHERE proname IN ('insert_new_unique_user', 'update_existing_user_stats');
    
    IF tables_exist AND functions_exist THEN
        RAISE NOTICE '✅ All tables and functions created successfully!';
    ELSE
        IF NOT tables_exist THEN
            RAISE WARNING '⚠️  Some tables are missing';
        END IF;
        IF NOT functions_exist THEN
            RAISE WARNING '⚠️  Some functions are missing';
        END IF;
    END IF;
END $$;

-- Check fee_generated column
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            AND column_name = 'fee_generated'
        ) 
        THEN '✅ fee_generated column exists in transactions table'
        ELSE '❌ fee_generated column is MISSING from transactions table'
    END as fee_generated_status;

SELECT '🎉 All fixes applied successfully! Your submit API should now work.' as final_status;

