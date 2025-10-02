import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { campaignService } from '@/lib/campaignService';

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
      campaigns = await campaignService.getCampaignsByCreator(creator);
    } else if (search) {
      campaigns = await campaignService.searchCampaigns(search);
    } else if (featured === 'true') {
      campaigns = await campaignService.getFeaturedCampaigns();
    } else if (active === 'true') {
      campaigns = await campaignService.getActiveCampaigns();
    } else if (status) {
      campaigns = await campaignService.getCampaignsByStatus(status);
    } else {
      campaigns = await campaignService.getAllCampaigns();
    }

    // Get stats if requested
    const includeStats = searchParams.get('include_stats') === 'true';
    let stats = null;
    if (includeStats) {
      stats = await campaignService.getCampaignStats();
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
    const exists = await campaignService.campaignIdExists(campaign_id);
    if (exists) {
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
    const campaign = await campaignService.createCampaign({
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
    });

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
