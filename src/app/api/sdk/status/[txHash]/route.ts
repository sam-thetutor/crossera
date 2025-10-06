import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = supabaseAdmin!;

// GET /api/sdk/status/[txHash] - Get transaction processing status
export async function GET(
  request: NextRequest,
  { params }: { params: { txHash: string } }
) {
  try {
    const { txHash } = await params;
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network'); // Optional network filter

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Build query - fetch transaction first, then join batch info if needed
    let query = supabase
      .from('sdk_pending_transactions')
      .select('*')
      .eq('transaction_hash', txHash);

    // Filter by network if provided
    if (network) {
      if (!['testnet', 'mainnet'].includes(network)) {
        return NextResponse.json(
          { success: false, error: 'Invalid network. Must be "testnet" or "mainnet"' },
          { status: 400 }
        );
      }
      query = query.eq('network', network);
    }

    const { data: pendingTxs, error } = await query;

    if (error) {
      console.error('Error fetching transaction status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch transaction status' },
        { status: 500 }
      );
    }

    // If network filter provided, expect single result
    if (network) {
      const pendingTx = pendingTxs?.[0];
      
      if (!pendingTx) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Transaction not found in batch processing queue on ${network}` 
          },
          { status: 404 }
        );
      }

      const statusData = await buildStatusData(pendingTx);
      return NextResponse.json({
        success: true,
        data: statusData
      });
    }

    // Without network filter, return all matching transactions
    if (!pendingTxs || pendingTxs.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction not found in batch processing queue' 
        },
        { status: 404 }
      );
    }

    // If multiple networks, return array
    if (pendingTxs.length > 1) {
      const dataArray = await Promise.all(pendingTxs.map(tx => buildStatusData(tx)));
      return NextResponse.json({
        success: true,
        data: dataArray
      });
    }

    // Single result
    const statusData = await buildStatusData(pendingTxs[0]);
    return NextResponse.json({
      success: true,
      data: statusData
    });

  } catch (error: any) {
    console.error('SDK status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper to build status data
async function buildStatusData(pendingTx: any) {
  // Calculate estimated processing time for pending transactions
  let estimatedProcessingTime = null;
  if (pendingTx.status === 'pending') {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    const hoursUntil = Math.ceil((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
    estimatedProcessingTime = `~${hoursUntil} hours`;
  }

  // Fetch batch info if batch_id exists
  let batchInfo = null;
  if (pendingTx.batch_id) {
    const { data: batch } = await supabase
      .from('sdk_batch_runs')
      .select('id, started_at, completed_at, status')
      .eq('id', pendingTx.batch_id)
      .maybeSingle();
    
    if (batch) {
      batchInfo = {
        id: batch.id,
        started_at: batch.started_at,
        completed_at: batch.completed_at,
        status: batch.status
      };
    }
  }

  return {
    transaction_hash: pendingTx.transaction_hash,
    app_id: pendingTx.app_id,
    user_address: pendingTx.user_address,
    network: pendingTx.network,
    status: pendingTx.status,
    submitted_at: pendingTx.submitted_at,
    processed_at: pendingTx.processed_at,
    process_tx_hash: pendingTx.process_tx_hash,
    error_message: pendingTx.error_message,
    retry_count: pendingTx.retry_count,
    max_retries: pendingTx.max_retries,
    estimated_processing_time: estimatedProcessingTime,
    batch_info: batchInfo
  };
}

