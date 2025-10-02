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
    const { transaction_hash } = body;

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

    // Create provider with retry configuration
    const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl, undefined, {
      staticNetwork: true,
    });
    
    // Add timeout to prevent hanging requests
    provider.pollingInterval = 8000; // 8 seconds
    
    const contract = new ethers.Contract(
      SERVER_CONFIG.contractAddress,
      CROSS_ERA_REWARD_SYSTEM_ABI,
      provider
    );

    // Check if transaction has already been processed on-chain
    const isProcessed = await contract.processedTransactions(transaction_hash);
    if (isProcessed) {
      return NextResponse.json(
        { success: false, error: 'Transaction already processed on-chain' },
        { status: 409 }
      );
    }

    // Get transaction details from blockchain
    const tx = await provider.getTransaction(transaction_hash);
    if (!tx) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found on blockchain' },
        { status: 404 }
      );
    }

    // Get transaction receipt for gas usage
    const receipt = await provider.getTransactionReceipt(transaction_hash);
    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'Transaction receipt not found. Transaction may not be confirmed yet.' },
        { status: 404 }
      );
    }

    // Extract app_id from transaction data field
    let appId: string;
    try {
      if (!tx.data || tx.data === '0x') {
        return NextResponse.json(
          { success: false, error: 'Transaction data is empty. No app_id found.' },
          { status: 400 }
        );
      }
      
      // Decode UTF-8 string from hex data
      appId = ethers.toUtf8String(tx.data);
      
      if (!appId || appId.trim().length === 0) {
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

    // Check if app is registered on-chain
    const isAppRegistered = await contract.registeredApps(appId);
    if (!isAppRegistered) {
      return NextResponse.json(
        { success: false, error: `App "${appId}" is not registered on-chain` },
        { status: 404 }
      );
    }

    // Get registered campaigns for this app
    const registeredCampaigns = await contract.getAppRegisteredCampaigns(appId);
    if (registeredCampaigns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'App is not registered for any active campaigns' },
        { status: 400 }
      );
    }

    // Calculate transaction metrics
    const gasUsed = receipt.gasUsed;
    const gasPrice = tx.gasPrice || BigInt(0);
    const feeGenerated = gasUsed * gasPrice;
    const transactionValue = tx.value || BigInt(0);

    // Create verifier wallet with private key
    if (!process.env.VERIFIER_PRIVATE_KEY) {
      console.error('VERIFIER_PRIVATE_KEY not found in environment');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Verifier wallet not configured' },
        { status: 500 }
      );
    }

    const verifierWallet = new ethers.Wallet(
      process.env.VERIFIER_PRIVATE_KEY,
      provider
    );

    // Create contract instance with verifier wallet (for signing)
    const contractWithSigner = new ethers.Contract(
      SERVER_CONFIG.contractAddress,
      CROSS_ERA_REWARD_SYSTEM_ABI,
      verifierWallet
    );

    // Call processTransaction on-chain
    console.log('Processing transaction on-chain:', {
      appId,
      txHash: transaction_hash,
      gasUsed: gasUsed.toString(),
      gasPrice: gasPrice.toString(),
      value: transactionValue.toString(),
      campaignsToUpdate: registeredCampaigns.length
    });

    const processTx = await contractWithSigner.processTransaction(
      appId,
      transaction_hash,
      gasUsed,
      gasPrice,
      transactionValue
    );

    // Wait for transaction confirmation
    const processReceipt = await processTx.wait();
    
    console.log('Transaction processed on-chain:', {
      processHash: processReceipt.hash,
      blockNumber: processReceipt.blockNumber
    });

    // Save transaction to database
    const { data: savedTransaction, error: dbError } = await supabase
      .from('transactions')
      .insert({
        transaction_hash,
        app_id: appId,
        from_address: tx.from,
        to_address: tx.to,
        amount: transactionValue.toString(),
        gas_used: gasUsed.toString(),
        gas_price: gasPrice.toString(),
        fee_generated: feeGenerated.toString(),
        block_number: receipt.blockNumber,
        timestamp: new Date().toISOString(),
        status: 'processed',
        process_tx_hash: processReceipt.hash
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request if DB save fails - transaction is already processed on-chain
    }

    // Get updated metrics for all campaigns
    const campaignMetrics = await Promise.all(
      registeredCampaigns.map(async (campaignId: number) => {
        const metrics = await contract.getAppCampaignMetrics(appId, campaignId);
        return {
          campaignId: Number(campaignId),
          totalFees: metrics.totalFees.toString(),
          totalVolume: metrics.totalVolume.toString(),
          txCount: Number(metrics.txCount),
          estimatedReward: ethers.formatEther(metrics.estimatedReward)
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Transaction processed successfully',
      data: {
        transactionHash: transaction_hash,
        appId,
        processedAt: new Date().toISOString(),
        processTxHash: processReceipt.hash,
        metrics: {
          gasUsed: gasUsed.toString(),
          gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei',
          feeGenerated: ethers.formatEther(feeGenerated) + ' XFI',
          transactionValue: ethers.formatEther(transactionValue) + ' XFI'
        },
        campaignsUpdated: registeredCampaigns.length,
        campaignMetrics
      }
    });

  } catch (error: any) {
    console.error('Transaction submission error:', error);
    
    // Handle specific error types
    if (error.code === 'SERVER_ERROR' || error.code === 'NETWORK_ERROR') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CrossFi RPC node is temporarily unavailable. Please try again in a few moments.',
          retryable: true 
        },
        { status: 503 }
      );
    }
    
    if (error.code === 'TIMEOUT') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Request timed out. The network may be congested. Please try again.',
          retryable: true 
        },
        { status: 504 }
      );
    }
    
    if (error.code === 'CALL_EXCEPTION') {
      return NextResponse.json(
        { success: false, error: 'Contract call failed. The transaction may already be processed or app not registered.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transaction_hash = searchParams.get('transaction_hash');

    if (!transaction_hash) {
      return NextResponse.json(
        { success: false, error: 'Transaction hash is required' },
        { status: 400 }
      );
    }

    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
    const contract = new ethers.Contract(SERVER_CONFIG.contractAddress, CROSS_ERA_REWARD_SYSTEM_ABI, provider);

    // Check if transaction has been processed
    const isProcessed = await contract.isTransactionProcessed(transaction_hash);

    return NextResponse.json({
      success: true,
      transactionHash: transaction_hash,
      isProcessed: isProcessed,
      status: isProcessed ? 'processed' : 'pending'
    });

  } catch (error) {
    console.error('Get transaction status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
