import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { txHash: string } }
) {
  try {
    const { txHash } = params;

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Get transaction status from database
    const { data: transaction, error } = await supabase
      .from('sdk_pending_transactions')
      .select(`
        id,
        tx_hash,
        app_id,
        user_address,
        status,
        submitted_at,
        processed_at,
        batch_id,
        retry_count,
        max_retries,
        error_message,
        created_at
      `)
      .eq('tx_hash', txHash)
      .single();

    if (error || !transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found in SDK processing queue' },
        { status: 404 }
      );
    }

    // Get batch run information if processed
    let batchInfo = null;
    if (transaction.batch_id) {
      const { data: batchRun } = await supabase
        .from('sdk_batch_runs')
        .select('id, started_at, completed_at, status')
        .eq('id', transaction.batch_id)
        .single();
      
      if (batchRun) {
        batchInfo = batchRun;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction_hash: transaction.tx_hash,
        app_id: transaction.app_id,
        user_address: transaction.user_address,
        status: transaction.status,
        submitted_at: transaction.submitted_at,
        processed_at: transaction.processed_at,
        batch_id: transaction.batch_id,
        retry_count: transaction.retry_count,
        max_retries: transaction.max_retries,
        error_message: transaction.error_message,
        batch_info: batchInfo
      }
    });

  } catch (error) {
    console.error('SDK status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
