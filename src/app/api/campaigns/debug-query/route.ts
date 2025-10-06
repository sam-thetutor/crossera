import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = supabaseAdmin!;

export async function GET(request: NextRequest) {
  try {
    // Try different query approaches
    const results: any = {};

    // 1. Simple select all
    const { data: allCampaigns, error: allError } = await supabase
      .from('campaigns')
      .select('*');
    results.allCampaigns = { data: allCampaigns, error: allError?.message };

    // 2. Select with eq
    const { data: eqCampaign, error: eqError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', 14);
    results.eqCampaign = { data: eqCampaign, error: eqError?.message };

    // 3. Select with string eq
    const { data: stringEqCampaign, error: stringEqError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', '14');
    results.stringEqCampaign = { data: stringEqCampaign, error: stringEqError?.message };

    // 4. Update without single()
    const { data: updateTest, error: updateTestError } = await supabase
      .from('campaigns')
      .update({ is_active: true })
      .eq('campaign_id', 14)
      .select();
    results.updateTest = { data: updateTest, error: updateTestError?.message };

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
