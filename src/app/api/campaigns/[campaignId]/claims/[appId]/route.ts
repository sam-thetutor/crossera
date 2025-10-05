import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/campaigns/[campaignId]/claims/[appId]
// Execute claim rewards for a specific app in a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string; appId: string } }
) {
  try {
    const { campaignId, appId } = params;
    const campaignIdNum = parseInt(campaignId);

    if (isNaN(campaignIdNum)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    const { userAddress, signature } = body;

    if (!userAddress || !signature) {
      return NextResponse.json(
        { error: 'User address and signature are required' },
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

    // Verify user owns the app
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, app_name, created_by')
      .eq('created_by', userAddress.toLowerCase())
      .eq('app_id', appId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'App not found or you do not have permission to claim for this app' },
        { status: 403 }
      );
    }

    // Check if claim already exists
    const { data: existingClaim, error: existingClaimError } = await supabase
      .from('campaign_claims')
      .select('*')
      .eq('app_id', appId)
      .eq('campaign_id', campaignIdNum)
      .single();

    if (existingClaimError && existingClaimError.code !== 'PGRST116') {
      console.error('Error checking existing claim:', existingClaimError);
      return NextResponse.json(
        { error: 'Failed to check existing claims' },
        { status: 500 }
      );
    }

    if (existingClaim) {
      return NextResponse.json(
        { 
          error: 'Rewards have already been claimed for this app in this campaign',
          data: {
            claimTxHash: existingClaim.claim_tx_hash,
            claimedAt: existingClaim.claimed_at,
            claimAmount: existingClaim.claim_amount
          }
        },
        { status: 409 }
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

    // Check if campaign has started (can't claim before campaign starts)
    const currentTime = Math.floor(Date.now() / 1000);
    const hasCampaignStarted = currentTime >= campaign.start_date;

    if (!hasCampaignStarted) {
      return NextResponse.json(
        { error: 'Campaign has not started yet' },
        { status: 400 }
      );
    }

    // Note: We allow claims even after campaign ends, as long as it has started

    // Check if app is registered for this campaign
    if (!campaign.registered_apps || !campaign.registered_apps.includes(appId)) {
      return NextResponse.json(
        { error: 'App is not registered for this campaign' },
        { status: 400 }
      );
    }

    // Get app metrics from smart contract
    const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
    const contract = new ethers.Contract(
      SERVER_CONFIG.contractAddress,
      CROSS_ERA_REWARD_SYSTEM_ABI,
      provider
    );
    const appMetrics = await contract.getAppCampaignMetrics(appId, campaignIdNum);
    
    // Calculate claimable amount (70% fees + 30% volume)
    const feesGenerated = parseFloat(ethers.formatEther(appMetrics.totalFees));
    const volumeGenerated = parseFloat(ethers.formatEther(appMetrics.totalVolume));
    const estimatedReward = parseFloat(ethers.formatEther(appMetrics.estimatedReward));

    if (estimatedReward <= 0) {
      return NextResponse.json(
        { error: 'No rewards available to claim for this app' },
        { status: 400 }
      );
    }

    // Execute claim on smart contract using verifier wallet
    try {
      const verifierWallet = new ethers.Wallet(process.env.VERIFIER_PRIVATE_KEY!, provider);
      const contractWithSigner = contract.connect(verifierWallet);
      
      const claimTx = await contractWithSigner.claimRewards(appId, campaignIdNum as number);
      const claimReceipt = await claimTx.wait();

      if (!claimReceipt) {
        return NextResponse.json(
          { error: 'Claim transaction failed' },
          { status: 500 }
        );
      }

      // Save claim record to database
      const { data: savedClaim, error: saveError } = await supabase
        .from('campaign_claims')
        .insert({
          app_id: appId,
          campaign_id: campaignIdNum,
          claim_amount: estimatedReward.toString(),
          claim_tx_hash: claimReceipt.hash,
          claimed_by: userAddress.toLowerCase()
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving claim to database:', saveError);
        // Note: Claim was successful on blockchain, but failed to save to database
        // This is a critical issue that should be handled
        return NextResponse.json(
          { 
            error: 'Claim was successful on blockchain but failed to save to database',
            warning: 'Please contact support',
            data: {
              claimTxHash: claimReceipt.hash,
              claimAmount: estimatedReward.toString()
            }
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Rewards claimed successfully',
        data: {
          claimTxHash: claimReceipt.hash,
          claimAmount: estimatedReward.toString(),
          feesGenerated: feesGenerated.toString(),
          volumeGenerated: volumeGenerated.toString(),
          gasUsed: claimReceipt.gasUsed?.toString() || '0',
          blockNumber: claimReceipt.blockNumber,
          timestamp: new Date().toISOString(),
          claimRecord: savedClaim
        }
      });

    } catch (contractError: any) {
      console.error('Smart contract claim error:', contractError);
      
      // Handle specific contract errors
      if (contractError.message?.includes('Already claimed')) {
        return NextResponse.json(
          { error: 'Rewards have already been claimed for this app in this campaign' },
          { status: 409 }
        );
      }
      
      if (contractError.message?.includes('Campaign not active')) {
        return NextResponse.json(
          { error: 'Campaign is not active or has ended' },
          { status: 400 }
        );
      }

      if (contractError.message?.includes('No rewards')) {
        return NextResponse.json(
          { error: 'No rewards available to claim for this app' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to claim rewards on blockchain',
          details: contractError.message || 'Unknown contract error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in POST /api/campaigns/[campaignId]/claims/[appId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
