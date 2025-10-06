-- =====================================================
-- MIGRATION: Add network column to existing SDK tables
-- =====================================================
-- This adds the network column to existing sdk_pending_transactions table
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Add network column to existing table
-- =====================================================

-- Add network column with default value
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_pending_transactions' 
        AND column_name = 'network'
    ) THEN
        -- Add network column with default 'mainnet'
        ALTER TABLE sdk_pending_transactions 
        ADD COLUMN network VARCHAR(20) DEFAULT 'mainnet' NOT NULL;
        
        RAISE NOTICE '✅ Added network column to sdk_pending_transactions';
    ELSE
        RAISE NOTICE 'ℹ️  network column already exists';
    END IF;
END $$;

-- =====================================================
-- 2. Drop old unique constraint and create new one
-- =====================================================

-- Drop the old transaction_hash unique constraint if it exists
DO $$
BEGIN
    -- Check if unique constraint exists on transaction_hash alone
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sdk_pending_transactions_transaction_hash_key'
        AND table_name = 'sdk_pending_transactions'
    ) THEN
        ALTER TABLE sdk_pending_transactions 
        DROP CONSTRAINT sdk_pending_transactions_transaction_hash_key;
        RAISE NOTICE '✅ Dropped old transaction_hash unique constraint';
    END IF;
END $$;

-- Create new composite unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_tx_hash_network'
        AND table_name = 'sdk_pending_transactions'
    ) THEN
        ALTER TABLE sdk_pending_transactions 
        ADD CONSTRAINT unique_tx_hash_network UNIQUE(transaction_hash, network);
        RAISE NOTICE '✅ Created unique_tx_hash_network composite constraint';
    ELSE
        RAISE NOTICE 'ℹ️  unique_tx_hash_network constraint already exists';
    END IF;
END $$;

-- =====================================================
-- 3. Add network validation constraint
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_network_sdk'
        AND table_name = 'sdk_pending_transactions'
    ) THEN
        ALTER TABLE sdk_pending_transactions 
        ADD CONSTRAINT valid_network_sdk CHECK (network IN ('testnet', 'mainnet'));
        RAISE NOTICE '✅ Added network validation constraint';
    ELSE
        RAISE NOTICE 'ℹ️  valid_network_sdk constraint already exists';
    END IF;
END $$;

-- =====================================================
-- 4. Create network-related indexes
-- =====================================================

-- Index for network filtering
CREATE INDEX IF NOT EXISTS idx_sdk_pending_network 
    ON sdk_pending_transactions(network);

-- Composite index for network + status queries
CREATE INDEX IF NOT EXISTS idx_sdk_pending_network_status 
    ON sdk_pending_transactions(network, status);

-- =====================================================
-- 5. Update existing rows (if any)
-- =====================================================

-- Set network for any existing rows that have NULL
UPDATE sdk_pending_transactions 
SET network = 'mainnet' 
WHERE network IS NULL;

-- =====================================================
-- 6. Refresh schema cache
-- =====================================================

NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(0.5);
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- 7. Verification
-- =====================================================

-- Verify network column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sdk_pending_transactions' 
            AND column_name = 'network'
        ) 
        THEN '✅ network column exists in sdk_pending_transactions'
        ELSE '❌ network column MISSING from sdk_pending_transactions'
    END as network_check;

-- Verify unique constraint exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'unique_tx_hash_network'
            AND table_name = 'sdk_pending_transactions'
        ) 
        THEN '✅ unique_tx_hash_network constraint exists'
        ELSE '❌ unique_tx_hash_network constraint MISSING'
    END as constraint_check;

-- Show all columns
SELECT 
    column_name, 
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sdk_pending_transactions'
ORDER BY ordinal_position;

-- Show all constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'sdk_pending_transactions'
ORDER BY constraint_name;

SELECT '🎉 Network column migration completed successfully!' as final_status;

