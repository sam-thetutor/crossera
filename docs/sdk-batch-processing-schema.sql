-- SDK Batch Processing Schema
-- This schema supports batch processing of SDK-submitted transactions

-- Table for SDK-submitted transactions (batch processing)
CREATE TABLE sdk_pending_transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  app_id VARCHAR(255) NOT NULL,
  project_id UUID REFERENCES projects(id),
  user_address VARCHAR(42) NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, skipped
  error_message TEXT,
  processed_at TIMESTAMP,
  batch_id INTEGER, -- For tracking which batch processed this transaction
  retry_count INTEGER DEFAULT 0, -- Track retry attempts
  max_retries INTEGER DEFAULT 3, -- Maximum retry attempts
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table for tracking batch processing runs
CREATE TABLE sdk_batch_runs (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'running', -- running, completed, failed
  total_transactions INTEGER DEFAULT 0,
  processed_transactions INTEGER DEFAULT 0,
  failed_transactions INTEGER DEFAULT 0,
  skipped_transactions INTEGER DEFAULT 0,
  retried_transactions INTEGER DEFAULT 0,
  gas_used_total BIGINT DEFAULT 0,
  error_message TEXT
);

-- Indexes for efficient batch processing
CREATE INDEX idx_sdk_pending_status ON sdk_pending_transactions(status, submitted_at);
CREATE INDEX idx_sdk_pending_app_id ON sdk_pending_transactions(app_id);
CREATE INDEX idx_sdk_pending_batch_id ON sdk_pending_transactions(batch_id);
CREATE INDEX idx_sdk_pending_tx_hash ON sdk_pending_transactions(tx_hash);
CREATE INDEX idx_sdk_pending_retry ON sdk_pending_transactions(status, retry_count, submitted_at);

-- RLS Policies
ALTER TABLE sdk_pending_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_batch_runs ENABLE ROW LEVEL SECURITY;

-- Policies for sdk_pending_transactions
CREATE POLICY "SDK pending transactions are viewable by everyone" ON sdk_pending_transactions
  FOR SELECT USING (true);

CREATE POLICY "SDK pending transactions are insertable by service role" ON sdk_pending_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "SDK pending transactions are updatable by service role" ON sdk_pending_transactions
  FOR UPDATE USING (true);

-- Policies for sdk_batch_runs
CREATE POLICY "SDK batch runs are viewable by everyone" ON sdk_batch_runs
  FOR SELECT USING (true);

CREATE POLICY "SDK batch runs are insertable by service role" ON sdk_batch_runs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "SDK batch runs are updatable by service role" ON sdk_batch_runs
  FOR UPDATE USING (true);