import { supabaseAdmin } from './supabase';

// Use supabaseAdmin for server-side operations
const supabase = supabaseAdmin!;

export interface Campaign {
  id: string;
  campaign_id: number;
  name: string;
  description?: string;
  banner_image_url?: string;
  logo_url?: string;
  category?: string;
  total_pool: string;
  distributed_rewards: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  eligibility_criteria?: string;
  terms_url?: string;
  website_url?: string;
  twitter_url?: string;
  discord_url?: string;
  registered_apps_count: number;
  total_transactions: number;
  status: 'pending' | 'active' | 'ended' | 'finalized';
  is_featured: boolean;
  display_order?: number;
  tags?: string[];
  created_by: string;
  blockchain_tx_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignStats {
  id: string;
  campaign_id: number;
  name: string;
  status: string;
  created_by: string;
  total_pool: string;
  distributed_rewards: string;
  remaining_pool: string;
  distribution_percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  registered_apps_count: number;
  total_transactions: number;
  computed_status: string;
  created_at: string;
}

export const campaignService = {
  /**
   * Get all campaigns
   */
  async getAllCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: number): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  /**
   * Get campaigns by status
   */
  async getCampaignsByStatus(status: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get active campaigns
   */
  async getActiveCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get featured campaigns
   */
  async getFeaturedCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_featured', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get campaigns by creator
   */
  async getCampaignsByCreator(creatorAddress: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('created_by', creatorAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Search campaigns by name
   */
  async searchCampaigns(searchTerm: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get campaign statistics
   */
  async getCampaignStats(): Promise<CampaignStats[]> {
    const { data, error } = await supabase
      .from('campaign_stats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new campaign
   */
  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaign,
        created_by: campaign.created_by?.toLowerCase(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: number, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('campaign_id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update campaign status
   */
  async updateCampaignStatus(campaignId: number, status: string): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('campaign_id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Activate campaign
   */
  async activateCampaign(campaignId: number): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ is_active: true, status: 'active' })
      .eq('campaign_id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deactivate campaign
   */
  async deactivateCampaign(campaignId: number): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ is_active: false, status: 'inactive' })
      .eq('campaign_id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: number): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('campaign_id', campaignId);

    if (error) throw error;
  },

  /**
   * Check if campaign ID exists
   */
  async campaignIdExists(campaignId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('campaign_id')
      .eq('campaign_id', campaignId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  /**
   * Increment registered apps count
   */
  async incrementRegisteredApps(campaignId: number): Promise<void> {
    const { error } = await supabase.rpc('increment_campaign_apps', {
      p_campaign_id: campaignId
    });

    if (error) {
      // Fallback if function doesn't exist
      const campaign = await this.getCampaignById(campaignId);
      if (campaign) {
        await this.updateCampaign(campaignId, {
          registered_apps_count: campaign.registered_apps_count + 1
        });
      }
    }
  },

  /**
   * Update campaign from blockchain data
   */
  async syncFromBlockchain(
    campaignId: number,
    blockchainData: {
      totalPool: string;
      distributedRewards: string;
      isActive: boolean;
    }
  ): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        total_pool: blockchainData.totalPool,
        distributed_rewards: blockchainData.distributedRewards,
        is_active: blockchainData.isActive,
      })
      .eq('campaign_id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

