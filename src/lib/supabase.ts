import { createClient } from '@supabase/supabase-js';

// Supabase configuration with proper error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client for frontend (with anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client for API routes (with service role key)
// Only create admin client if service key is available
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// TypeScript interfaces
export interface Project {
  id: string;
  app_id: string;
  owner_address: string;
  
  // Project Information
  app_name: string;
  description?: string;
  category?: string;
  
  // Links
  website_url?: string;
  github_url?: string;
  logo_url?: string;
  twitter_url?: string;
  discord_url?: string;
  banner_url?: string;
  
  // Blockchain Integration
  blockchain_tx_hash?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ProjectCampaign {
  id: string;
  project_id: string;
  campaign_id: number;
  registered_at: string;
  registration_tx_hash?: string;
  registration_fee: string;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  project_id: string;
  campaign_id?: number;
  tx_hash: string;
  gas_used?: string;
  gas_price?: string;
  transaction_value?: string;
  fee_generated?: string;
  reward_calculated?: string;
  transaction_type?: string;
  processed_at: string;
  verified_by?: string;
}

export interface ProjectStats {
  id: string;
  app_id: string;
  app_name: string;
  owner_address: string;
  category?: string;
  campaign_count: number;
  transaction_count: number;
  total_rewards: string;
  total_volume: string;
  created_at: string;
}

// Helper types
export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>;
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'app_id' | 'created_at'>>;

