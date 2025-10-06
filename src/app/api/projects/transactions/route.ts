import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = supabaseAdmin!;

// POST /api/projects/transactions - Record a new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_id,
      campaign_id,
      tx_hash,
      gas_used,
      gas_price,
      transaction_value,
      fee_generated,
      reward_calculated,
      transaction_type,
      verified_by
    } = body;

    // Validate required fields
    if (!project_id || !tx_hash) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: project_id, tx_hash' },
        { status: 400 }
      );
    }

    // Validate tx_hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(tx_hash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Check if transaction already exists
    const { data: existing } = await supabase
      .from('transactions')
      .select('tx_hash')
      .eq('tx_hash', tx_hash)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Transaction already recorded' },
        { status: 409 }
      );
    }

    // Insert transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        project_id,
        campaign_id: campaign_id || null,
        tx_hash,
        gas_used: gas_used || '0',
        gas_price: gas_price || '0',
        transaction_value: transaction_value || '0',
        fee_generated: fee_generated || '0',
        reward_calculated: reward_calculated || '0',
        transaction_type: transaction_type || 'Other',
        verified_by: verified_by || null
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update project transaction count
    const { error: updateError } = await supabase.rpc('increment_transaction_count', {
      p_project_id: project_id
    });

    if (updateError) {
      console.warn('Failed to increment transaction count:', updateError);
    }

    return NextResponse.json({
      success: true,
      transaction: data,
      message: 'Transaction recorded successfully'
    });

  } catch (error) {
    console.error('Record transaction error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET /api/projects/transactions - Get transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');
    const campaign_id = searchParams.get('campaign_id');
    const tx_hash = searchParams.get('tx_hash');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase.from('transactions').select(`
      *,
      projects:project_id (
        app_id,
        app_name,
        owner_address
      )
    `);

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    if (campaign_id) {
      query = query.eq('campaign_id', campaign_id);
    }

    if (tx_hash) {
      query = query.eq('tx_hash', tx_hash);
    }

    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      transactions: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

