import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_hash, app_id, user_address } = body;

    // Validate required fields
    if (!transaction_hash) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: transaction_hash' },
        { status: 400 }
      );
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transaction_hash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Create provider for basic validation
    const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
    const contract = new ethers.Contract(
      SERVER_CONFIG.contractAddress,
      CROSS_ERA_REWARD_SYSTEM_ABI,
      provider
    );

    // Check if transaction hash already exists in SDK pending transactions
    const { data: existingTransaction } = await supabase
      .from('sdk_pending_transactions')
      .select('id, status')
      .eq('tx_hash', transaction_hash)
      .single();

    if (existingTransaction) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction already submitted for batch processing',
          data: {
            status: existingTransaction.status,
            submitted_at: existingTransaction.created_at
          }
        },
        { status: 409 }
      );
    }

    // Check if transaction has already been processed on-chain
    const isProcessed = await contract.processedTransactions(transaction_hash);
    if (isProcessed) {
      return NextResponse.json(
        { success: false, error: 'Transaction already processed on-chain' },
        { status: 409 }
      );
    }

    // Get transaction details from blockchain for validation
    const tx = await provider.getTransaction(transaction_hash);
    if (!tx) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found on blockchain' },
        { status: 404 }
      );
    }

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transaction_hash);
    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'Transaction receipt not found. Transaction may not be confirmed yet.' },
        { status: 404 }
      );
    }

    // Extract app_id from transaction data if not provided
    let finalAppId = app_id;
    if (!finalAppId) {
      try {
        if (!tx.data || tx.data === '0x') {
          return NextResponse.json(
            { success: false, error: 'Transaction data is empty. No app_id found.' },
            { status: 400 }
          );
        }
        
        // Decode UTF-8 string from hex data
        finalAppId = ethers.toUtf8String(tx.data);
        
        if (!finalAppId || finalAppId.trim().length === 0) {
          return NextResponse.json(
            { success: false, error: 'Could not extract app_id from transaction data' },
            { status: 400 }
          );
        }
      } catch (decodeError) {
        console.error('Error decoding app_id:', decodeError);
        return NextResponse.json(
          { success: false, error: 'Failed to decode app_id from transaction data' },
          { status: 400 }
        );
      }
    }

    // Check if app is registered on-chain
    const isAppRegistered = await contract.registeredApps(finalAppId);
    if (!isAppRegistered) {
      return NextResponse.json(
        { success: false, error: `App "${finalAppId}" is not registered on-chain` },
        { status: 404 }
      );
    }

    // Get final user address
    const finalUserAddress = user_address || tx.from.toLowerCase();

    // Get project ID from app_id
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('app_id', finalAppId)
      .single();

    if (!project) {
      return NextResponse.json(
        { success: false, error: `Project not found for app_id: ${finalAppId}` },
        { status: 404 }
      );
    }

    // Save to SDK pending transactions table
    const { data: savedTransaction, error: dbError } = await supabase
      .from('sdk_pending_transactions')
      .insert({
        tx_hash: transaction_hash,
        app_id: finalAppId,
        project_id: project.id,
        user_address: finalUserAddress,
        submitted_at: new Date().toISOString(),
        status: 'pending',
        retry_count: 0,
        max_retries: 3
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error saving SDK transaction:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save transaction for batch processing' },
        { status: 500 }
      );
    }

    console.log('SDK transaction submitted for batch processing:', {
      tx_hash: transaction_hash,
      app_id: finalAppId,
      user_address: finalUserAddress,
      project_id: project.id
    });

    return NextResponse.json({
      success: true,
      message: 'Transaction submitted for batch processing',
      data: {
        transaction_hash: transaction_hash,
        app_id: finalAppId,
        user_address: finalUserAddress,
        status: 'pending',
        estimated_processing_time: 'Next daily batch run',
        submitted_at: savedTransaction.created_at,
        id: savedTransaction.id
      }
    });

  } catch (error) {
    console.error('SDK submit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
