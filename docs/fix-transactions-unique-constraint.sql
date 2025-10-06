-- Fix transactions table unique constraint
-- Allow same tx_hash for different campaigns

DO $$ 
BEGIN
    -- Check if old unique constraint exists on tx_hash alone
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name IN ('transactions_transaction_hash_key', 'transactions_tx_hash_key')
        AND table_name = 'transactions'
    ) THEN
        -- Drop the old single-column unique constraint
        ALTER TABLE transactions 
        DROP CONSTRAINT IF EXISTS transactions_transaction_hash_key;
        
        ALTER TABLE transactions 
        DROP CONSTRAINT IF EXISTS transactions_tx_hash_key;
        
        RAISE NOTICE '✅ Dropped old tx_hash unique constraint';
    ELSE
        RAISE NOTICE 'ℹ️  No single-column tx_hash constraint found';
    END IF;
END $$;

-- Add composite unique constraint: same tx can be recorded for different campaigns
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_tx_hash_campaign_unique'
        AND table_name = 'transactions'
    ) THEN
        ALTER TABLE transactions 
        ADD CONSTRAINT transactions_tx_hash_campaign_unique UNIQUE(tx_hash, campaign_id);
        
        RAISE NOTICE '✅ Created composite UNIQUE(tx_hash, campaign_id) constraint';
    ELSE
        RAISE NOTICE 'ℹ️  Composite unique constraint already exists';
    END IF;
END $$;

-- Verify the fix
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'transactions'::regclass
AND conname LIKE '%tx_hash%';
