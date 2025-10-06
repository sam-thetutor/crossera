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

    // Check if transaction already exists in database
    const { data: existingTx, error: checkError } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_hash', transaction_hash)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing transaction:', checkError);
    }

    if (existingTx) {
      console.log('Transaction already processed:', transaction_hash);
      return NextResponse.json({
        success: true,
        message: 'Transaction already processed',
        transaction: existingTx,
        alreadyProcessed: true
      });
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

    // ==================== UNIQUE USER TRACKING (OFF-CHAIN) ====================
    
    // Get project ID from app_id
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('app_id', appId)
      .single();

    if (!project) {
      return NextResponse.json(
        { success: false, error: `Project not found for app_id: ${appId}` },
        { status: 404 }
      );
    }

    const projectId = project.id;
    const userAddress = tx.from.toLowerCase();
    
    // Check if this is a new unique user for this project
    const { data: existingUser } = await supabase
      .from('project_unique_users')
      .select('id, total_transactions, total_volume, total_fees, total_rewards')
      .eq('project_id', projectId)
      .eq('user_address', userAddress)
      .single();
    
    const isNewUniqueUser = !existingUser;
    
    // Calculate estimated reward (10% of gas fee, with minimum)
    const estimatedReward = feeGenerated / BigInt(10); // 10% of gas fee
    const minReward = BigInt(1000000000000000); // 0.001 XFI minimum
    const finalReward = estimatedReward > minReward ? estimatedReward : minReward;
    
    if (isNewUniqueUser) {
      // Insert new unique user
      const { error: userError } = await supabase.rpc('insert_new_unique_user', {
        p_project_id: projectId,
        p_user_address: userAddress,
        p_transaction_volume: transactionValue.toString(),
        p_transaction_fees: feeGenerated.toString(),
        p_transaction_rewards: finalReward.toString()
      });
      
      if (userError) {
        console.error('Error inserting new unique user:', userError);
      }
      
      console.log('New unique user tracked:', {
        projectId,
        userAddress,
        appId,
        isNewUser: true
      });
    } else {
      // Update existing user stats
      const { error: updateError } = await supabase.rpc('update_existing_user_stats', {
        p_project_id: projectId,
        p_user_address: userAddress,
        p_transaction_volume: transactionValue.toString(),
        p_transaction_fees: feeGenerated.toString(),
        p_transaction_rewards: finalReward.toString()
      });
      
      if (updateError) {
        console.error('Error updating existing user stats:', updateError);
      }
      
      console.log('Existing user stats updated:', {
        projectId,
        userAddress,
        appId,
        isNewUser: false,
        totalTransactions: existingUser.total_transactions + 1
      });
    }
    
    // ==================== END UNIQUE USER TRACKING ====================

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

    // Save transaction to database with user tracking data
    // Insert one transaction record for each registered campaign
    const transactionInserts = registeredCampaigns.map((campaignId: number) => ({
      tx_hash: transaction_hash,
      app_id: appId,
      project_id: projectId,
      campaign_id: Number(campaignId),
      from_address: tx.from,
      to_address: tx.to,
      user_address: userAddress,
      amount: transactionValue.toString(),
      gas_used: gasUsed.toString(),
      gas_price: gasPrice.toString(),
      fee_generated: feeGenerated.toString(),
      block_number: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      status: 'processed',
      process_tx_hash: processReceipt.hash,
      is_unique_user: isNewUniqueUser,
      reward_calculated: finalReward.toString()
    }));

    const { data: savedTransactions, error: dbError } = await supabase
      .from('transactions')
      .insert(transactionInserts)
      .select();

    if (dbError) {
      console.error('Database error:', dbError);
      
      // If it's a duplicate key error, it means the transaction was already saved
      // This can happen in rare race conditions - it's not a critical error
      if (dbError.code === '23505') {
        console.log('Transaction already exists in database (race condition), continuing...');
      } else {
        // For other errors, log but don't fail - transaction is already processed on-chain
        console.error('Failed to save transaction to database, but on-chain processing succeeded');
      }
    }

    // Check campaign status for all registered campaigns
    const campaignStatuses = await Promise.all(
      registeredCampaigns.map(async (campaignId: number) => {
        const campaign = await contract.getCampaign(campaignId);
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Convert Unix timestamps to numbers for comparison
        const campaignStartTime = Number(campaign.startDate);
        const campaignEndTime = Number(campaign.endDate);
        
        const isCampaignActive = campaign.active && 
                                currentTime >= campaignStartTime && 
                                currentTime <= campaignEndTime;
        
        return {
          campaignId: Number(campaignId),
          isCampaignActive,
          campaignEnded: !isCampaignActive && campaign.active,
          campaignStartDate: new Date(campaignStartTime * 1000).toISOString(),
          campaignEndDate: new Date(campaignEndTime * 1000).toISOString()
        };
      })
    );

    // Filter out ended campaigns
    const activeCampaigns = campaignStatuses.filter(c => c.isCampaignActive);
    const endedCampaigns = campaignStatuses.filter(c => c.campaignEnded);

    // Get updated metrics for ALL registered campaigns (both active and ended)
    const campaignMetrics = await Promise.all(
      campaignStatuses.map(async (campaignStatus) => {
        const metrics = await contract.getAppCampaignMetrics(appId, campaignStatus.campaignId);
        
        return {
          campaignId: campaignStatus.campaignId,
          totalFees: metrics.totalFees.toString(),
          totalVolume: metrics.totalVolume.toString(),
          txCount: Number(metrics.txCount),
          estimatedReward: ethers.formatEther(metrics.estimatedReward),
          isCampaignActive: campaignStatus.isCampaignActive,
          campaignEnded: campaignStatus.campaignEnded,
          campaignStartDate: campaignStatus.campaignStartDate,
          campaignEndDate: campaignStatus.campaignEndDate
        };
      })
    );

    // Log campaign status information
    console.log('Campaign status check:', {
      totalRegisteredCampaigns: registeredCampaigns.length,
      activeCampaigns: activeCampaigns.length,
      endedCampaigns: endedCampaigns.length,
      endedCampaignIds: endedCampaigns.map(c => c.campaignId)
    });

    // Get updated unique user stats for the project
    const { data: userStats } = await supabase
      .from('project_user_stats')
      .select('unique_users_count, total_users_transactions, total_users_volume, total_users_fees, total_users_rewards')
      .eq('project_id', projectId)
      .single();

    return NextResponse.json({
      success: true,
      message: endedCampaigns.length > 0 
        ? `Transaction processed successfully. Metrics updated for ${activeCampaigns.length} active campaign(s). ${endedCampaigns.length} campaign(s) have ended but transaction was still recorded.`
        : 'Transaction processed successfully',
      data: {
        transactionHash: transaction_hash,
        appId,
        processedAt: new Date().toISOString(),
        processTxHash: processReceipt.hash,
        userTracking: {
          userAddress,
          isNewUniqueUser,
          uniqueUsersCount: userStats?.unique_users_count || 0,
          totalUsersTransactions: userStats?.total_users_transactions || 0
        },
        metrics: {
          gasUsed: gasUsed.toString(),
          gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei',
          feeGenerated: ethers.formatEther(feeGenerated) + ' XFI',
          transactionValue: ethers.formatEther(transactionValue) + ' XFI',
          estimatedReward: ethers.formatEther(finalReward) + ' XFI'
        },
        campaignStatus: {
          totalRegisteredCampaigns: registeredCampaigns.length,
          activeCampaigns: activeCampaigns.length,
          endedCampaigns: endedCampaigns.length,
          campaignsWithMetrics: campaignMetrics.length,
          activeCampaignDetails: activeCampaigns.map(c => ({
            campaignId: c.campaignId,
            endDate: c.campaignEndDate,
            status: 'Active - metrics updated'
          })),
          endedCampaignDetails: endedCampaigns.map(c => ({
            campaignId: c.campaignId,
            endDate: c.campaignEndDate,
            status: 'Ended - transaction recorded for historical tracking'
          }))
        },
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
