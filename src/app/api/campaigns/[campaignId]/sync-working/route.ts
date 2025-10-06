import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = supabaseAdmin!;

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

    // 1. Get smart contract data
    const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
    const contract = new ethers.Contract(
      SERVER_CONFIG.contractAddress,
      CROSS_ERA_REWARD_SYSTEM_ABI,
      provider
    );

    const contractData = await contract.getCampaign(campaignId);
    
    // Get registered apps count from blockchain
    const registeredAppsCount = await contract.getCampaignAppCount(campaignId);

    // 2. Update database with blockchain data
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update({
        is_active: contractData.active,
        total_pool: contractData.totalPool.toString(),
        distributed_rewards: contractData.distributedRewards.toString(),
        registered_apps_count: Number(registeredAppsCount)
      })
      .eq('campaign_id', campaignId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: `Database update failed: ${updateError.message}`,
        code: updateError.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      message: `Campaign ${campaignId} synced successfully`
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
