-- =====================================================
-- FIX: Make project_id nullable in sdk_pending_transactions
-- =====================================================
-- The project_id can be looked up during batch processing
-- It doesn't need to be required at submission time

-- Remove NOT NULL constraint from project_id
DO $$ 
BEGIN
    -- Check if project_id column exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sdk_pending_transactions' 
        AND column_name = 'project_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE sdk_pending_transactions 
        ALTER COLUMN project_id DROP NOT NULL;
        RAISE NOTICE '✅ Removed NOT NULL constraint from project_id';
    ELSE
        RAISE NOTICE 'ℹ️  project_id is already nullable or does not exist';
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
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sdk_pending_transactions' 
AND column_name = 'project_id';

SELECT '✅ project_id constraint fixed - SDK submit should now work!' as status;

