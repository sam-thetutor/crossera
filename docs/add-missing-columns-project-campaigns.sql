-- =====================================================
-- FIX: Add missing columns to project_campaigns table
-- =====================================================
-- This adds the missing columns that are causing PGRST204 errors

-- Add registration_tx_hash column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_campaigns' 
        AND column_name = 'registration_tx_hash'
    ) THEN
        ALTER TABLE project_campaigns 
        ADD COLUMN registration_tx_hash VARCHAR(66);
        RAISE NOTICE 'Added registration_tx_hash column';
    ELSE
        RAISE NOTICE 'registration_tx_hash column already exists';
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_campaigns' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE project_campaigns 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;
END $$;

-- Set default value for existing rows
UPDATE project_campaigns 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- Verify the fix
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'project_campaigns' 
ORDER BY ordinal_position;

-- Refresh the schema cache (PostgREST)
NOTIFY pgrst, 'reload schema';

SELECT 'Migration completed successfully!' as status;

