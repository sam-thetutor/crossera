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

    // Test database connection
    const { data: dbCampaign, error: dbError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: `Campaign ${campaignId} not found in database`,
          campaignExists: false
        });
      }
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      message: `Campaign ${campaignId} found in database`,
      campaignExists: true,
      campaign: dbCampaign
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
