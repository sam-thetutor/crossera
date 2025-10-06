-- =====================================================
-- FIX: Missing Columns from Previous Migration
-- =====================================================
-- This patches the issues from the first migration
-- Run this AFTER running fix-submit-api-errors.sql

-- =====================================================
-- FIX 1: Add missing gas_price and gas_used to transactions
-- =====================================================

-- Add gas_price column (MISSING from previous script!)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'gas_price'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN gas_price VARCHAR(20) DEFAULT '0';
        RAISE NOTICE '✅ Added gas_price column to transactions table';
    ELSE
        RAISE NOTICE 'ℹ️  gas_price column already exists';
    END IF;
END $$;

-- Add gas_used column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'gas_used'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN gas_used VARCHAR(20) DEFAULT '0';
        RAISE NOTICE '✅ Added gas_used column to transactions table';
    ELSE
        RAISE NOTICE 'ℹ️  gas_used column already exists';
    END IF;
END $$;

-- =====================================================
-- FIX 2: Add missing columns to existing project_unique_users table
-- =====================================================

-- The CREATE TABLE IF NOT EXISTS doesn't help if table already exists
-- So we need to ALTER TABLE to add missing columns

-- Add last_transaction_at if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_unique_users' 
        AND column_name = 'last_transaction_at'
    ) THEN
        ALTER TABLE project_unique_users 
        ADD COLUMN last_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added last_transaction_at column to project_unique_users table';
    ELSE
        RAISE NOTICE 'ℹ️  last_transaction_at column already exists';
    END IF;
END $$;

-- Add first_transaction_at if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_unique_users' 
        AND column_name = 'first_transaction_at'
    ) THEN
        ALTER TABLE project_unique_users 
        ADD COLUMN first_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added first_transaction_at column to project_unique_users table';
    ELSE
        RAISE NOTICE 'ℹ️  first_transaction_at column already exists';
    END IF;
END $$;

-- Add total_transactions if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_unique_users' 
        AND column_name = 'total_transactions'
    ) THEN
        ALTER TABLE project_unique_users 
        ADD COLUMN total_transactions INTEGER DEFAULT 1;
        RAISE NOTICE '✅ Added total_transactions column to project_unique_users table';
    ELSE
        RAISE NOTICE 'ℹ️  total_transactions column already exists';
    END IF;
END $$;

-- Add total_volume if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_unique_users' 
        AND column_name = 'total_volume'
    ) THEN
        ALTER TABLE project_unique_users 
        ADD COLUMN total_volume VARCHAR(78) DEFAULT '0';
        RAISE NOTICE '✅ Added total_volume column to project_unique_users table';
    ELSE
        RAISE NOTICE 'ℹ️  total_volume column already exists';
    END IF;
END $$;

-- Add total_fees if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_unique_users' 
        AND column_name = 'total_fees'
    ) THEN
        ALTER TABLE project_unique_users 
        ADD COLUMN total_fees VARCHAR(78) DEFAULT '0';
        RAISE NOTICE '✅ Added total_fees column to project_unique_users table';
    ELSE
        RAISE NOTICE 'ℹ️  total_fees column already exists';
    END IF;
END $$;

-- Add total_rewards if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_unique_users' 
        AND column_name = 'total_rewards'
    ) THEN
        ALTER TABLE project_unique_users 
        ADD COLUMN total_rewards VARCHAR(78) DEFAULT '0';
        RAISE NOTICE '✅ Added total_rewards column to project_unique_users table';
    ELSE
        RAISE NOTICE 'ℹ️  total_rewards column already exists';
    END IF;
END $$;

-- Add created_at and updated_at if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_unique_users' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE project_unique_users 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added created_at column to project_unique_users table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_unique_users' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE project_unique_users 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to project_unique_users table';
    END IF;
END $$;

-- =====================================================
-- REFRESH SCHEMA CACHE
-- =====================================================

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Wait a moment and notify again to ensure cache refresh
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify gas_price exists in transactions
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            AND column_name = 'gas_price'
        ) 
        THEN '✅ gas_price column exists in transactions'
        ELSE '❌ gas_price column STILL MISSING from transactions'
    END as gas_price_check;

-- Verify last_transaction_at exists in project_unique_users
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'project_unique_users' 
            AND column_name = 'last_transaction_at'
        ) 
        THEN '✅ last_transaction_at column exists in project_unique_users'
        ELSE '❌ last_transaction_at column STILL MISSING from project_unique_users'
    END as last_transaction_check;

-- Show all columns in transactions table
SELECT 
    'transactions' as table_name,
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- Show all columns in project_unique_users table
SELECT 
    'project_unique_users' as table_name,
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_unique_users'
ORDER BY ordinal_position;

SELECT '🎉 All missing columns have been added! Your submit API should now work.' as final_status;

