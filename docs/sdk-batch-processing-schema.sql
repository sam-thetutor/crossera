-- =====================================================
-- SDK Batch Processing System - Database Schema
-- =====================================================
-- This creates the tables needed for SDK batch processing
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. SDK PENDING TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sdk_pending_transactions (
    id SERIAL PRIMARY KEY,
    
    -- Transaction Info
    transaction_hash VARCHAR(66) NOT NULL,
    app_id VARCHAR(32) NOT NULL,
    user_address VARCHAR(42),
    network VARCHAR(20) NOT NULL, -- 'testnet' or 'mainnet'
    
    -- Status Tracking
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    -- Status values: 'pending', 'processing', 'completed', 'failed', 'skipped'
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Processing Results
    process_tx_hash VARCHAR(66), -- Hash of the processTransaction call
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Batch Info
    batch_id INTEGER, -- Will add FK after creating sdk_batch_runs
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_tx_hash_network UNIQUE(transaction_hash, network),
    CONSTRAINT valid_tx_hash_sdk CHECK (transaction_hash ~ '^0x[a-fA-F0-9]{64}$'),
    CONSTRAINT valid_status_sdk CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    CONSTRAINT valid_app_id_sdk CHECK (app_id ~ '^[a-zA-Z0-9-]{3,32}$'),
    CONSTRAINT valid_network_sdk CHECK (network IN ('testnet', 'mainnet'))
);

COMMENT ON TABLE sdk_pending_transactions IS 'Stores transactions submitted via SDK for batch processing';
COMMENT ON COLUMN sdk_pending_transactions.network IS 'Network where transaction exists: testnet or mainnet';
COMMENT ON COLUMN sdk_pending_transactions.status IS 'Transaction processing status: pending, processing, completed, failed, skipped';
COMMENT ON COLUMN sdk_pending_transactions.retry_count IS 'Number of times this transaction has been retried';
COMMENT ON COLUMN sdk_pending_transactions.process_tx_hash IS 'Hash of the on-chain processTransaction call';

-- =====================================================
-- 2. SDK BATCH RUNS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sdk_batch_runs (
    id SERIAL PRIMARY KEY,
    
    -- Run Info
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running',
    -- Status values: 'running', 'completed', 'failed', 'partial'
    
    -- Statistics
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    skipped_transactions INTEGER DEFAULT 0,
    
    -- Metadata
    triggered_by VARCHAR(50) DEFAULT 'cron', -- 'cron', 'manual', 'api'
    error_summary TEXT,
    
    -- Constraints
    CONSTRAINT valid_batch_status CHECK (status IN ('running', 'completed', 'failed', 'partial'))
);

COMMENT ON TABLE sdk_batch_runs IS 'Tracks batch processing runs and their statistics';
COMMENT ON COLUMN sdk_batch_runs.triggered_by IS 'How the batch was triggered: cron, manual, or api';
COMMENT ON COLUMN sdk_batch_runs.status IS 'Batch run status: running, completed, failed, partial';

-- =====================================================
-- 3. ADD FOREIGN KEY (After both tables exist)
-- =====================================================

-- Add foreign key from sdk_pending_transactions to sdk_batch_runs
ALTER TABLE sdk_pending_transactions 
ADD CONSTRAINT fk_batch_id 
FOREIGN KEY (batch_id) 
REFERENCES sdk_batch_runs(id) 
ON DELETE SET NULL;

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Indexes for sdk_pending_transactions
CREATE INDEX IF NOT EXISTS idx_sdk_pending_status 
    ON sdk_pending_transactions(status);

CREATE INDEX IF NOT EXISTS idx_sdk_pending_network 
    ON sdk_pending_transactions(network);

CREATE INDEX IF NOT EXISTS idx_sdk_pending_network_status 
    ON sdk_pending_transactions(network, status);

CREATE INDEX IF NOT EXISTS idx_sdk_pending_submitted_at 
    ON sdk_pending_transactions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_sdk_pending_app_id 
    ON sdk_pending_transactions(app_id);

CREATE INDEX IF NOT EXISTS idx_sdk_pending_user_address 
    ON sdk_pending_transactions(user_address);

CREATE INDEX IF NOT EXISTS idx_sdk_pending_batch_id 
    ON sdk_pending_transactions(batch_id);

CREATE INDEX IF NOT EXISTS idx_sdk_pending_tx_hash 
    ON sdk_pending_transactions(transaction_hash);

-- Indexes for sdk_batch_runs
CREATE INDEX IF NOT EXISTS idx_sdk_batch_runs_started_at 
    ON sdk_batch_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sdk_batch_runs_status 
    ON sdk_batch_runs(status);

-- =====================================================
-- 5. CREATE AUTO-UPDATE TRIGGER
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sdk_pending_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sdk_pending_transactions
DROP TRIGGER IF EXISTS trigger_update_sdk_pending_updated_at ON sdk_pending_transactions;
CREATE TRIGGER trigger_update_sdk_pending_updated_at
    BEFORE UPDATE ON sdk_pending_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_sdk_pending_updated_at();

-- =====================================================
-- 6. ENABLE RLS (Row Level Security)
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE sdk_pending_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_batch_runs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "sdk_pending_select_policy" ON sdk_pending_transactions;
DROP POLICY IF EXISTS "sdk_pending_insert_policy" ON sdk_pending_transactions;
DROP POLICY IF EXISTS "sdk_pending_update_policy" ON sdk_pending_transactions;
DROP POLICY IF EXISTS "sdk_batch_select_policy" ON sdk_batch_runs;
DROP POLICY IF EXISTS "sdk_batch_insert_policy" ON sdk_batch_runs;
DROP POLICY IF EXISTS "sdk_batch_update_policy" ON sdk_batch_runs;

-- Policies for sdk_pending_transactions (Allow all operations)
CREATE POLICY "sdk_pending_select_policy"
    ON sdk_pending_transactions FOR SELECT
    USING (true);

CREATE POLICY "sdk_pending_insert_policy"
    ON sdk_pending_transactions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "sdk_pending_update_policy"
    ON sdk_pending_transactions FOR UPDATE
    USING (true);

-- Policies for sdk_batch_runs (Allow all operations)
CREATE POLICY "sdk_batch_select_policy"
    ON sdk_batch_runs FOR SELECT
    USING (true);

CREATE POLICY "sdk_batch_insert_policy"
    ON sdk_batch_runs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "sdk_batch_update_policy"
    ON sdk_batch_runs FOR UPDATE
    USING (true);

-- =====================================================
-- 7. UTILITY FUNCTIONS
-- =====================================================

-- Function to get pending transactions count
CREATE OR REPLACE FUNCTION get_pending_transactions_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM sdk_pending_transactions WHERE status = 'pending');
END;
$$ LANGUAGE plpgsql;

-- Function to get batch statistics
CREATE OR REPLACE FUNCTION get_batch_statistics(days INTEGER DEFAULT 7)
RETURNS TABLE (
    total_batches INTEGER,
    avg_success_rate NUMERIC,
    total_processed INTEGER,
    total_successful INTEGER,
    total_failed INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_batches,
        CASE 
            WHEN SUM(total_transactions) > 0 
            THEN (SUM(successful_transactions)::NUMERIC / SUM(total_transactions)::NUMERIC * 100)::NUMERIC(5,2)
            ELSE 0
        END as avg_success_rate,
        SUM(total_transactions)::INTEGER as total_processed,
        SUM(successful_transactions)::INTEGER as total_successful,
        SUM(failed_transactions)::INTEGER as total_failed
    FROM sdk_batch_runs
    WHERE started_at >= NOW() - INTERVAL '1 day' * days
    AND status IN ('completed', 'partial');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old completed transactions (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sdk_transactions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sdk_pending_transactions
    WHERE status IN ('completed', 'failed', 'skipped')
    AND processed_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. VERIFICATION & TESTING
-- =====================================================

-- Verify tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('sdk_pending_transactions', 'sdk_batch_runs')
ORDER BY table_name;

-- Verify indexes were created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('sdk_pending_transactions', 'sdk_batch_runs')
ORDER BY tablename, indexname;

-- Test utility functions
SELECT * FROM get_pending_transactions_count();
SELECT * FROM get_batch_statistics(7);

-- Insert a test transaction (optional - comment out if you don't want test data)
/*
INSERT INTO sdk_pending_transactions (
    transaction_hash,
    app_id,
    user_address,
    status
) VALUES (
    '0x0000000000000000000000000000000000000000000000000000000000000001',
    'test-app-id',
    '0x0000000000000000000000000000000000000000',
    'pending'
);

SELECT * FROM sdk_pending_transactions WHERE app_id = 'test-app-id';
*/

-- =====================================================
-- 9. REFRESH SCHEMA CACHE
-- =====================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Wait and notify again
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 SDK Batch Processing tables created successfully!' as status;
SELECT '✅ Tables: sdk_pending_transactions, sdk_batch_runs' as created;
SELECT '✅ Indexes: 8 performance indexes created' as indexes;
SELECT '✅ Functions: 3 utility functions created' as functions;
SELECT '✅ RLS: Row Level Security enabled with policies' as security;
SELECT '📊 Ready to accept SDK submissions!' as ready;
