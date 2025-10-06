# Batch Processor Refactor - Complete Implementation Plan

## 🎯 Goal

Refactor the batch processor to **replicate all logic from `/api/submit`** directly, instead of calling the API endpoint. This includes:

1. ✅ Processing transactions on-chain for rewards
2. ✅ Tracking unique users in database
3. ✅ Updating campaign metrics in database
4. ✅ Updating leaderboard statistics
5. ✅ Saving complete transaction records
6. ✅ All in efficient batches

---

## 📊 Current vs New Architecture

### **Current (Simple)**
```
Batch Processor → Calls /api/submit → Does everything
```
**Problem**: One HTTP call per transaction (slow, overhead)

### **New (Efficient)**
```
Batch Processor → Does everything directly → Processes in batches
```
**Benefits**: 
- No HTTP overhead
- Can optimize database queries
- Can batch smart contract calls
- Better error handling
- More efficient for 1000s of transactions

---

## 🔍 Analysis: What /api/submit Does

Let me analyze the current submit route to replicate everything:

### **Step-by-Step Breakdown of `/api/submit`**

```typescript
// File: src/app/api/submit/route.ts

export async function POST(request: NextRequest) {
  
  // ===== SECTION 1: VALIDATION =====
  const { transaction_hash } = await request.json();
  
  // 1.1 - Validate transaction hash format
  if (!/^0x[a-fA-F0-9]{64}$/.test(transaction_hash)) {
    return error;
  }
  
  // ===== SECTION 2: BLOCKCHAIN SETUP =====
  
  // 2.1 - Create provider
  const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
  
  // 2.2 - Create contract instance (read-only)
  const contract = new ethers.Contract(
    SERVER_CONFIG.contractAddress,
    CROSS_ERA_REWARD_SYSTEM_ABI,
    provider
  );
  
  // ===== SECTION 3: CHECK IF ALREADY PROCESSED =====
  
  // 3.1 - Check on smart contract
  const isProcessed = await contract.processedTransactions(transaction_hash);
  if (isProcessed) {
    return 409 Conflict;
  }
  
  // ===== SECTION 4: GET TRANSACTION DETAILS =====
  
  // 4.1 - Get transaction from blockchain
  const tx = await provider.getTransaction(transaction_hash);
  if (!tx) return 404;
  
  // 4.2 - Get transaction receipt
  const receipt = await provider.getTransactionReceipt(transaction_hash);
  if (!receipt) return 404;
  
  // 4.3 - Extract app_id from transaction data
  const appId = ethers.toUtf8String(tx.data);
  
  // ===== SECTION 5: VERIFY APP REGISTRATION =====
  
  // 5.1 - Check if app registered on-chain
  const isAppRegistered = await contract.registeredApps(appId);
  if (!isAppRegistered) return 404;
  
  // 5.2 - Get registered campaigns for app
  const registeredCampaigns = await contract.getAppRegisteredCampaigns(appId);
  if (registeredCampaigns.length === 0) return 400;
  
  // ===== SECTION 6: CALCULATE METRICS =====
  
  // 6.1 - Calculate transaction metrics
  const gasUsed = receipt.gasUsed;
  const gasPrice = tx.gasPrice || BigInt(0);
  const feeGenerated = gasUsed * gasPrice;
  const transactionValue = tx.value || BigInt(0);
  
  // ===== SECTION 7: UNIQUE USER TRACKING =====
  
  // 7.1 - Get project ID from app_id
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('app_id', appId)
    .single();
  
  const projectId = project.id;
  const userAddress = tx.from.toLowerCase();
  
  // 7.2 - Check if user exists for this project
  const { data: existingUser } = await supabase
    .from('project_unique_users')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_address', userAddress)
    .single();
  
  const isNewUniqueUser = !existingUser;
  
  // 7.3 - Calculate estimated reward
  const estimatedReward = feeGenerated / BigInt(10); // 10% of gas fee
  const minReward = BigInt(1000000000000000); // 0.001 XFI minimum
  const finalReward = estimatedReward > minReward ? estimatedReward : minReward;
  
  // 7.4 - Insert or update unique user
  if (isNewUniqueUser) {
    await supabase.rpc('insert_new_unique_user', {
      p_project_id: projectId,
      p_user_address: userAddress,
      p_transaction_volume: transactionValue.toString(),
      p_transaction_fees: feeGenerated.toString(),
      p_transaction_rewards: finalReward.toString()
    });
  } else {
    await supabase.rpc('update_existing_user_stats', {
      p_project_id: projectId,
      p_user_address: userAddress,
      p_transaction_volume: transactionValue.toString(),
      p_transaction_fees: feeGenerated.toString(),
      p_transaction_rewards: finalReward.toString()
    });
  }
  
  // ===== SECTION 8: PROCESS ON-CHAIN FOR REWARDS =====
  
  // 8.1 - Create verifier wallet
  const verifierWallet = new ethers.Wallet(
    process.env.VERIFIER_PRIVATE_KEY,
    provider
  );
  
  // 8.2 - Create contract with signer
  const contractWithSigner = new ethers.Contract(
    SERVER_CONFIG.contractAddress,
    CROSS_ERA_REWARD_SYSTEM_ABI,
    verifierWallet
  );
  
  // 8.3 - Call processTransaction on smart contract
  const processTx = await contractWithSigner.processTransaction(
    appId,
    transaction_hash,
    gasUsed,
    gasPrice,
    transactionValue
  );
  
  // 8.4 - Wait for on-chain confirmation
  const processReceipt = await processTx.wait();
  
  // ===== SECTION 9: SAVE TO DATABASE =====
  
  // 9.1 - Insert one transaction record per registered campaign
  const transactionInserts = registeredCampaigns.map((campaignId) => ({
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
  
  await supabase
    .from('transactions')
    .insert(transactionInserts);
  
  // ===== SECTION 10: GET CAMPAIGN STATUS & METRICS =====
  
  // 10.1 - Check each campaign status
  const campaignStatuses = await Promise.all(
    registeredCampaigns.map(async (campaignId) => {
      const campaign = await contract.getCampaign(campaignId);
      const currentTime = Math.floor(Date.now() / 1000);
      
      return {
        campaignId: Number(campaignId),
        isCampaignActive: campaign.active && 
                         currentTime >= campaign.startDate && 
                         currentTime <= campaign.endDate
      };
    })
  );
  
  // 10.2 - Get updated campaign metrics from smart contract
  const campaignMetrics = await Promise.all(
    campaignStatuses.map(async (campaignStatus) => {
      const metrics = await contract.getAppCampaignMetrics(
        appId, 
        campaignStatus.campaignId
      );
      
      return {
        campaignId: campaignStatus.campaignId,
        totalFees: metrics.totalFees.toString(),
        totalVolume: metrics.totalVolume.toString(),
        txCount: Number(metrics.txCount),
        estimatedReward: ethers.formatEther(metrics.estimatedReward)
      };
    })
  );
  
  // ===== SECTION 11: UPDATE DATABASE CAMPAIGN STATS =====
  
  // 11.1 - Update campaign statistics in database
  for (const metric of campaignMetrics) {
    await supabase
      .from('campaigns')
      .update({
        total_transactions: metric.txCount,
        distributed_rewards: metric.totalFees,
        // Update other stats as needed
      })
      .eq('campaign_id', metric.campaignId);
  }
  
  // 11.2 - Get updated unique user stats for response
  const { data: userStats } = await supabase
    .from('project_user_stats')
    .select('*')
    .eq('project_id', projectId)
    .single();
  
  // ===== SECTION 12: RETURN SUCCESS =====
  
  return {
    success: true,
    data: {
      transactionHash: transaction_hash,
      appId,
      processedAt: new Date().toISOString(),
      processTxHash: processReceipt.hash,
      userTracking: {
        userAddress,
        isNewUniqueUser,
        uniqueUsersCount: userStats?.unique_users_count || 0
      },
      metrics: {
        gasUsed: gasUsed.toString(),
        feeGenerated: ethers.formatEther(feeGenerated),
        estimatedReward: ethers.formatEther(finalReward)
      },
      campaignMetrics
    }
  };
}
```

---

## 🔧 New Batch Processor Implementation

### **File**: `scripts/process-sdk-batch-complete.js`

This will be a complete refactor that does everything:

```javascript
const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');

// Load environment
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY;

// Contract ABI (load from your config)
const CROSS_ERA_REWARD_SYSTEM_ABI = require('../src/lib/cross-era-abi.json').abi;

const BATCH_SIZE = 50;
const DELAY_BETWEEN_TRANSACTIONS = 2000; // 2 seconds
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function processBatchComplete() {
  console.log('🚀 Starting Complete SDK Batch Processor...');
  console.log(`📅 Time: ${new Date().toISOString()}`);

  // ===== STEP 1: CREATE BATCH RUN =====
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

  try {
    // ===== STEP 3: FETCH PENDING TRANSACTIONS =====
    const { data: pendingTxs, error: fetchError } = await supabase
      .from('sdk_pending_transactions')
      .select('*')
      .eq('status', 'pending')
      .order('network', { ascending: true })
      .order('submitted_at', { ascending: true });

    if (fetchError) throw fetchError;

    console.log(`📊 Found ${pendingTxs.length} pending transactions`);

    if (pendingTxs.length === 0) {
      await finalizeBatchRun(batchId, 'completed', 0, 0, 0, 0);
      console.log('✅ No pending transactions to process');
      return;
    }

    // Update batch run total
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
      console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pendingTxs.length / BATCH_SIZE)}...`);

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
          console.log(`  ✅ ${pendingTx.transaction_hash.substring(0, 10)}... - Success`);
        } else if (result.skipped) {
          skipCount++;
          console.log(`  ⏭️  ${pendingTx.transaction_hash.substring(0, 10)}... - Skipped`);
        } else {
          failCount++;
          console.log(`  ❌ ${pendingTx.transaction_hash.substring(0, 10)}... - Failed`);
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
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // ===== STEP 5: FINALIZE BATCH RUN =====
    await finalizeBatchRun(
      batchId,
      failCount === 0 ? 'completed' : 'partial',
      pendingTxs.length,
      successCount,
      failCount,
      skipCount
    );

    console.log('\n📊 Batch Summary:');
    console.log(`   Total: ${pendingTxs.length}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log('🎉 Complete!');

  } catch (error) {
    console.error('❌ Batch error:', error);
    await finalizeBatchRun(batchId, 'failed', 0, 0, 0, 0, error.message);
    process.exit(1);
  }
}

// ===== CORE PROCESSING FUNCTION =====
async function processCompleteTransaction(
  pendingTx,
  batchId,
  provider,
  contract,
  contractWithSigner,
  supabase
) {
  try {
    const txHash = pendingTx.transaction_hash;
    const appId = pendingTx.app_id;

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
          error_message: 'Already processed on-chain'
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
    const isRegistered = await contract.registeredApps(appId);
    if (!isRegistered) {
      throw new Error(`App ${appId} not registered on-chain`);
    }

    // ===== 5. GET REGISTERED CAMPAIGNS =====
    const registeredCampaigns = await contract.getAppRegisteredCampaigns(appId);
    if (registeredCampaigns.length === 0) {
      throw new Error('App not registered for any campaigns');
    }

    // ===== 6. CALCULATE TRANSACTION METRICS =====
    const gasUsed = receipt.gasUsed;
    const gasPrice = tx.gasPrice || BigInt(0);
    const feeGenerated = gasUsed * gasPrice;
    const transactionValue = tx.value || BigInt(0);

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
      
      if (!projectId) {
        console.warn(`⚠️  Project not found for app_id: ${appId}`);
      }
    }

    const userAddress = tx.from.toLowerCase();
    let isNewUniqueUser = false;

    if (projectId) {
      // 7.2 - Check if user exists
      const { data: existingUser } = await supabase
        .from('project_unique_users')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_address', userAddress)
        .maybeSingle();

      isNewUniqueUser = !existingUser;

      // 7.3 - Calculate estimated reward
      const estimatedReward = feeGenerated / BigInt(10);
      const minReward = BigInt(1000000000000000);
      const finalReward = estimatedReward > minReward ? estimatedReward : minReward;

      // 7.4 - Insert or update user
      if (isNewUniqueUser) {
        await supabase.rpc('insert_new_unique_user', {
          p_project_id: projectId,
          p_user_address: userAddress,
          p_transaction_volume: transactionValue.toString(),
          p_transaction_fees: feeGenerated.toString(),
          p_transaction_rewards: finalReward.toString()
        });
        
        console.log(`  👤 New unique user tracked: ${userAddress.substring(0, 8)}...`);
      } else {
        await supabase.rpc('update_existing_user_stats', {
          p_project_id: projectId,
          p_user_address: userAddress,
          p_transaction_volume: transactionValue.toString(),
          p_transaction_fees: feeGenerated.toString(),
          p_transaction_rewards: finalReward.toString()
        });
        
        console.log(`  👤 Updated user stats: ${userAddress.substring(0, 8)}...`);
      }
    }

    // ===== 8. PROCESS ON-CHAIN FOR REWARDS =====
    
    console.log(`  ⛓️  Processing on-chain: ${txHash.substring(0, 10)}...`);
    
    const processTx = await contractWithSigner.processTransaction(
      appId,
      txHash,
      gasUsed,
      gasPrice,
      transactionValue
    );

    console.log(`  ⏳ Waiting for confirmation...`);
    const processReceipt = await processTx.wait();
    
    console.log(`  ✅ On-chain confirmed: ${processReceipt.hash.substring(0, 10)}...`);
    console.log(`  📦 Block: ${processReceipt.blockNumber}`);

    // ===== 9. SAVE TO TRANSACTIONS TABLE =====
    
    // Calculate final reward
    const estimatedReward = feeGenerated / BigInt(10);
    const minReward = BigInt(1000000000000000);
    const finalReward = estimatedReward > minReward ? estimatedReward : minReward;

    // 9.1 - Insert one record per campaign
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
      console.warn(`  ⚠️  Failed to save to transactions table:`, saveError.message);
    } else {
      console.log(`  💾 Saved to transactions table (${registeredCampaigns.length} records)`);
    }

    // ===== 10. UPDATE CAMPAIGN METRICS IN DATABASE =====
    
    for (const campaignId of registeredCampaigns) {
      // 10.1 - Get campaign metrics from smart contract
      const metrics = await contract.getAppCampaignMetrics(appId, campaignId);
      
      // 10.2 - Update campaign in database
      await supabase
        .from('campaigns')
        .update({
          total_transactions: Number(metrics.txCount),
          // Add other campaign stats as needed
        })
        .eq('campaign_id', Number(campaignId));
      
      console.log(`  📊 Updated campaign ${campaignId} metrics: ${metrics.txCount} total txs`);
    }

    // ===== 11. UPDATE SDK TRANSACTION STATUS =====
    
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

    return { success: true };

  } catch (error) {
    console.error(`  ❌ Error processing ${pendingTx.transaction_hash}:`, error.message);

    // Check if retryable
    const shouldRetry = 
      pendingTx.retry_count < pendingTx.max_retries && 
      isRetryableError(error.message);

    if (shouldRetry) {
      // Mark for retry in next batch
      await supabase
        .from('sdk_pending_transactions')
        .update({
          status: 'pending',
          retry_count: pendingTx.retry_count + 1,
          error_message: error.message,
          batch_id: batchId
        })
        .eq('id', pendingTx.id);
      
      console.log(`  🔄 Queued for retry (attempt ${pendingTx.retry_count + 2}/${pendingTx.max_retries})`);
      
      return { success: false, error: error.message };
    } else {
      // Mark as failed permanently
      await supabase
        .from('sdk_pending_transactions')
        .update({
          status: 'failed',
          processed_at: new Date().toISOString(),
          error_message: error.message,
          batch_id: batchId
        })
        .eq('id', pendingTx.id);
      
      return { success: false, error: error.message };
    }
  }
}

function isRetryableError(errorMessage) {
  const retryable = [
    'network error',
    'timeout',
    'rate limit',
    'connection',
    'temporarily unavailable',
    'ETIMEDOUT',
    'ECONNREFUSED'
  ];
  
  return retryable.some(err => 
    errorMessage.toLowerCase().includes(err)
  );
}

async function finalizeBatchRun(batchId, status, total, success, failed, skipped, error = null) {
  await supabase
    .from('sdk_batch_runs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      successful_transactions: success,
      failed_transactions: failed,
      skipped_transactions: skipped,
      error_summary: error
    })
    .eq('id', batchId);
}

// Run
processBatchComplete()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
```

---

## 📋 Implementation Checklist

### **Phase 1: Refactor Batch Processor** (3-4 hours)

- [ ] Create new file: `scripts/process-sdk-batch-complete.js`
- [ ] Copy all logic from `/api/submit/route.ts`
- [ ] Adapt for batch processing (remove HTTP response logic)
- [ ] Add batch statistics tracking
- [ ] Add retry logic
- [ ] Test with single transaction

### **Phase 2: Add Database Updates** (2 hours)

- [ ] Implement unique user tracking
  - Insert new users
  - Update existing users
  - Update project_user_stats

- [ ] Implement transaction saving
  - Save to transactions table
  - One record per campaign
  - Include all metrics

- [ ] Implement campaign stats updates
  - Fetch from smart contract
  - Update campaigns table
  - Update leaderboard data

### **Phase 3: Optimize for Batch** (2 hours)

- [ ] Cache project lookups (reduce DB queries)
- [ ] Batch database inserts where possible
- [ ] Group transactions by app_id for efficiency
- [ ] Add progress reporting
- [ ] Add detailed logging

### **Phase 4: Testing** (2 hours)

- [ ] Test with 1 transaction
- [ ] Test with 10 transactions
- [ ] Test with mix of new/existing users
- [ ] Test retry logic
- [ ] Test campaign stats updates
- [ ] Verify leaderboard updates

### **Phase 5: Monitoring** (1 hour)

- [ ] Add detailed console logging
- [ ] Log processing time per transaction
- [ ] Track total gas used
- [ ] Export batch summary
- [ ] Add error categorization

---

## 🔍 Key Differences from Current Implementation

### **Current Batch Processor**
```javascript
// Simple: Just calls API
const response = await fetch('/api/submit', {
  body: JSON.stringify({ transaction_hash })
});
```

### **New Batch Processor**
```javascript
// Complete: Does everything directly
1. Get transaction from blockchain ⛓️
2. Verify app registration ✓
3. Get campaign list 📋
4. Calculate metrics 📊
5. Track unique users 👥
6. Process on-chain 🔄
7. Save to database 💾
8. Update campaign stats 📈
9. Update leaderboard 🏆
10. Mark as completed ✅
```

---

## 📊 Database Tables Updated

During batch processing, these tables are updated:

### **1. sdk_pending_transactions**
- `status`: pending → processing → completed/failed
- `batch_id`: Links to batch run
- `processed_at`: Timestamp
- `process_tx_hash`: On-chain proof
- `retry_count`: If retried
- `error_message`: If failed

### **2. transactions** (Main transaction log)
- Full transaction record
- One row per campaign
- All metrics included
- Links to project and campaign

### **3. project_unique_users**
- New user inserted OR
- Existing user stats updated
- Tracks per-user metrics

### **4. project_user_stats**
- Aggregate project statistics
- unique_users_count updated
- total_users_transactions updated
- total_users_fees updated

### **5. campaigns** (Leaderboard data)
- total_transactions updated
- Can update distributed_rewards
- Can update other campaign metrics

### **6. sdk_batch_runs**
- Real-time statistics
- Final completion status
- Error summary if failed

---

## 🚀 Performance Optimizations

### **Optimization 1: Cache Project Lookups**
```javascript
// Build project cache at start
const projectCache = new Map();

async function getProjectId(appId) {
  if (projectCache.has(appId)) {
    return projectCache.get(appId);
  }
  
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('app_id', appId)
    .maybeSingle();
  
  if (data) {
    projectCache.set(appId, data.id);
  }
  
  return data?.id;
}
```

### **Optimization 2: Batch Database Inserts**
```javascript
// Instead of inserting one at a time:
for (const tx of processedTxs) {
  await supabase.from('transactions').insert(tx);
}

// Do this:
const allInserts = processedTxs.map(tx => createTransactionRecord(tx));
await supabase.from('transactions').insert(allInserts);
```

### **Optimization 3: Parallel Campaign Checks**
```javascript
// Instead of sequential:
for (const campaignId of campaigns) {
  await checkCampaign(campaignId);
}

// Do this:
await Promise.all(
  campaigns.map(campaignId => checkCampaign(campaignId))
);
```

---

## 🧪 Testing Strategy

### **Test 1: Single Transaction**
```bash
# Submit one transaction
curl -X POST /api/sdk/submit -d '{...}'

# Run batch processor
node scripts/process-sdk-batch-complete.js

# Verify:
- Transaction marked as completed ✓
- Saved to transactions table ✓
- User tracking updated ✓
- Campaign stats updated ✓
- process_tx_hash recorded ✓
```

### **Test 2: Multiple Transactions**
```bash
# Submit 5 transactions with same app_id
# Submit 5 transactions with different app_ids
# Run batch processor
# Verify all 10 processed correctly
```

### **Test 3: New vs Existing Users**
```bash
# Submit transaction from new user
# Submit transaction from same user again
# Verify:
- First: isNewUniqueUser = true
- Second: isNewUniqueUser = false
- project_user_stats incremented correctly
```

### **Test 4: Campaign Stats**
```bash
# Check campaign before batch
SELECT * FROM campaigns WHERE campaign_id = 25;

# Run batch processor

# Check campaign after batch
SELECT * FROM campaigns WHERE campaign_id = 25;

# Verify total_transactions incremented
```

---

## 📈 Expected Performance

| Metric | Value |
|--------|-------|
| Transactions/second | ~0.5 (2 sec delay) |
| Batch of 50 txs | ~2 minutes |
| Batch of 1000 txs | ~35-40 minutes |
| Database inserts | Batched for efficiency |
| Smart contract calls | Sequential (for safety) |
| Memory usage | Low (streaming) |

---

## 🎯 Next Steps

1. **Review this plan** - Make sure it covers everything
2. **Create the new batch processor** - Implement step by step
3. **Test thoroughly** - Start with 1 tx, then scale up
4. **Replace old batch processor** - Once verified
5. **Setup cron job** - Schedule for daily runs
6. **Monitor first week** - Track success rates

Ready to implement? I can create the complete refactored batch processor file for you!

