-- Update transactions table schema to match API requirements
-- Run this in your Supabase SQL Editor

-- Add missing columns to transactions table
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
ADD COLUMN IF NOT EXISTS amount VARCHAR(50);

-- Rename transaction_value to amount if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'transaction_value') THEN
        -- Copy data from transaction_value to amount
        UPDATE transactions SET amount = transaction_value WHERE amount IS NULL;
        -- Drop the old column
        ALTER TABLE transactions DROP COLUMN transaction_value;
    END IF;
END $$;

-- Add constraints for new columns
ALTER TABLE transactions 
ADD CONSTRAINT IF NOT EXISTS valid_from_address CHECK (from_address IS NULL OR from_address ~ '^0x[a-fA-F0-9]{40}$'),
ADD CONSTRAINT IF NOT EXISTS valid_to_address CHECK (to_address IS NULL OR to_address ~ '^0x[a-fA-F0-9]{40}$'),
ADD CONSTRAINT IF NOT EXISTS valid_user_address CHECK (user_address IS NULL OR user_address ~ '^0x[a-fA-F0-9]{40}$'),
ADD CONSTRAINT IF NOT EXISTS valid_process_tx_hash CHECK (process_tx_hash IS NULL OR process_tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
ADD CONSTRAINT IF NOT EXISTS valid_status CHECK (status IN ('pending', 'processed', 'failed'));

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_transactions_app_id ON transactions(app_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_address ON transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_process_tx_hash ON transactions(process_tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Update RLS policies to include new columns
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Transactions are viewable by everyone" ON transactions;

-- Recreate policies
CREATE POLICY "Transactions are viewable by everyone"
    ON transactions FOR SELECT
    USING (true);

CREATE POLICY "Users can insert transactions"
    ON transactions FOR INSERT
    WITH CHECK (true);

-- Success message
SELECT 'Transactions table schema updated successfully! ✅' as status;
