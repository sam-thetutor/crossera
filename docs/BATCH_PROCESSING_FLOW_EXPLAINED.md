# Batch Processing Flow - Step by Step

## 🔄 Complete Transaction Lifecycle

Here's exactly what happens when transactions are batch processed, from submission to completion.

---

## 📥 Phase 1: Transaction Submission (Via SDK)

### **Step 1: SDK User Submits Transaction**

**Request**:
```typescript
const sdk = new CrossEraSDK();
const result = await sdk.submitForProcessing({
  transactionHash: '0xb893a2cd50cc23bdc898911eb371568665275c3403cbdcb6470e2e8933588c8f',
  network: 'mainnet'
});
```

**What Happens**:
```
SDK → POST /api/sdk/submit
{
  transactionHash: "0xb893...",
  network: "mainnet",
  appId: undefined,      // Optional
  userAddress: undefined // Optional
}
```

---

### **Step 2: API Validates Transaction**

**File**: `src/app/api/sdk/submit/route.ts`

```typescript
// 2.1 - Validate transaction hash format
if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
  return error;
}

// 2.2 - Validate network
if (!['testnet', 'mainnet'].includes(network)) {
  return error;
}

// 2.3 - Check for duplicates
const existing = await supabase
  .from('sdk_pending_transactions')
  .eq('transaction_hash', transactionHash)
  .eq('network', network)
  .maybeSingle();

if (existing) {
  return 409 Conflict; // Already submitted
}
```

---

### **Step 3: Extract Transaction Data from Blockchain**

```typescript
// 3.1 - Connect to blockchain
const provider = new ethers.JsonRpcProvider(rpcUrl);

// 3.2 - Fetch transaction from blockchain
const tx = await provider.getTransaction(transactionHash);

// 3.3 - Extract app_id from transaction.data field
const appId = ethers.toUtf8String(tx.data);
// Result: "o35pqzk2u7wg64k3eclh"

// 3.4 - Extract user address
const userAddress = tx.from;
// Result: "0x7818ced1298849b47a9b56066b5adc72cddaf733"
```

---

### **Step 4: Verify App Registration (Early Validation)**

```typescript
// 4.1 - Connect to smart contract
const contract = new ethers.Contract(
  contractAddress,
  CROSS_ERA_REWARD_SYSTEM_ABI,
  provider
);

// 4.2 - Check if app is registered on-chain
const isRegistered = await contract.registeredApps(appId);

// 4.3 - Reject if not registered
if (!isRegistered) {
  return error: "App not registered on-chain";
}
```

---

### **Step 5: Lookup Project ID (Optional)**

```typescript
// 5.1 - Try to find project in database
const { data: project } = await supabase
  .from('projects')
  .select('id')
  .eq('app_id', appId)
  .maybeSingle();

// 5.2 - Set project_id if found
const projectId = project?.id || null;
// If found: "09defcd9-3117-495a-9b09-4f50b87d4f49"
// If not found: null (will be looked up during batch processing)
```

---

### **Step 6: Store in Database**

```typescript
// 6.1 - Insert into sdk_pending_transactions table
const { data: pendingTx } = await supabase
  .from('sdk_pending_transactions')
  .insert({
    transaction_hash: "0xb893a2cd...",
    app_id: "o35pqzk2u7wg64k3eclh",
    project_id: "09defcd9-3117-495a-9b09-4f50b87d4f49",
    user_address: "0x7818ced1298849b47a9b56066b5adc72cddaf733",
    network: "mainnet",
    status: "pending",       // ← Key status
    retry_count: 0,
    max_retries: 3,
    submitted_at: NOW()
  });

// 6.2 - Calculate estimated processing time
const tomorrow = new Date();
tomorrow.setUTCHours(24, 0, 0, 0);
const hoursUntil = calculateHours(now, tomorrow);
// Result: "~22 hours (next batch runs at 00:00 UTC)"
```

---

### **Step 7: Return Success Response**

```json
{
  "success": true,
  "message": "Transaction submitted for batch processing",
  "data": {
    "id": "76d2d5b4-85c2-4ca0-8a9c-cc4f8190baac",
    "transaction_hash": "0xb893a2cd...",
    "app_id": "o35pqzk2u7wg64k3eclh",
    "user_address": "0x7818ced1298849b47a9b56066b5adc72cddaf733",
    "network": "mainnet",
    "status": "pending",
    "submitted_at": "2025-10-06T02:57:40...",
    "estimated_processing_time": "~22 hours"
  }
}
```

**Transaction is now in queue! ✅**

---

## ⏰ Phase 2: Waiting Period

### **Step 8: Transaction Waits in Database**

```sql
-- Transaction sits in database with status='pending'
SELECT * FROM sdk_pending_transactions 
WHERE transaction_hash = '0xb893a2cd...';

-- Result:
-- status: 'pending'
-- submitted_at: '2025-10-06T02:57:40'
-- processed_at: null
-- batch_id: null
```

### **Step 9: Users Can Check Status Anytime**

```bash
GET /api/sdk/status/0xb893a2cd...?network=mainnet

Response:
{
  "status": "pending",
  "submitted_at": "2025-10-06T02:57:40",
  "estimated_processing_time": "~15 hours",
  "retry_count": 0,
  "batch_info": null  # Not processed yet
}
```

---

## 🚀 Phase 3: Batch Processing (Daily at 00:00 UTC or Manual)

### **Step 10: Batch Processor Starts**

**Triggered By**: Cron job or manual execution

```bash
node scripts/process-sdk-batch.js
```

```javascript
// 10.1 - Print start message
console.log('🚀 Starting SDK batch processor...');
console.log('📅 Time: 2025-10-06T03:03:06');
```

---

### **Step 11: Create Batch Run Record**

```javascript
// 11.1 - Insert into sdk_batch_runs table
const { data: batchRun } = await supabase
  .from('sdk_batch_runs')
  .insert({
    run_date: "2025-10-06",
    status: "running",          // ← Batch is now running
    triggered_by: "manual",     // or "cron"
    total_transactions: 0,
    successful_transactions: 0,
    failed_transactions: 0,
    skipped_transactions: 0,
    started_at: NOW()
  });

// 11.2 - Get batch ID
const batchId = batchRun.id;
// Result: "43938543-68eb-4f77-8d62-709f859cce71"

console.log('📦 Batch ID:', batchId);
```

---

### **Step 12: Fetch All Pending Transactions**

```javascript
// 12.1 - Query database for pending transactions
const { data: pendingTxs } = await supabase
  .from('sdk_pending_transactions')
  .select('*')
  .eq('status', 'pending')
  .order('network', { ascending: true })
  .order('submitted_at', { ascending: true });

// 12.2 - Log results
console.log('📊 Found 1 pending transactions');

// 12.3 - Group by network
const byNetwork = {
  mainnet: [
    {
      id: "76d2d5b4-85c2-4ca0-8a9c-cc4f8190baac",
      transaction_hash: "0xb893a2cd...",
      app_id: "o35pqzk2u7wg64k3eclh",
      network: "mainnet",
      status: "pending"
    }
  ]
};

console.log('📡 Networks: mainnet');
console.log('   mainnet: 1 transactions');
```

---

### **Step 13: Update Batch Run Statistics**

```javascript
// 13.1 - Update total count
await supabase
  .from('sdk_batch_runs')
  .update({ total_transactions: 1 })
  .eq('id', batchId);
```

---

### **Step 14: Process Each Transaction**

For each transaction in the queue:

```javascript
console.log('🔄 Processing batch 1/1 (1 transactions)...');

// 14.1 - Update transaction status to 'processing'
await supabase
  .from('sdk_pending_transactions')
  .update({ 
    status: 'processing',  // ← Status changed from 'pending'
    batch_id: batchId      // ← Link to batch run
  })
  .eq('id', tx.id);
```

---

### **Step 15: Call Submit API**

```javascript
// 15.1 - Make HTTP request to submit API
const response = await fetch('http://localhost:3000/api/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transaction_hash: "0xb893a2cd..."
  })
});

const result = await response.json();
```

---

### **Step 16: Submit API Processes Transaction**

**File**: `src/app/api/submit/route.ts`

This is where the REAL processing happens:

```javascript
// 16.1 - Connect to blockchain
const provider = new ethers.JsonRpcProvider(RPC_URL);

// 16.2 - Get transaction details
const tx = await provider.getTransaction(txHash);
const receipt = await provider.getTransactionReceipt(txHash);

// 16.3 - Extract app_id from transaction data
const appId = ethers.toUtf8String(tx.data);

// 16.4 - Verify app is registered
const isRegistered = await contract.registeredApps(appId);

// 16.5 - Get registered campaigns for app
const registeredCampaigns = await contract.getAppRegisteredCampaigns(appId);

// 16.6 - Calculate transaction metrics
const gasUsed = receipt.gasUsed;           // 29115
const gasPrice = tx.gasPrice;              // 562500000000
const feeGenerated = gasUsed * gasPrice;   // Gas fee in wei
const transactionValue = tx.value;         // 0

// 16.7 - Track unique user (NEW USER or EXISTING)
const userAddress = tx.from.toLowerCase();

// Check if new unique user for this project
const { data: existingUser } = await supabase
  .from('project_unique_users')
  .eq('project_id', projectId)
  .eq('user_address', userAddress)
  .maybeSingle();

const isNewUser = !existingUser;

if (isNewUser) {
  // Insert new unique user record
  await supabase.rpc('insert_new_unique_user', {
    p_project_id: projectId,
    p_user_address: userAddress,
    p_transaction_volume: transactionValue.toString(),
    p_transaction_fees: feeGenerated.toString(),
    p_transaction_rewards: estimatedReward.toString()
  });
} else {
  // Update existing user stats
  await supabase.rpc('update_existing_user_stats', {
    p_project_id: projectId,
    p_user_address: userAddress,
    p_transaction_volume: transactionValue.toString(),
    p_transaction_fees: feeGenerated.toString(),
    p_transaction_rewards: estimatedReward.toString()
  });
}

// 16.8 - Create verifier wallet with private key
const verifierWallet = new ethers.Wallet(
  VERIFIER_PRIVATE_KEY,
  provider
);

// 16.9 - Connect contract with verifier wallet
const contractWithSigner = new ethers.Contract(
  contractAddress,
  ABI,
  verifierWallet
);

// 16.10 - Call processTransaction on smart contract
const processTx = await contractWithSigner.processTransaction(
  appId,                 // "o35pqzk2u7wg64k3eclh"
  transactionHash,       // "0xb893a2cd..."
  gasUsed,              // 29115
  gasPrice,             // 562500000000
  transactionValue      // 0
);

console.log('Processing transaction on-chain:', {
  appId,
  txHash: transactionHash,
  gasUsed: gasUsed.toString(),
  gasPrice: gasPrice.toString(),
  value: transactionValue.toString()
});

// 16.11 - Wait for on-chain confirmation
const processReceipt = await processTx.wait();

console.log('Transaction processed on-chain:', {
  processHash: processReceipt.hash,
  blockNumber: processReceipt.blockNumber
});
// Result:
// processHash: "0xf5c98a3e46bc8315c984dbdf2afb1f80c43231cf8d136209f95911a7dcf10f8f"
// blockNumber: 5480XXX

// 16.12 - Save transaction to main transactions table
await supabase
  .from('transactions')
  .insert({
    tx_hash: transactionHash,
    app_id: appId,
    project_id: projectId,
    campaign_id: campaignId,
    from_address: tx.from,
    to_address: tx.to,
    user_address: userAddress,
    amount: transactionValue.toString(),
    gas_used: gasUsed.toString(),
    gas_price: gasPrice.toString(),
    fee_generated: feeGenerated.toString(),
    block_number: receipt.blockNumber,
    timestamp: NOW(),
    status: 'processed',
    process_tx_hash: processReceipt.hash,
    is_unique_user: isNewUser,
    reward_calculated: estimatedReward.toString()
  });

// 16.13 - Get campaign metrics
for (const campaignId of registeredCampaigns) {
  const metrics = await contract.getAppCampaignMetrics(appId, campaignId);
  // Returns: totalFees, totalVolume, txCount, estimatedReward
}

// 16.14 - Return success
return {
  success: true,
  data: {
    transactionHash,
    appId,
    processedAt: NOW(),
    processTxHash: processReceipt.hash,
    userTracking: {
      userAddress,
      isNewUniqueUser: isNewUser
    },
    metrics: { gasUsed, gasPrice, feeGenerated },
    campaignMetrics: [...]
  }
};
```

---

### **Step 17: Batch Processor Receives Result**

Back in `scripts/process-sdk-batch.js`:

```javascript
// 17.1 - Check if submit API succeeded
if (response.ok && result.success) {
  
  // 17.2 - Update SDK transaction status to 'completed'
  await supabase
    .from('sdk_pending_transactions')
    .update({
      status: 'completed',        // ← Changed from 'processing'
      processed_at: NOW(),        // ← Timestamp recorded
      process_tx_hash: result.data.processTxHash
      // Result: "0xf5c98a3e..."
    })
    .eq('id', tx.id);
  
  // 17.3 - Log success
  console.log('✅ 0xb893a2cd... [mainnet] - Success');
  
  successCount++;
  
  return { success: true };
}
```

---

### **Step 18: Update Batch Statistics**

```javascript
// 18.1 - Update batch run with current stats
await supabase
  .from('sdk_batch_runs')
  .update({
    successful_transactions: 1,  // ← Incremented
    failed_transactions: 0,
    skipped_transactions: 0
  })
  .eq('id', batchId);
```

---

### **Step 19: Complete Batch Run**

```javascript
// 19.1 - Mark batch as completed
await supabase
  .from('sdk_batch_runs')
  .update({
    status: 'completed',     // ← Changed from 'running'
    completed_at: NOW()      // ← End timestamp
  })
  .eq('id', batchId);

// 19.2 - Print summary
console.log('📊 Batch Processing Summary:');
console.log('   Total: 1');
console.log('   ✅ Successful: 1');
console.log('   ❌ Failed: 0');
console.log('   ⏭️  Skipped: 0');
console.log('   📈 Success Rate: 100.0%');
console.log('🎉 Batch processing completed!');
```

---

## 🔍 Phase 4: Verification (After Processing)

### **Step 20: User Checks Status**

```typescript
// 20.1 - SDK user checks status
const status = await sdk.getTransactionStatus({
  transactionHash: '0xb893a2cd...',
  network: 'mainnet'
});
```

```javascript
// 20.2 - API fetches from database
GET /api/sdk/status/0xb893a2cd...?network=mainnet

// 20.3 - Query database
const pendingTx = await supabase
  .from('sdk_pending_transactions')
  .select('*')
  .eq('transaction_hash', txHash)
  .eq('network', network)
  .single();

// 20.4 - Fetch batch info
const batchInfo = await supabase
  .from('sdk_batch_runs')
  .select('*')
  .eq('id', pendingTx.batch_id)
  .single();
```

---

### **Step 21: Return Complete Status**

```json
{
  "success": true,
  "data": {
    "transaction_hash": "0xb893a2cd...",
    "app_id": "o35pqzk2u7wg64k3eclh",
    "user_address": "0x7818ced1298849b47a9b56066b5adc72cddaf733",
    "network": "mainnet",
    "status": "completed",                    // ← Now completed!
    "submitted_at": "2025-10-06T02:57:40",
    "processed_at": "2025-10-06T03:03:24",    // ← Processing timestamp
    "process_tx_hash": "0xf5c98a3e...",       // ← On-chain proof
    "error_message": null,
    "retry_count": 0,
    "max_retries": 3,
    "estimated_processing_time": null,        // ← No longer pending
    "batch_info": {                           // ← Batch details
      "id": "43938543-68eb-4f77-8d62-709f859cce71",
      "started_at": "2025-10-06T03:03:06",
      "completed_at": "2025-10-06T03:03:26",
      "status": "completed"
    }
  }
}
```

---

## 📊 What Happens Behind the Scenes

### **On the Smart Contract**

When `processTransaction()` is called:

```solidity
// 1. Mark transaction as processed
processedTransactions[txHash] = true;

// 2. Update app campaign metrics
AppCampaignMetrics storage metrics = appCampaignMetrics[appId][campaignId];
metrics.totalFees += feeGenerated;
metrics.totalVolume += transactionValue;
metrics.txCount += 1;

// 3. Calculate estimated reward (10% of gas fees)
uint256 reward = feeGenerated / 10;

// 4. Add to app's pending rewards
metrics.estimatedReward += reward;

// 5. Emit events
emit TransactionProcessed(appId, txHash, campaignId, feeGenerated, reward);
```

### **In the Database**

Multiple tables get updated:

```sql
-- 1. sdk_pending_transactions
UPDATE sdk_pending_transactions 
SET status = 'completed',
    processed_at = NOW(),
    process_tx_hash = '0xf5c98a3e...',
    batch_id = '43938543-...'
WHERE transaction_hash = '0xb893a2cd...';

-- 2. transactions (main table)
INSERT INTO transactions (
  tx_hash, app_id, project_id, campaign_id,
  gas_used, gas_price, fee_generated,
  status, process_tx_hash, is_unique_user
) VALUES (...);

-- 3. project_unique_users (if new user)
INSERT INTO project_unique_users (
  project_id, user_address,
  total_transactions, total_fees, total_rewards
) VALUES (...);

-- OR update existing user stats

-- 4. project_user_stats
-- Incremented: unique_users_count (if new user)
-- Incremented: total_users_transactions
-- Updated: total_users_fees, total_users_rewards

-- 5. sdk_batch_runs
UPDATE sdk_batch_runs
SET successful_transactions = 1,
    completed_at = NOW(),
    status = 'completed'
WHERE id = '43938543-...';
```

---

## 🔄 Error Handling & Retries

### **If Processing Fails**

```javascript
// Example: Network error during processing
catch (error) {
  // Check retry count
  if (tx.retry_count < tx.max_retries && isRetryable(error)) {
    
    // Set back to 'pending' for next batch
    await supabase
      .from('sdk_pending_transactions')
      .update({
        status: 'pending',        // ← Will be retried in next batch
        retry_count: tx.retry_count + 1,
        error_message: error.message
      });
    
    console.log('🔄 Will retry (attempt 2/3)');
    
  } else {
    // Max retries reached - give up
    await supabase
      .from('sdk_pending_transactions')
      .update({
        status: 'failed',         // ← Permanently failed
        processed_at: NOW(),
        error_message: error.message
      });
    
    console.log('❌ Max retries exceeded');
  }
}
```

### **Retryable Errors**
- Network timeouts
- Rate limiting
- Temporary RPC failures
- Connection errors

### **Non-Retryable Errors**
- App not registered
- Invalid transaction hash
- Transaction already processed
- Contract revert errors

---

## 📈 Complete Data Flow

```
SDK Submission
     ↓
[sdk_pending_transactions]
   status: 'pending'
     ↓
Batch Processor Runs
     ↓
[sdk_pending_transactions]
   status: 'processing'
   batch_id: set
     ↓
Submit API Called
     ↓
Smart Contract Updated
   - processedTransactions[hash] = true
   - Metrics updated
   - Rewards calculated
     ↓
[transactions] Table
   - Full transaction record saved
     ↓
[project_unique_users]
   - New user OR update existing
     ↓
[project_user_stats]
   - Aggregate stats updated
     ↓
[sdk_pending_transactions]
   status: 'completed'
   processed_at: set
   process_tx_hash: set
     ↓
[sdk_batch_runs]
   status: 'completed'
   successful_transactions: +1
     ↓
User Checks Status
   - Gets complete processing info
   - Sees process_tx_hash
   - Sees batch details
```

---

## 🎯 Summary

When a transaction is batch processed:

1. ✅ Extracted from pending queue
2. ✅ Status updated to 'processing'
3. ✅ Submitted to on-chain smart contract
4. ✅ User tracking updated (new or existing)
5. ✅ Campaign metrics calculated
6. ✅ Rewards estimated
7. ✅ Saved to main transactions table
8. ✅ Status updated to 'completed'
9. ✅ Process tx hash recorded
10. ✅ Batch statistics updated
11. ✅ Users can verify completion

**Total Time**: ~20 seconds per transaction
**Gas Cost**: Paid by verifier wallet (you)
**Success Rate**: 100% on test transaction!

Your batch processing system is working perfectly! 🎉

