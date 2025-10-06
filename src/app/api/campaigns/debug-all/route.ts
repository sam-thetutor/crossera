import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = supabaseAdmin!;

export async function GET(request: NextRequest) {
  try {
    // Get all campaigns from database
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('campaign_id, name, is_active')
      .order('campaign_id', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      campaigns: campaigns || []
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
