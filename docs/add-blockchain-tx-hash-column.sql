-- Add blockchain_tx_hash column to projects table
-- This column stores the transaction hash when a project is registered on the blockchain

-- Add the column if it doesn't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.projects.blockchain_tx_hash IS 'Transaction hash of the blockchain registration transaction';

