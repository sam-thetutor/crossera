import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/profile/claims
// Get user's claims history and total rewards
export async function GET(request: NextRequest) {
  try {
    // Get user address from query params
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

    // Get pagination parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      );
    }

    // Get user's total rewards summary
    const { data: totalRewardsData, error: totalRewardsError } = await supabase
      .rpc('get_user_total_rewards', {
        p_user_address: userAddress.toLowerCase()
      });

    if (totalRewardsError) {
      console.error('Error fetching total rewards:', totalRewardsError);
      return NextResponse.json(
        { error: 'Failed to fetch total rewards' },
        { status: 500 }
      );
    }

    const totalRewards = totalRewardsData?.[0] || {
      total_rewards: '0',
      total_claims: 0,
      total_fees_generated: '0',
      total_volume_generated: '0'
    };

    // Get user's claims history
    const { data: claimsHistory, error: claimsHistoryError } = await supabase
      .rpc('get_user_claims_history', {
        p_user_address: userAddress.toLowerCase(),
        p_limit: limit,
        p_offset: offset
      });

    if (claimsHistoryError) {
      console.error('Error fetching claims history:', claimsHistoryError);
      return NextResponse.json(
        { error: 'Failed to fetch claims history' },
        { status: 500 }
      );
    }

    // Get additional analytics data
    const { data: monthlyRewards, error: monthlyError } = await supabase
      .from('campaign_claims')
      .select(`
        claim_amount,
        claimed_at,
        campaigns!inner(name)
      `)
      .eq('claimed_by', userAddress.toLowerCase())
      .gte('claimed_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) // Last year
      .order('claimed_at', { ascending: false });

    if (monthlyError) {
      console.error('Error fetching monthly rewards:', monthlyError);
    }

    // Process monthly rewards data
    const monthlyData = monthlyRewards?.reduce((acc, claim) => {
      const month = new Date(claim.claimed_at).toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += parseFloat(claim.claim_amount || '0');
      return acc;
    }, {} as Record<string, number>) || {};

    // Get top performing apps by rewards
    const { data: topApps, error: topAppsError } = await supabase
      .from('campaign_claims')
      .select(`
        app_id,
        claim_amount,
        projects!inner(name, app_id)
      `)
      .eq('claimed_by', userAddress.toLowerCase())
      .order('claim_amount', { ascending: false })
      .limit(5);

    if (topAppsError) {
      console.error('Error fetching top apps:', topAppsError);
    }

    const topAppsData = topApps?.map(app => ({
      appId: app.app_id,
      appName: app.projects.name,
      totalRewards: app.claim_amount
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRewards: totalRewards.total_rewards,
          totalClaims: totalRewards.total_claims,
          totalFeesGenerated: totalRewards.total_fees_generated,
          totalVolumeGenerated: totalRewards.total_volume_generated,
          averageClaimAmount: totalRewards.total_claims > 0 
            ? (parseFloat(totalRewards.total_rewards) / totalRewards.total_claims).toString()
            : '0'
        },
        claimsHistory: claimsHistory || [],
        analytics: {
          monthlyRewards: Object.entries(monthlyData).map(([month, amount]) => ({
            month,
            amount: amount.toString()
          })),
          topApps: topAppsData,
          claimsByCampaign: claimsHistory?.reduce((acc, claim) => {
            if (!acc[claim.campaign_id]) {
              acc[claim.campaign_id] = {
                campaignId: claim.campaign_id,
                campaignName: claim.campaign_name,
                totalClaims: 0,
                totalAmount: 0
              };
            }
            acc[claim.campaign_id].totalClaims += 1;
            acc[claim.campaign_id].totalAmount += parseFloat(claim.claim_amount || '0');
            return acc;
          }, {} as Record<number, any>) || {}
        },
        pagination: {
          limit,
          offset,
          total: claimsHistory?.[0]?.total_claims || 0,
          hasMore: (claimsHistory?.length || 0) === limit
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/profile/claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
