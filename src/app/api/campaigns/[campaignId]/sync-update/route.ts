import { NextRequest, NextResponse } from 'next/server';
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

    // Test database update
    const updateData = {
      is_active: true,
      total_pool: '10000000000000000', // 0.01 XFI
      distributed_rewards: '0'
    };

    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('campaign_id', campaignId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: `Campaign ${campaignId} updated successfully`,
      campaign: updatedCampaign
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
