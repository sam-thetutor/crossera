import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = supabaseAdmin!;

export async function GET(request: NextRequest) {
  try {
    // Get campaign 14 specifically to check data types
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('campaign_id, name, is_active')
      .eq('campaign_id', 14)
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code
      });
    }

    return NextResponse.json({
      success: true,
      campaign,
      dataTypes: {
        campaign_id_type: typeof campaign.campaign_id,
        campaign_id_value: campaign.campaign_id,
        is_active_type: typeof campaign.is_active
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
