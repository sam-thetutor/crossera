-- =====================================================
-- CAMPAIGNS TABLE SCHEMA
-- =====================================================
-- Stores rich metadata for campaigns (minimal data on-chain)

CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  campaign_id INTEGER UNIQUE NOT NULL,  -- Matches on-chain campaign ID
  
  -- Rich Metadata (all off-chain)
  name VARCHAR(255) NOT NULL,
  description TEXT,
  banner_image_url TEXT,
  logo_url TEXT,
  category VARCHAR(50),
  
  -- Blockchain data (synced from contract)
  total_pool DECIMAL(20, 8) NOT NULL,
  distributed_rewards DECIMAL(20, 8) DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  
  -- Additional metadata
  eligibility_criteria TEXT,
  terms_url TEXT,
  website_url TEXT,
  twitter_url TEXT,
  discord_url TEXT,
  
  -- Computed fields
  registered_apps_count INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'ended', 'finalized'
  
  -- UI/UX
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  tags TEXT[],
  
  -- Audit
  created_by VARCHAR(42) NOT NULL,
  blockchain_tx_hash VARCHAR(66),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_id ON campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON campaigns(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(created_by);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();

-- =====================================================
-- CAMPAIGN STATISTICS VIEW
-- =====================================================
CREATE OR REPLACE VIEW campaign_stats AS
SELECT 
  c.id,
  c.campaign_id,
  c.name,
  c.status,
  c.created_by,
  c.total_pool,
  c.distributed_rewards,
  c.start_date,
  c.end_date,
  c.is_active,
  c.registered_apps_count,
  c.total_transactions,
  c.created_at,
  -- Computed fields
  (c.total_pool - c.distributed_rewards) as remaining_pool,
  CASE 
    WHEN c.distributed_rewards > 0 THEN (c.distributed_rewards / c.total_pool * 100)
    ELSE 0
  END as distribution_percentage,
  CASE
    WHEN NOW() < c.start_date THEN 'upcoming'
    WHEN NOW() BETWEEN c.start_date AND c.end_date AND c.is_active THEN 'active'
    WHEN NOW() > c.end_date THEN 'ended'
    ELSE 'inactive'
  END as computed_status
FROM campaigns c;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Public read access to campaigns
CREATE POLICY "Public read campaigns"
ON campaigns FOR SELECT
TO public
USING (true);

-- Only authenticated users can insert campaigns (in practice, backend will use service role)
CREATE POLICY "Authenticated insert campaigns"
ON campaigns FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only creator or admin can update their campaigns
CREATE POLICY "Creator update campaigns"
ON campaigns FOR UPDATE
TO authenticated
USING (created_by = lower(auth.jwt() ->> 'sub'))
WITH CHECK (created_by = lower(auth.jwt() ->> 'sub'));

-- Only creator or admin can delete their campaigns
CREATE POLICY "Creator delete campaigns"
ON campaigns FOR DELETE
TO authenticated
USING (created_by = lower(auth.jwt() ->> 'sub'));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update campaign status based on dates
CREATE OR REPLACE FUNCTION update_campaign_status()
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET status = CASE
    WHEN NOW() < start_date THEN 'pending'
    WHEN NOW() BETWEEN start_date AND end_date AND is_active THEN 'active'
    WHEN NOW() > end_date THEN 'ended'
    ELSE 'inactive'
  END
  WHERE status != 'finalized';
END;
$$ LANGUAGE plpgsql;

-- Function to get active campaigns count
CREATE OR REPLACE FUNCTION get_active_campaigns_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM campaigns WHERE is_active = true AND NOW() BETWEEN start_date AND end_date);
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE campaigns IS 'Stores rich metadata for campaigns with minimal on-chain data';
COMMENT ON COLUMN campaigns.campaign_id IS 'Matches the on-chain campaign ID from smart contract';
COMMENT ON COLUMN campaigns.total_pool IS 'Total XFI allocated for this campaign';
COMMENT ON COLUMN campaigns.status IS 'Computed status: pending, active, ended, finalized';
COMMENT ON COLUMN campaigns.registered_apps_count IS 'Number of apps registered for this campaign';

