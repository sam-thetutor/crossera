-- =====================================================
-- FIX: Make run_date nullable or add default in sdk_batch_runs
-- =====================================================

-- Option 1: Make run_date nullable
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_batch_runs' 
        AND column_name = 'run_date'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE sdk_batch_runs 
        ALTER COLUMN run_date DROP NOT NULL;
        RAISE NOTICE '✅ Removed NOT NULL constraint from run_date';
    ELSE
        RAISE NOTICE 'ℹ️  run_date is already nullable or does not exist';
    END IF;
END $$;

-- Option 2: Add default value if column exists without default
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_batch_runs' 
        AND column_name = 'run_date'
        AND column_default IS NULL
    ) THEN
        ALTER TABLE sdk_batch_runs 
        ALTER COLUMN run_date SET DEFAULT CURRENT_DATE;
        RAISE NOTICE '✅ Added DEFAULT CURRENT_DATE to run_date';
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(0.5);
NOTIFY pgrst, 'reload schema';

SELECT '✅ run_date constraint fixed!' as status;

