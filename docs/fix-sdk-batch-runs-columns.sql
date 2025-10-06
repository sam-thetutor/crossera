-- =====================================================
-- FIX: Add missing columns to sdk_batch_runs table
-- =====================================================

-- Add status column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_batch_runs' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE sdk_batch_runs 
        ADD COLUMN status VARCHAR(20) DEFAULT 'running';
        RAISE NOTICE '✅ Added status column';
    ELSE
        RAISE NOTICE 'ℹ️  status already exists';
    END IF;
END $$;

-- Add triggered_by column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_batch_runs' 
        AND column_name = 'triggered_by'
    ) THEN
        ALTER TABLE sdk_batch_runs 
        ADD COLUMN triggered_by VARCHAR(50) DEFAULT 'cron';
        RAISE NOTICE '✅ Added triggered_by column';
    ELSE
        RAISE NOTICE 'ℹ️  triggered_by already exists';
    END IF;
END $$;

-- Add error_summary column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_batch_runs' 
        AND column_name = 'error_summary'
    ) THEN
        ALTER TABLE sdk_batch_runs 
        ADD COLUMN error_summary TEXT;
        RAISE NOTICE '✅ Added error_summary column';
    ELSE
        RAISE NOTICE 'ℹ️  error_summary already exists';
    END IF;
END $$;

-- Add successful_transactions column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_batch_runs' 
        AND column_name = 'successful_transactions'
    ) THEN
        ALTER TABLE sdk_batch_runs 
        ADD COLUMN successful_transactions INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added successful_transactions column';
    ELSE
        RAISE NOTICE 'ℹ️  successful_transactions already exists';
    END IF;
END $$;

-- Add failed_transactions column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_batch_runs' 
        AND column_name = 'failed_transactions'
    ) THEN
        ALTER TABLE sdk_batch_runs 
        ADD COLUMN failed_transactions INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added failed_transactions column';
    ELSE
        RAISE NOTICE 'ℹ️  failed_transactions already exists';
    END IF;
END $$;

-- Add skipped_transactions column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_batch_runs' 
        AND column_name = 'skipped_transactions'
    ) THEN
        ALTER TABLE sdk_batch_runs 
        ADD COLUMN skipped_transactions INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added skipped_transactions column';
    ELSE
        RAISE NOTICE 'ℹ️  skipped_transactions already exists';
    END IF;
END $$;

-- Add total_transactions column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_batch_runs' 
        AND column_name = 'total_transactions'
    ) THEN
        ALTER TABLE sdk_batch_runs 
        ADD COLUMN total_transactions INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added total_transactions column';
    ELSE
        RAISE NOTICE 'ℹ️  total_transactions already exists';
    END IF;
END $$;

-- Add status validation constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_batch_status'
        AND table_name = 'sdk_batch_runs'
    ) THEN
        ALTER TABLE sdk_batch_runs 
        ADD CONSTRAINT valid_batch_status CHECK (status IN ('running', 'completed', 'failed', 'partial'));
        RAISE NOTICE '✅ Added status validation constraint';
    ELSE
        RAISE NOTICE 'ℹ️  valid_batch_status constraint already exists';
    END IF;
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
WHERE table_name = 'sdk_batch_runs'
ORDER BY ordinal_position;

SELECT '✅ sdk_batch_runs columns fixed - batch processor can now run!' as status;

