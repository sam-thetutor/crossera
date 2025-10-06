-- =====================================================
-- FIX: Add missing columns to sdk_pending_transactions
-- =====================================================
-- Run this in Supabase SQL Editor

-- Add max_retries column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_pending_transactions' 
        AND column_name = 'max_retries'
    ) THEN
        ALTER TABLE sdk_pending_transactions 
        ADD COLUMN max_retries INTEGER DEFAULT 3;
        RAISE NOTICE '✅ Added max_retries column';
    ELSE
        RAISE NOTICE 'ℹ️  max_retries column already exists';
    END IF;
END $$;

-- Add retry_count column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_pending_transactions' 
        AND column_name = 'retry_count'
    ) THEN
        ALTER TABLE sdk_pending_transactions 
        ADD COLUMN retry_count INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added retry_count column';
    ELSE
        RAISE NOTICE 'ℹ️  retry_count column already exists';
    END IF;
END $$;

-- Add error_message column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_pending_transactions' 
        AND column_name = 'error_message'
    ) THEN
        ALTER TABLE sdk_pending_transactions 
        ADD COLUMN error_message TEXT;
        RAISE NOTICE '✅ Added error_message column';
    ELSE
        RAISE NOTICE 'ℹ️  error_message column already exists';
    END IF;
END $$;

-- Add process_tx_hash column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_pending_transactions' 
        AND column_name = 'process_tx_hash'
    ) THEN
        ALTER TABLE sdk_pending_transactions 
        ADD COLUMN process_tx_hash VARCHAR(66);
        RAISE NOTICE '✅ Added process_tx_hash column';
    ELSE
        RAISE NOTICE 'ℹ️  process_tx_hash column already exists';
    END IF;
END $$;

-- Add processed_at column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_pending_transactions' 
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE sdk_pending_transactions 
        ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added processed_at column';
    ELSE
        RAISE NOTICE 'ℹ️  processed_at column already exists';
    END IF;
END $$;

-- Add batch_id column with correct type
DO $$ 
DECLARE
    batch_runs_id_type TEXT;
BEGIN
    -- First check what type sdk_batch_runs.id is
    SELECT data_type INTO batch_runs_id_type
    FROM information_schema.columns 
    WHERE table_name = 'sdk_batch_runs' 
    AND column_name = 'id';
    
    -- Add batch_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_pending_transactions' 
        AND column_name = 'batch_id'
    ) THEN
        -- Add column with matching type
        IF batch_runs_id_type = 'uuid' THEN
            ALTER TABLE sdk_pending_transactions 
            ADD COLUMN batch_id UUID;
            RAISE NOTICE '✅ Added batch_id column (UUID type)';
        ELSIF batch_runs_id_type = 'integer' THEN
            ALTER TABLE sdk_pending_transactions 
            ADD COLUMN batch_id INTEGER;
            RAISE NOTICE '✅ Added batch_id column (INTEGER type)';
        ELSE
            -- Default to INTEGER (for SERIAL)
            ALTER TABLE sdk_pending_transactions 
            ADD COLUMN batch_id INTEGER;
            RAISE NOTICE '✅ Added batch_id column (INTEGER type - default)';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  batch_id column already exists';
    END IF;
END $$;

-- Add foreign key constraint for batch_id
DO $$
BEGIN
    -- Drop existing FK if it exists (in case of type mismatch)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_batch_id'
        AND table_name = 'sdk_pending_transactions'
    ) THEN
        ALTER TABLE sdk_pending_transactions DROP CONSTRAINT fk_batch_id;
        RAISE NOTICE 'ℹ️  Dropped existing fk_batch_id constraint';
    END IF;
    
    -- Only add if sdk_batch_runs table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sdk_batch_runs') THEN
        ALTER TABLE sdk_pending_transactions 
        ADD CONSTRAINT fk_batch_id 
        FOREIGN KEY (batch_id) 
        REFERENCES sdk_batch_runs(id) 
        ON DELETE SET NULL;
        RAISE NOTICE '✅ Added batch_id foreign key constraint';
    ELSE
        RAISE NOTICE 'ℹ️  sdk_batch_runs table does not exist, skipping FK';
    END IF;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE '⚠️  Could not add FK constraint - type mismatch. Continuing without FK.';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Error adding FK constraint: %. Continuing without FK.', SQLERRM;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(0.5);
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sdk_pending_transactions'
ORDER BY ordinal_position;

SELECT '🎉 All missing SDK columns added successfully!' as final_status;

