import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Test update with regular client
    const { data: updateResult, error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        name: 'Updated Campaign 14',
        is_active: true 
      })
      .eq('campaign_id', 14)
      .select();

    // Test update with admin client
    const { data: adminUpdateResult, error: adminUpdateError } = await supabaseAdmin
      .from('campaigns')
      .update({ 
        name: 'Admin Updated Campaign 14',
        is_active: true 
      })
      .eq('campaign_id', 14)
      .select();

    return NextResponse.json({
      success: true,
      regularClient: {
        result: updateResult,
        error: updateError?.message,
        rowsUpdated: updateResult?.length || 0
      },
      adminClient: {
        result: adminUpdateResult,
        error: adminUpdateError?.message,
        rowsUpdated: adminUpdateResult?.length || 0
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
