import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const app_id = searchParams.get('app_id');
    const campaign_id = searchParams.get('campaign_id');

    if (!app_id) {
      return NextResponse.json(
        { success: false, error: 'App ID is required' },
        { status: 400 }
      );
    }

    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
    const contract = new ethers.Contract(SERVER_CONFIG.contractAddress, CROSS_ERA_REWARD_SYSTEM_ABI, provider);

    // Check if app is registered
    const isAppRegistered = await contract.registeredApps(app_id);
    if (!isAppRegistered) {
      return NextResponse.json(
        { success: false, error: 'App not registered' },
        { status: 404 }
      );
    }

    // Get claimable rewards for specific campaign or all campaigns
    if (campaign_id) {
      const claimableRewards = await contract.getClaimableRewards(app_id, campaign_id);
      return NextResponse.json({
        success: true,
        appId: app_id,
        campaignId: campaign_id,
        claimableRewards: claimableRewards.toString(),
        claimableRewardsFormatted: ethers.formatEther(claimableRewards)
      });
    } else {
      // For now, return mock data for all campaigns
      // In production, you would query all campaigns and get rewards for each
      return NextResponse.json({
        success: true,
        appId: app_id,
        totalClaimableRewards: '0',
        totalClaimableRewardsFormatted: '0.0',
        campaigns: [
          {
            campaignId: 1,
            claimableRewards: '0',
            claimableRewardsFormatted: '0.0'
          },
          {
            campaignId: 2,
            claimableRewards: '0',
            claimableRewardsFormatted: '0.0'
          }
        ]
      });
    }

  } catch (error) {
    console.error('Get app balance error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
