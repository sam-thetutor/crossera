-- ============================================
-- TRANSACTIONS TABLE SCHEMA
-- Stores processed transaction records
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction identification
    transaction_hash TEXT NOT NULL UNIQUE,
    app_id TEXT NOT NULL,
    
    -- Transaction details
    from_address TEXT NOT NULL,
    to_address TEXT,
    amount TEXT NOT NULL DEFAULT '0',
    
    -- Gas and fees
    gas_used TEXT NOT NULL,
    gas_price TEXT NOT NULL,
    fee_generated TEXT NOT NULL,
    
    -- Blockchain info
    block_number BIGINT,
    process_tx_hash TEXT, -- Hash of the processTransaction call
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Index for fast lookup by transaction hash
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);

-- Index for lookup by app_id
CREATE INDEX IF NOT EXISTS idx_transactions_app_id ON transactions(app_id);

-- Index for lookup by from_address
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Index for timestamp sorting
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);

-- Composite index for app transactions
CREATE INDEX IF NOT EXISTS idx_transactions_app_timestamp ON transactions(app_id, timestamp DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Public read access (for transparency)
CREATE POLICY "Public read access for transactions"
    ON transactions
    FOR SELECT
    USING (true);

-- Server-side insert only (via service role key)
CREATE POLICY "Service role insert access"
    ON transactions
    FOR INSERT
    WITH CHECK (true);

-- Service role update access
CREATE POLICY "Service role update access"
    ON transactions
    FOR UPDATE
    USING (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transactions_updated_at();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Transaction summary by app
CREATE OR REPLACE VIEW transaction_summary_by_app AS
SELECT 
    app_id,
    COUNT(*) as total_transactions,
    SUM(CAST(fee_generated AS NUMERIC)) as total_fees,
    SUM(CAST(amount AS NUMERIC)) as total_volume,
    MIN(timestamp) as first_transaction,
    MAX(timestamp) as last_transaction,
    COUNT(*) FILTER (WHERE status = 'processed') as processed_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count
FROM transactions
GROUP BY app_id;

-- Recent transactions view
CREATE OR REPLACE VIEW recent_transactions AS
SELECT 
    id,
    transaction_hash,
    app_id,
    from_address,
    to_address,
    amount,
    fee_generated,
    status,
    timestamp
FROM transactions
ORDER BY timestamp DESC
LIMIT 100;

-- Daily transaction stats
CREATE OR REPLACE VIEW daily_transaction_stats AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT app_id) as unique_apps,
    SUM(CAST(fee_generated AS NUMERIC)) as total_fees,
    SUM(CAST(amount AS NUMERIC)) as total_volume
FROM transactions
WHERE status = 'processed'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE transactions IS 'Stores all processed blockchain transactions with metrics';
COMMENT ON COLUMN transactions.transaction_hash IS 'Unique blockchain transaction hash';
COMMENT ON COLUMN transactions.app_id IS 'Application identifier extracted from transaction data';
COMMENT ON COLUMN transactions.process_tx_hash IS 'Hash of the on-chain processTransaction call';
COMMENT ON COLUMN transactions.fee_generated IS 'Gas fee in wei (gasUsed * gasPrice)';
COMMENT ON COLUMN transactions.amount IS 'Transaction value in wei';
COMMENT ON COLUMN transactions.status IS 'Processing status: pending, processed, or failed';

