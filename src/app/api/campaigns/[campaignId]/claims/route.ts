import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/campaigns/[campaignId]/claims
// Get campaign claims data for the authenticated user
export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;
    const campaignIdNum = parseInt(campaignId);

    if (isNaN(campaignIdNum)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Get user address from query params (will be provided by frontend)
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }

    // Validate user address format
    if (!ethers.isAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid user address format' },
        { status: 400 }
      );
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', campaignIdNum)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get campaign claims data using the database function
    const { data: claimsData, error: claimsError } = await supabase
      .rpc('get_campaign_claims_data', {
        p_campaign_id: campaignIdNum,
        p_user_address: userAddress.toLowerCase()
      });

    if (claimsError) {
      console.error('Error fetching claims data:', claimsError);
      return NextResponse.json(
        { error: 'Failed to fetch claims data' },
        { status: 500 }
      );
    }

    // Fetch actual estimated rewards from smart contract
    let contractRewards: Record<string, string> = {};
    try {
      const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
      const contract = new ethers.Contract(
        SERVER_CONFIG.contractAddress,
        CROSS_ERA_REWARD_SYSTEM_ABI,
        provider
      );

      // Get actual estimated rewards from contract for each app
      for (const claim of claimsData || []) {
        try {
          const metrics = await contract.getAppCampaignMetrics(claim.app_id, campaignIdNum);
          contractRewards[claim.app_id] = metrics.estimatedReward.toString();
        } catch (err) {
          console.error(`Error fetching metrics for app ${claim.app_id}:`, err);
          // Fallback to database calculation
          contractRewards[claim.app_id] = claim.estimated_reward;
        }
      }
    } catch (err) {
      console.error('Error fetching contract rewards:', err);
      // Fallback to database calculations
      claimsData?.forEach((claim: any) => {
        contractRewards[claim.app_id] = claim.estimated_reward;
      });
    }

    // Calculate campaign reward pool information
    const currentTime = Math.floor(Date.now() / 1000);
    const isCampaignActive = campaign.active && 
                            currentTime >= campaign.start_date && 
                            currentTime <= campaign.end_date;
    const isCampaignEnded = campaign.active && currentTime > campaign.end_date;

    // Get total distributed rewards for this campaign
    const { data: distributedRewards, error: distributedError } = await supabase
      .from('campaign_claims')
      .select('claim_amount')
      .eq('campaign_id', campaignIdNum);

    if (distributedError) {
      console.error('Error fetching distributed rewards:', distributedError);
    }

    // Get actual campaign data from smart contract for accurate pool information
    let contractCampaignData = null;
    try {
      const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
      const contract = new ethers.Contract(
        SERVER_CONFIG.contractAddress,
        CROSS_ERA_REWARD_SYSTEM_ABI,
        provider
      );
      
      contractCampaignData = await contract.getCampaign(campaignIdNum);
    } catch (err) {
      console.error('Error fetching campaign from contract:', err);
    }

    const totalDistributed = distributedRewards?.reduce((sum, claim) => {
      return sum + parseFloat(claim.claim_amount || '0');
    }, 0) || 0;

    // Use contract data if available, otherwise fallback to database
    const rewardPool = contractCampaignData ? contractCampaignData.totalPool.toString() : campaign.reward_pool;
    const contractDistributed = contractCampaignData ? contractCampaignData.distributedRewards.toString() : totalDistributed.toString();
    const remainingRewards = parseFloat(rewardPool || '0') - parseFloat(contractDistributed || '0');

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          rewardPool: rewardPool,
          totalDistributed: contractDistributed,
          remainingRewards: remainingRewards.toString(),
          isActive: isCampaignActive,
          isEnded: isCampaignEnded,
          startDate: campaign.start_date,
          endDate: campaign.end_date,
          registeredApps: campaign.registered_apps || []
        },
        userApps: claimsData?.map((app: any) => {
          const reward = contractRewards[app.app_id] || app.estimated_reward;
          const hasRewards = parseFloat(reward || '0') > 0;
          const canClaim = !app.already_claimed && hasRewards;
          
          return {
            ...app,
            estimated_reward: reward,
            can_claim: canClaim
          };
        }) || [],
        summary: {
          totalApps: claimsData?.length || 0,
          claimableApps: claimsData?.filter(app => app.can_claim && !app.already_claimed).length || 0,
          claimedApps: claimsData?.filter(app => app.already_claimed).length || 0,
          totalEstimatedRewards: claimsData?.reduce((sum, app) => {
            const reward = contractRewards[app.app_id] || app.estimated_reward;
            if (app.can_claim && !app.already_claimed) {
              return sum + parseFloat(reward || '0');
            }
            return sum;
          }, 0).toString() || '0'
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/campaigns/[campaignId]/claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
