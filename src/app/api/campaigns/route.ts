import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET /api/campaigns - Get campaigns with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const creator = searchParams.get('creator');
    const active = searchParams.get('active');

    let campaigns;

    if (creator) {
      // Validate address format
      if (!ethers.isAddress(creator)) {
        return NextResponse.json(
          { success: false, error: 'Invalid creator address' },
          { status: 400 }
        );
      }
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('created_by', creator.toLowerCase())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      campaigns = data || [];
    } else if (search) {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      campaigns = data || [];
    } else if (featured === 'true') {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      campaigns = data || [];
    } else if (active === 'true') {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      campaigns = data || [];
    } else if (status) {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      campaigns = data || [];
    } else {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      campaigns = data || [];
    }

    // Get stats if requested
    const includeStats = searchParams.get('include_stats') === 'true';
    let stats = null;
    if (includeStats) {
      const { data: statsData, error: statsError } = await supabase
        .from('campaigns')
        .select('total_pool, distributed_rewards, status, is_active');
      
      if (statsError) throw statsError;
      
      stats = {
        totalCampaigns: campaigns.length,
        totalPool: statsData?.reduce((sum, c) => sum + parseFloat(c.total_pool || '0'), 0) || 0,
        totalDistributed: statsData?.reduce((sum, c) => sum + parseFloat(c.distributed_rewards || '0'), 0) || 0,
        activeCampaigns: statsData?.filter(c => c.is_active).length || 0
      };
    }

    return NextResponse.json({
      success: true,
      campaigns,
      stats: includeStats ? stats : undefined,
      count: campaigns.length
    });

  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaign_id,
      name,
      description,
      banner_image_url,
      logo_url,
      category,
      total_pool,
      start_date,
      end_date,
      eligibility_criteria,
      terms_url,
      website_url,
      twitter_url,
      discord_url,
      is_featured,
      tags,
      created_by,
      blockchain_tx_hash
    } = body;

    // Validate required fields
    if (!campaign_id || !name || !total_pool || !start_date || !end_date || !created_by) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: campaign_id, name, total_pool, start_date, end_date, created_by' 
        },
        { status: 400 }
      );
    }

    // Validate address
    if (!ethers.isAddress(created_by)) {
      return NextResponse.json(
        { success: false, error: 'Invalid creator address' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }
    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check if campaign_id already exists
    const { data: existingCampaign, error: existsError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('campaign_id', campaign_id)
      .single();
    
    if (existsError && existsError.code !== 'PGRST116') {
      throw existsError;
    }
    
    if (existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID already exists' },
        { status: 409 }
      );
    }

    // Compute initial status
    const now = new Date();
    let status: 'pending' | 'active' | 'ended' | 'finalized' = 'pending';
    if (now >= startDate && now <= endDate) {
      status = 'active';
    } else if (now > endDate) {
      status = 'ended';
    }

    // Create campaign in Supabase
    const { data: campaign, error: createError } = await supabase
      .from('campaigns')
      .insert({
        campaign_id,
        name,
        description: description || '',
        banner_image_url: banner_image_url || '',
        logo_url: logo_url || '',
        category: category || 'General',
        total_pool,
        distributed_rewards: '0',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: false, // Admin activates after creation
        eligibility_criteria: eligibility_criteria || '',
        terms_url: terms_url || '',
        website_url: website_url || '',
        twitter_url: twitter_url || '',
        discord_url: discord_url || '',
        registered_apps_count: 0,
        total_transactions: 0,
        status,
        is_featured: is_featured || false,
        tags: tags || [],
        created_by: created_by.toLowerCase(),
        blockchain_tx_hash: blockchain_tx_hash || ''
      })
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json({
      success: true,
      campaign,
      message: 'Campaign created successfully'
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
