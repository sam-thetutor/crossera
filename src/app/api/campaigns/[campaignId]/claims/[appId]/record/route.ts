import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/campaigns/[campaignId]/claims/[appId]/record - Record a successful claim
export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string; appId: string } }
) {
  try {
    const { campaignId, appId } = params;
    const body = await request.json();
    const { claimTxHash, claimAmount, claimedBy } = body;

    if (!claimTxHash || !claimAmount || !claimedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: claimTxHash, claimAmount, claimedBy' },
        { status: 400 }
      );
    }

    // Verify app exists and get project info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, created_by, app_id')
      .eq('app_id', appId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found for this app ID' },
        { status: 404 }
      );
    }

    // Verify the claimedBy address matches the project owner
    if (project.created_by.toLowerCase() !== claimedBy.toLowerCase()) {
      return NextResponse.json(
        { 
          error: 'Unauthorized: You can only claim rewards for your own apps',
          details: `App owner: ${project.created_by}, Your address: ${claimedBy}`
        },
        { status: 403 }
      );
    }

    // Record the claim in the database
    const { data: claimRecord, error: recordError } = await supabase
      .from('campaign_claims')
      .insert({
        campaign_id: parseInt(campaignId),
        app_id: appId,
        claim_tx_hash: claimTxHash,
        claim_amount: claimAmount,
        claimed_by: claimedBy,
        claimed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (recordError) {
      console.error('Error recording claim:', recordError);
      return NextResponse.json(
        { error: 'Failed to record claim in database' },
        { status: 500 }
      );
    }

    // Update the campaign's distributed_rewards
    // First get current distributed rewards
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('distributed_rewards')
      .eq('campaign_id', parseInt(campaignId))
      .single();

    if (!campaignError && campaign) {
      const currentDistributed = parseFloat(campaign.distributed_rewards || '0');
      const claimAmountFloat = parseFloat(claimAmount);
      const newDistributed = currentDistributed + claimAmountFloat;

      // Update the campaign with new distributed amount
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ 
          distributed_rewards: newDistributed.toString()
        })
        .eq('campaign_id', parseInt(campaignId));

      if (updateError) {
        console.error('Error updating campaign distributed rewards:', updateError);
        // Don't fail the request - the claim was recorded successfully
      } else {
        console.log(`Updated campaign ${campaignId} distributed rewards from ${currentDistributed} to ${newDistributed}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Claim recorded successfully',
      data: claimRecord,
    });

  } catch (error) {
    console.error('Record claim error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
