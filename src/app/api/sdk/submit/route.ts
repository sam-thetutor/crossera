import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { supabaseAdmin } from '@/lib/supabase';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';

const supabase = supabaseAdmin!;

// Helper function to calculate estimated processing time
function getEstimatedProcessingTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0); // Next midnight UTC
  
  const hoursUntilProcessing = Math.ceil((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  return `~${hoursUntilProcessing} hours (next batch runs at 00:00 UTC)`;
}

// POST /api/sdk/submit - Submit transaction for batch processing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionHash, network, appId, userAddress } = body;

    // Validate required fields
    if (!transactionHash) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: transactionHash' },
        { status: 400 }
      );
    }

    if (!network) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: network' },
        { status: 400 }
      );
    }

    // Validate network
    if (!['testnet', 'mainnet'].includes(network)) {
      return NextResponse.json(
        { success: false, error: 'Invalid network. Must be "testnet" or "mainnet"' },
        { status: 400 }
      );
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Check if transaction already submitted for this network
    const { data: existing } = await supabase
      .from('sdk_pending_transactions')
      .select('id, status, submitted_at, network')
      .eq('transaction_hash', transactionHash)
      .eq('network', network)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Transaction already submitted for batch processing on ${network}`,
          data: {
            transaction_hash: transactionHash,
            network: existing.network,
            status: existing.status,
            submitted_at: existing.submitted_at,
            estimated_processing_time: getEstimatedProcessingTime()
          }
        },
        { status: 409 }
      );
    }

    // Get network configuration
    const networkConfig = network === 'mainnet' 
      ? { 
          rpcUrl: SERVER_CONFIG.rpcUrl, 
          contractAddress: SERVER_CONFIG.contractAddress 
        }
      : { 
          rpcUrl: process.env.TESTNET_RPC_URL || SERVER_CONFIG.rpcUrl, 
          contractAddress: process.env.TESTNET_CONTRACT_ADDRESS || SERVER_CONFIG.contractAddress 
        };

    // Extract app_id from transaction if not provided
    let extractedAppId = appId;
    let extractedUserAddress = userAddress;

    if (!extractedAppId || !extractedUserAddress) {
      try {
        const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
        const tx = await provider.getTransaction(transactionHash);
        
        if (!tx) {
          return NextResponse.json(
            { success: false, error: 'Transaction not found on blockchain' },
            { status: 404 }
          );
        }

        // Extract app_id from transaction data
        if (!extractedAppId && tx.data && tx.data !== '0x') {
          try {
            extractedAppId = ethers.toUtf8String(tx.data);
          } catch (e) {
            console.error('Error decoding app_id from tx.data:', e);
          }
        }

        // Extract user address from transaction
        if (!extractedUserAddress) {
          extractedUserAddress = tx.from;
        }
      } catch (error) {
        console.error('Error extracting transaction data:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to extract transaction data from blockchain' },
          { status: 400 }
        );
      }
    }

    if (!extractedAppId) {
      return NextResponse.json(
        { success: false, error: 'Could not extract app_id from transaction. Please provide appId parameter.' },
        { status: 400 }
      );
    }

    // Look up project_id from app_id (optional - makes data more complete)
    let projectId = null;
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('app_id', extractedAppId)
        .maybeSingle();
      
      if (project) {
        projectId = project.id;
      }
    } catch (error) {
      console.log('Could not look up project_id, will be set during batch processing');
    }

    // Verify app is registered on-chain (early validation to catch issues before batch processing)
    try {
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const contract = new ethers.Contract(
        networkConfig.contractAddress,
        CROSS_ERA_REWARD_SYSTEM_ABI,
        provider
      );
      
      const isRegistered = await contract.registeredApps(extractedAppId);
      if (!isRegistered) {
        return NextResponse.json(
          { success: false, error: `App "${extractedAppId}" is not registered on-chain on ${network}` },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error verifying app registration:', error);
      // Continue anyway - will be checked during batch processing
    }

    // Store transaction for batch processing
    const { data: pendingTx, error: insertError } = await supabase
      .from('sdk_pending_transactions')
      .insert({
        transaction_hash: transactionHash,
        app_id: extractedAppId,
        project_id: projectId, // Will be null if project not found, populated during batch processing
        user_address: extractedUserAddress?.toLowerCase(),
        network: network,
        status: 'pending',
        retry_count: 0,
        max_retries: 3
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing pending transaction:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to store transaction for processing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction submitted for batch processing',
      data: {
        id: pendingTx.id,
        transaction_hash: pendingTx.transaction_hash,
        app_id: pendingTx.app_id,
        user_address: pendingTx.user_address,
        network: pendingTx.network,
        status: pendingTx.status,
        submitted_at: pendingTx.submitted_at,
        estimated_processing_time: getEstimatedProcessingTime()
      }
    });

  } catch (error: any) {
    console.error('SDK submit error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
