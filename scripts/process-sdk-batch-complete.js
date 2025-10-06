#!/usr/bin/env node

/**
 * Complete SDK Batch Processor
 * Replicates all logic from /api/submit for efficient batch processing
 * Processes transactions on-chain, tracks users, updates leaderboard
 */

const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');

// Load environment
require('dotenv').config({ path: '.env.local' });

// Validate environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RPC_URL',
  'CONTRACT_ADDRESS',
  'VERIFIER_PRIVATE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY;

// Load Contract ABI
const CROSS_ERA_REWARD_SYSTEM_ABI = require('../src/lib/cross-era-abi.json').abi;

// Processing configuration
const BATCH_SIZE = 50;
const DELAY_BETWEEN_TRANSACTIONS = 2000; // 2 seconds
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds

// Initialize Supabase with admin privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Statistics
let totalGasUsed = BigInt(0);
let totalFeesGenerated = BigInt(0);
let totalRewardsCalculated = BigInt(0);

async function processBatchComplete() {
  console.log('🚀 Starting Complete SDK Batch Processor...');
  console.log(`📅 Time: ${new Date().toISOString()}`);
  console.log(`⛓️  Network: Mainnet`);
  console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);

  // ===== STEP 1: CREATE BATCH RUN RECORD =====
  const { data: batchRun, error: batchError } = await supabase
    .from('sdk_batch_runs')
    .insert({
      run_date: new Date().toISOString().split('T')[0],
      status: 'running',
      triggered_by: process.env.TRIGGERED_BY || 'manual',
      total_transactions: 0,
      successful_transactions: 0,
      failed_transactions: 0,
      skipped_transactions: 0
    })
    .select()
    .single();

  if (batchError) {
    console.error('❌ Failed to create batch run:', batchError);
    process.exit(1);
  }

  const batchId = batchRun.id;
  console.log(`📦 Batch ID: ${batchId}`);

  // ===== STEP 2: SETUP BLOCKCHAIN CONNECTION =====
  console.log('\n⛓️  Setting up blockchain connections...');
  
  const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, {
    staticNetwork: true,
  });
  provider.pollingInterval = 8000;

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CROSS_ERA_REWARD_SYSTEM_ABI,
    provider
  );

  const verifierWallet = new ethers.Wallet(VERIFIER_PRIVATE_KEY, provider);
  const contractWithSigner = new ethers.Contract(
    CONTRACT_ADDRESS,
    CROSS_ERA_REWARD_SYSTEM_ABI,
    verifierWallet
  );

  console.log(`✅ Verifier address: ${verifierWallet.address}`);

  try {
    // ===== STEP 3: FETCH PENDING TRANSACTIONS =====
    console.log('\n📊 Fetching pending transactions...');
    
    const { data: pendingTxs, error: fetchError } = await supabase
      .from('sdk_pending_transactions')
      .select('*')
      .eq('status', 'pending')
      .order('network', { ascending: true })
      .order('submitted_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch pending transactions: ${fetchError.message}`);
    }

    console.log(`📋 Found ${pendingTxs.length} pending transactions`);

    if (pendingTxs.length === 0) {
      await finalizeBatchRun(batchId, 'completed', 0, 0, 0, 0);
      console.log('✅ No pending transactions to process');
      return;
    }

    // Group by network
    const byNetwork = pendingTxs.reduce((acc, tx) => {
      if (!acc[tx.network]) acc[tx.network] = [];
      acc[tx.network].push(tx);
      return acc;
    }, {});

    console.log(`📡 Networks: ${Object.keys(byNetwork).join(', ')}`);
    Object.entries(byNetwork).forEach(([network, txs]) => {
      console.log(`   ${network}: ${txs.length} transactions`);
    });

    // Update batch run with total count
    await supabase
      .from('sdk_batch_runs')
      .update({ total_transactions: pendingTxs.length })
      .eq('id', batchId);

    // ===== STEP 4: PROCESS TRANSACTIONS IN BATCHES =====
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (let i = 0; i < pendingTxs.length; i += BATCH_SIZE) {
      const batch = pendingTxs.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(pendingTxs.length / BATCH_SIZE);
      
      console.log(`\n🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} transactions)...`);

      for (const pendingTx of batch) {
        const result = await processCompleteTransaction(
          pendingTx,
          batchId,
          provider,
          contract,
          contractWithSigner,
          supabase
        );

        if (result.success) {
          successCount++;
          console.log(`  ✅ ${pendingTx.transaction_hash.substring(0, 10)}... [${pendingTx.network}]`);
        } else if (result.skipped) {
          skipCount++;
          console.log(`  ⏭️  ${pendingTx.transaction_hash.substring(0, 10)}... - ${result.reason}`);
        } else {
          failCount++;
          console.log(`  ❌ ${pendingTx.transaction_hash.substring(0, 10)}... - ${result.error}`);
        }

        // Update batch stats in real-time
        await supabase
          .from('sdk_batch_runs')
          .update({
            successful_transactions: successCount,
            failed_transactions: failCount,
            skipped_transactions: skipCount
          })
          .eq('id', batchId);

        // Delay between transactions
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TRANSACTIONS));
      }

      // Delay between batches
      if (i + BATCH_SIZE < pendingTxs.length) {
        console.log(`⏸️  Waiting before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // ===== STEP 5: FINALIZE BATCH RUN =====
    const finalStatus = failCount === 0 ? 'completed' : (successCount > 0 ? 'partial' : 'failed');
    await finalizeBatchRun(batchId, finalStatus, pendingTxs.length, successCount, failCount, skipCount);

    console.log('\n📊 Batch Processing Summary:');
    console.log(`   Total: ${pendingTxs.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   📈 Success Rate: ${((successCount / pendingTxs.length) * 100).toFixed(1)}%`);
    console.log(`   ⛽ Total Gas Used: ${totalGasUsed.toString()}`);
    console.log(`   💰 Total Fees: ${ethers.formatEther(totalFeesGenerated)} XFI`);
    console.log(`   🎁 Total Rewards: ${ethers.formatEther(totalRewardsCalculated)} XFI`);
    console.log('🎉 Batch processing completed!');

  } catch (error) {
    console.error('❌ Batch processing error:', error);
    await finalizeBatchRun(batchId, 'failed', 0, 0, 0, 0, error.message);
    process.exit(1);
  }
}

/**
 * Process a single transaction with complete logic from /api/submit
 */
async function processCompleteTransaction(
  pendingTx,
  batchId,
  provider,
  contract,
  contractWithSigner,
  supabase
) {
  const txHash = pendingTx.transaction_hash;
  const appId = pendingTx.app_id;

  try {
    // ===== 1. UPDATE STATUS TO PROCESSING =====
    await supabase
      .from('sdk_pending_transactions')
      .update({ 
        status: 'processing',
        batch_id: batchId
      })
      .eq('id', pendingTx.id);

    // ===== 2. CHECK IF ALREADY PROCESSED ON-CHAIN =====
    const isProcessed = await contract.processedTransactions(txHash);
    if (isProcessed) {
      await supabase
        .from('sdk_pending_transactions')
        .update({ 
          status: 'skipped',
          processed_at: new Date().toISOString(),
          error_message: 'Already processed on-chain',
          batch_id: batchId
        })
        .eq('id', pendingTx.id);
      
      return { skipped: true, reason: 'Already processed' };
    }

    // ===== 3. GET TRANSACTION DETAILS FROM BLOCKCHAIN =====
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      throw new Error('Transaction not found on blockchain');
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    // ===== 4. VERIFY APP REGISTRATION =====
    const isAppRegistered = await contract.registeredApps(appId);
    if (!isAppRegistered) {
      throw new Error(`App "${appId}" is not registered on-chain`);
    }

    // ===== 5. GET REGISTERED CAMPAIGNS =====
    const registeredCampaigns = await contract.getAppRegisteredCampaigns(appId);
    if (registeredCampaigns.length === 0) {
      throw new Error('App is not registered for any active campaigns');
    }

    console.log(`  📋 App registered for ${registeredCampaigns.length} campaign(s)`);

    // ===== 6. CALCULATE TRANSACTION METRICS =====
    const gasUsed = receipt.gasUsed;
    const gasPrice = tx.gasPrice || BigInt(0);
    const feeGenerated = gasUsed * gasPrice;
    const transactionValue = tx.value || BigInt(0);

    console.log(`  ⛽ Gas: ${gasUsed.toString()} × ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
    console.log(`  💰 Fee Generated: ${ethers.formatEther(feeGenerated)} XFI`);

    // ===== 7. UNIQUE USER TRACKING =====
    
    // 7.1 - Get project ID
    let projectId = pendingTx.project_id;
    
    if (!projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('app_id', appId)
        .maybeSingle();
      
      projectId = project?.id;
    }

    const userAddress = tx.from.toLowerCase();
    let isNewUniqueUser = false;

    if (projectId) {
      // 7.2 - Check if user exists
      const { data: existingUser } = await supabase
        .from('project_unique_users')
        .select('id, total_transactions, total_volume, total_fees, total_rewards')
        .eq('project_id', projectId)
        .eq('user_address', userAddress)
        .maybeSingle();

      isNewUniqueUser = !existingUser;

      // 7.3 - Calculate estimated reward (10% of gas fee, minimum 0.001 XFI)
      const estimatedReward = feeGenerated / BigInt(10);
      const minReward = BigInt(1000000000000000);
      const finalReward = estimatedReward > minReward ? estimatedReward : minReward;

      // 7.4 - Insert or update user stats
      if (isNewUniqueUser) {
        const { error: userError } = await supabase.rpc('insert_new_unique_user', {
          p_project_id: projectId,
          p_user_address: userAddress,
          p_transaction_volume: transactionValue.toString(),
          p_transaction_fees: feeGenerated.toString(),
          p_transaction_rewards: finalReward.toString()
        });

        if (userError) {
          console.warn(`  ⚠️  Error tracking new user: ${userError.message}`);
        } else {
          console.log(`  👤 New unique user tracked`);
        }
      } else {
        const { error: updateError } = await supabase.rpc('update_existing_user_stats', {
          p_project_id: projectId,
          p_user_address: userAddress,
          p_transaction_volume: transactionValue.toString(),
          p_transaction_fees: feeGenerated.toString(),
          p_transaction_rewards: finalReward.toString()
        });

        if (updateError) {
          console.warn(`  ⚠️  Error updating user stats: ${updateError.message}`);
        } else {
          console.log(`  👤 User stats updated`);
        }
      }
    }

    // ===== 8. PROCESS TRANSACTION ON-CHAIN FOR REWARDS =====
    
    console.log(`  ⛓️  Processing on-chain...`);
    
    const processTx = await contractWithSigner.processTransaction(
      appId,
      txHash,
      gasUsed,
      gasPrice,
      transactionValue
    );

    console.log(`  ⏳ Waiting for confirmation...`);
    const processReceipt = await processTx.wait();
    
    console.log(`  ✅ On-chain confirmed: Block ${processReceipt.blockNumber}`);
    console.log(`  🔗 Process TX: ${processReceipt.hash.substring(0, 20)}...`);

    // Track gas usage
    totalGasUsed += gasUsed;
    totalFeesGenerated += feeGenerated;

    // ===== 9. CALCULATE REWARDS =====
    const estimatedReward = feeGenerated / BigInt(10);
    const minReward = BigInt(1000000000000000);
    const finalReward = estimatedReward > minReward ? estimatedReward : minReward;
    totalRewardsCalculated += finalReward;

    // ===== 10. SAVE TO TRANSACTIONS TABLE =====
    
    const transactionInserts = registeredCampaigns.map((campaignId) => ({
      tx_hash: txHash,
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

    const { error: saveError } = await supabase
      .from('transactions')
      .insert(transactionInserts);

    if (saveError) {
      console.warn(`  ⚠️  Failed to save to transactions table: ${saveError.message}`);
    } else {
      console.log(`  💾 Saved ${transactionInserts.length} transaction record(s)`);
    }

    // ===== 11. UPDATE CAMPAIGN METRICS & LEADERBOARD =====
    
    console.log(`  📊 Updating campaign metrics...`);
    
    // 11.1 - Check campaign statuses
    const campaignStatuses = await Promise.all(
      registeredCampaigns.map(async (campaignId) => {
        const campaign = await contract.getCampaign(campaignId);
        const currentTime = Math.floor(Date.now() / 1000);
        
        const campaignStartTime = Number(campaign.startDate);
        const campaignEndTime = Number(campaign.endDate);
        
        const isCampaignActive = campaign.active && 
                                currentTime >= campaignStartTime && 
                                currentTime <= campaignEndTime;
        
        return {
          campaignId: Number(campaignId),
          isCampaignActive,
          campaignEnded: !isCampaignActive && campaign.active
        };
      })
    );

    // 11.2 - Get updated metrics from smart contract
    const campaignMetrics = await Promise.all(
      campaignStatuses.map(async (campaignStatus) => {
        const metrics = await contract.getAppCampaignMetrics(appId, campaignStatus.campaignId);
        
        return {
          campaignId: campaignStatus.campaignId,
          totalFees: metrics.totalFees.toString(),
          totalVolume: metrics.totalVolume.toString(),
          txCount: Number(metrics.txCount),
          estimatedReward: metrics.estimatedReward.toString(),
          isCampaignActive: campaignStatus.isCampaignActive
        };
      })
    );

    // 11.3 - Update campaign statistics in database
    for (const metric of campaignMetrics) {
      await supabase
        .from('campaigns')
        .update({
          total_transactions: metric.txCount,
          // Can add more campaign stat updates here
        })
        .eq('campaign_id', metric.campaignId);
      
      console.log(`  📈 Campaign ${metric.campaignId}: ${metric.txCount} txs, ${ethers.formatEther(metric.estimatedReward)} XFI rewards`);
    }

    // ===== 12. UPDATE SDK TRANSACTION STATUS =====
    
    await supabase
      .from('sdk_pending_transactions')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        process_tx_hash: processReceipt.hash,
        batch_id: batchId,
        error_message: null
      })
      .eq('id', pendingTx.id);

    return { 
      success: true,
      metrics: {
        gasUsed,
        feeGenerated,
        reward: finalReward
      }
    };

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);

    // Check if retryable
    const shouldRetry = 
      pendingTx.retry_count < (pendingTx.max_retries || 3) && 
      isRetryableError(error.message);

    if (shouldRetry) {
      // Mark for retry in next batch
      await supabase
        .from('sdk_pending_transactions')
        .update({
          status: 'pending',
          retry_count: (pendingTx.retry_count || 0) + 1,
          error_message: error.message,
          batch_id: batchId
        })
        .eq('id', pendingTx.id);
      
      console.log(`  🔄 Queued for retry (attempt ${(pendingTx.retry_count || 0) + 2}/${pendingTx.max_retries || 3})`);
      
      return { success: false, error: error.message };
    } else {
      // Mark as permanently failed
      await supabase
        .from('sdk_pending_transactions')
        .update({
          status: 'failed',
          processed_at: new Date().toISOString(),
          error_message: error.message,
          batch_id: batchId
        })
        .eq('id', pendingTx.id);
      
      console.log(`  💀 Max retries exceeded or non-retryable error`);
      
      return { success: false, error: error.message };
    }
  }
}

/**
 * Check if error is retryable
 */
function isRetryableError(errorMessage) {
  if (!errorMessage) return false;
  
  const error = errorMessage.toLowerCase();
  const retryableErrors = [
    'network error',
    'timeout',
    'rate limit',
    'temporarily unavailable',
    'connection',
    'econnrefused',
    'etimedout',
    '503',
    '504',
    'gateway',
    'nonce too low',
    'replacement transaction underpriced'
  ];

  return retryableErrors.some(retryError => error.includes(retryError));
}

/**
 * Finalize batch run with statistics
 */
async function finalizeBatchRun(batchId, status, total, success, failed, skipped, errorSummary = null) {
  await supabase
    .from('sdk_batch_runs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      total_transactions: total,
      successful_transactions: success,
      failed_transactions: failed,
      skipped_transactions: skipped,
      error_summary: errorSummary
    })
    .eq('id', batchId);
}

// ===== RUN THE PROCESSOR =====
if (require.main === module) {
  processBatchComplete()
    .then(() => {
      console.log('\n✅ Batch processor completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { processBatchComplete };

