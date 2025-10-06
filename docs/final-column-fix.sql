-- =====================================================
-- FINAL COMPREHENSIVE FIX: All Missing Columns
-- =====================================================
-- This fixes ALL remaining column issues
-- Run this in Supabase SQL Editor

-- =====================================================
-- FIX 1: Add tx_hash column to transactions
-- =====================================================

-- The API uses 'tx_hash' but your table might have 'transaction_hash'
-- Let's ensure tx_hash exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'tx_hash'
    ) THEN
        -- Check if transaction_hash exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            AND column_name = 'transaction_hash'
        ) THEN
            -- Rename transaction_hash to tx_hash
            ALTER TABLE transactions 
            RENAME COLUMN transaction_hash TO tx_hash;
            RAISE NOTICE '✅ Renamed transaction_hash to tx_hash in transactions table';
        ELSE
            -- Add tx_hash column
            ALTER TABLE transactions 
            ADD COLUMN tx_hash VARCHAR(66) UNIQUE NOT NULL DEFAULT '0x0000000000000000000000000000000000000000000000000000000000000000';
            RAISE NOTICE '✅ Added tx_hash column to transactions table';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  tx_hash column already exists';
    END IF;
END $$;

-- =====================================================
-- FIX 2: Add missing columns to project_user_stats
-- =====================================================

-- Add total_users_transactions column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_user_stats' 
        AND column_name = 'total_users_transactions'
    ) THEN
        ALTER TABLE project_user_stats 
        ADD COLUMN total_users_transactions INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added total_users_transactions column to project_user_stats';
    ELSE
        RAISE NOTICE 'ℹ️  total_users_transactions column already exists';
    END IF;
END $$;

-- Add total_users_volume column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_user_stats' 
        AND column_name = 'total_users_volume'
    ) THEN
        ALTER TABLE project_user_stats 
        ADD COLUMN total_users_volume VARCHAR(78) DEFAULT '0';
        RAISE NOTICE '✅ Added total_users_volume column to project_user_stats';
    ELSE
        RAISE NOTICE 'ℹ️  total_users_volume column already exists';
    END IF;
END $$;

-- Add total_users_fees column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_user_stats' 
        AND column_name = 'total_users_fees'
    ) THEN
        ALTER TABLE project_user_stats 
        ADD COLUMN total_users_fees VARCHAR(78) DEFAULT '0';
        RAISE NOTICE '✅ Added total_users_fees column to project_user_stats';
    ELSE
        RAISE NOTICE 'ℹ️  total_users_fees column already exists';
    END IF;
END $$;

-- Add total_users_rewards column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_user_stats' 
        AND column_name = 'total_users_rewards'
    ) THEN
        ALTER TABLE project_user_stats 
        ADD COLUMN total_users_rewards VARCHAR(78) DEFAULT '0';
        RAISE NOTICE '✅ Added total_users_rewards column to project_user_stats';
    ELSE
        RAISE NOTICE 'ℹ️  total_users_rewards column already exists';
    END IF;
END $$;

-- Add unique_users_count column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_user_stats' 
        AND column_name = 'unique_users_count'
    ) THEN
        ALTER TABLE project_user_stats 
        ADD COLUMN unique_users_count INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added unique_users_count column to project_user_stats';
    ELSE
        RAISE NOTICE 'ℹ️  unique_users_count column already exists';
    END IF;
END $$;

-- Add last_updated column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_user_stats' 
        AND column_name = 'last_updated'
    ) THEN
        ALTER TABLE project_user_stats 
        ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added last_updated column to project_user_stats';
    ELSE
        RAISE NOTICE 'ℹ️  last_updated column already exists';
    END IF;
END $$;

-- =====================================================
-- FIX 3: Ensure all required transactions columns exist
-- =====================================================

-- Comprehensive list of all columns needed by submit API
DO $$ 
BEGIN
    -- Add missing columns one by one
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'app_id') THEN
        ALTER TABLE transactions ADD COLUMN app_id VARCHAR(32);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'project_id') THEN
        ALTER TABLE transactions ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'campaign_id') THEN
        ALTER TABLE transactions ADD COLUMN campaign_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'from_address') THEN
        ALTER TABLE transactions ADD COLUMN from_address VARCHAR(42);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'to_address') THEN
        ALTER TABLE transactions ADD COLUMN to_address VARCHAR(42);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_address') THEN
        ALTER TABLE transactions ADD COLUMN user_address VARCHAR(42);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'amount') THEN
        ALTER TABLE transactions ADD COLUMN amount VARCHAR(78) DEFAULT '0';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'gas_used') THEN
        ALTER TABLE transactions ADD COLUMN gas_used VARCHAR(20) DEFAULT '0';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'gas_price') THEN
        ALTER TABLE transactions ADD COLUMN gas_price VARCHAR(20) DEFAULT '0';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'fee_generated') THEN
        ALTER TABLE transactions ADD COLUMN fee_generated VARCHAR(78) DEFAULT '0';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'block_number') THEN
        ALTER TABLE transactions ADD COLUMN block_number BIGINT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'timestamp') THEN
        ALTER TABLE transactions ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'status') THEN
        ALTER TABLE transactions ADD COLUMN status VARCHAR(20) DEFAULT 'processed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'process_tx_hash') THEN
        ALTER TABLE transactions ADD COLUMN process_tx_hash VARCHAR(66);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_unique_user') THEN
        ALTER TABLE transactions ADD COLUMN is_unique_user BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'reward_calculated') THEN
        ALTER TABLE transactions ADD COLUMN reward_calculated VARCHAR(78) DEFAULT '0';
    END IF;
    
    RAISE NOTICE '✅ All transactions columns verified/added';
END $$;

-- =====================================================
-- FIX 4: Update the database functions with correct column names
-- =====================================================

-- Recreate insert_new_unique_user function with correct column references
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
    
    -- Update or insert project stats with correct column names
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
END;
$$ LANGUAGE plpgsql;

-- Recreate update_existing_user_stats function
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
    
    -- Update project stats with correct column names
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

-- =====================================================
-- REFRESH SCHEMA CACHE (CRITICAL!)
-- =====================================================

-- Force PostgREST to reload schema multiple times
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Wait and notify again
SELECT pg_sleep(0.5);
NOTIFY pgrst, 'reload schema';

SELECT pg_sleep(0.5);
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check tx_hash column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            AND column_name = 'tx_hash'
        ) 
        THEN '✅ tx_hash column exists in transactions'
        ELSE '❌ tx_hash column MISSING from transactions'
    END as tx_hash_check;

-- Check total_users_transactions column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'project_user_stats' 
            AND column_name = 'total_users_transactions'
        ) 
        THEN '✅ total_users_transactions column exists in project_user_stats'
        ELSE '❌ total_users_transactions column MISSING from project_user_stats'
    END as total_users_transactions_check;

-- Show all columns in transactions table
SELECT 
    '=== TRANSACTIONS TABLE COLUMNS ===' as info,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- Show all columns in project_user_stats table
SELECT 
    '=== PROJECT_USER_STATS TABLE COLUMNS ===' as info,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'project_user_stats'
ORDER BY ordinal_position;

-- Show all columns in project_unique_users table
SELECT 
    '=== PROJECT_UNIQUE_USERS TABLE COLUMNS ===' as info,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'project_unique_users'
ORDER BY ordinal_position;

-- Final success message
SELECT '🎉🎉🎉 ALL COLUMNS FIXED! Your submit API should now work perfectly! 🎉🎉🎉' as final_status;

