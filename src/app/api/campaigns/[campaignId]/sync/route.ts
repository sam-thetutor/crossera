import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/campaigns/[campaignId]/sync - Sync campaign data from smart contract to database
export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId: campaignIdParam } = await params;
    const campaignId = parseInt(campaignIdParam);
    
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // 1. Connect to smart contract
    const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
    const contract = new ethers.Contract(
      SERVER_CONFIG.contractAddress,
      CROSS_ERA_REWARD_SYSTEM_ABI,
      provider
    );

    // 2. Fetch campaign data from smart contract
    let contractData;
    try {
      contractData = await contract.getCampaign(campaignId);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: `Campaign ${campaignId} not found on smart contract` },
        { status: 404 }
      );
    }

    // 3. Check if campaign exists in database
    const { data: dbCampaign, error: dbError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    let campaignExistsInDb = true;
    if (dbError) {
      if (dbError.code === 'PGRST116') {
        campaignExistsInDb = false;
      } else {
        throw dbError;
      }
    }

    // 4. Prepare sync data
    const syncData = {
      is_active: contractData.active,
      total_pool: contractData.totalPool.toString(),
      distributed_rewards: contractData.distributedRewards.toString()
    };

    let updatedCampaign;

    if (campaignExistsInDb) {
      // 5a. Update existing campaign in database
      const { data, error: updateError } = await supabaseAdmin
        .from('campaigns')
        .update(syncData)
        .eq('campaign_id', campaignId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      updatedCampaign = data;
    } else {
      // 5b. Create new campaign in database with smart contract data
      const { data, error: createError } = await supabaseAdmin
        .from('campaigns')
        .insert({
          campaign_id: campaignId,
          name: `Campaign ${campaignId}`, // Default name
          description: 'Synced from smart contract',
          total_pool: syncData.total_pool,
          distributed_rewards: syncData.distributed_rewards,
          start_date: new Date(Number(contractData.startDate) * 1000).toISOString(),
          end_date: new Date(Number(contractData.endDate) * 1000).toISOString(),
          is_active: syncData.is_active,
          status: syncData.is_active ? 'active' : 'inactive',
          registered_apps_count: 0,
          total_transactions: 0,
          created_by: '0x0000000000000000000000000000000000000000', // Default address
          blockchain_tx_hash: ''
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      updatedCampaign = data;
    }

    // 6. Return success response
    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      contractData: {
        active: contractData.active,
        totalPool: ethers.formatEther(contractData.totalPool),
        distributedRewards: ethers.formatEther(contractData.distributedRewards),
        startDate: new Date(Number(contractData.startDate) * 1000).toISOString(),
        endDate: new Date(Number(contractData.endDate) * 1000).toISOString()
      },
      message: `Campaign ${campaignId} ${campaignExistsInDb ? 'synced' : 'created'} successfully`
    });

  } catch (error) {
    console.error('Campaign sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
