# SDK Batch Processing - Complete Flow Explained

## 🔄 From SDK Call to Transaction Processed

Here's the **complete journey** of a transaction from when a user calls the SDK to when it's fully processed.

---

## 📱 Step 1: User Calls SDK Method

### **User's Code**

```typescript
import { CrossEraSDK } from 'crossera-sdk';

const sdk = new CrossEraSDK();

// User submits their transaction hash
const result = await sdk.submitForProcessing({
  transactionHash: '0x83d90d1d08627aacf6e0bf48175bbd810af74fdb4a4e3d39c356229a9e202827',
  network: 'mainnet',
  appId: 'my-app-id',      // Optional
  userAddress: '0x7818...' // Optional
});

console.log('Result:', result);
```

---

## 🔧 Step 2: SDK Prepares Request

### **File**: `crossera-sdk/src/index.ts` (Line 139-173)

```typescript
async submitForProcessing(params: SubmitForProcessingParams): Promise<BatchTransactionResult> {
  const { transactionHash, network, appId, userAddress } = params;

  // 2.1 - Validate inputs
  validateTransactionHash(transactionHash);  // Check 0x format, 66 chars
  validateNetwork(network);                  // Check 'testnet' or 'mainnet'

  try {
    // 2.2 - Build request data in camelCase format
    const requestData: any = {
      transactionHash: transactionHash,  // Note: camelCase!
      network: network                    // Required!
    };

    // 2.3 - Add optional parameters if provided
    if (appId) {
      requestData.appId = appId;
    }
    if (userAddress) {
      requestData.userAddress = userAddress;
    }

    // Request looks like:
    // {
    //   transactionHash: '0x83d90d1d...',
    //   network: 'mainnet',
    //   appId: 'my-app-id',
    //   userAddress: '0x7818...'
    // }
```

---

## 🌐 Step 3: SDK Makes HTTP Request

### **File**: `crossera-sdk/src/api/client.ts` (Line 75-78)

```typescript
async submitForProcessing(network: Network, data: any): Promise<any> {
  const client = this.getClient(network);
  
  // Makes HTTP POST request
  return client.post('/api/sdk/submit', data);
  
  // Full URL: https://crossera.xyz/api/sdk/submit (or localhost:3000)
  // Method: POST
  // Headers: { 'Content-Type': 'application/json' }
  // Body: { transactionHash, network, appId?, userAddress? }
}
```

**Actual HTTP Request**:
```http
POST https://crossera.xyz/api/sdk/submit
Content-Type: application/json

{
  "transactionHash": "0x83d90d1d08627aacf6e0bf48175bbd810af74fdb4a4e3d39c356229a9e202827",
  "network": "mainnet",
  "appId": "my-app-id",
  "userAddress": "0x7818ced1298849b47a9b56066b5adc72cddaf733"
}
```

---

## 🔍 Step 4: API Receives and Validates

### **File**: `src/app/api/sdk/submit/route.ts` (Line 20-90)

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionHash, network, appId, userAddress } = body;

    // 4.1 - Validate transaction hash format
    if (!transactionHash) {
      return error('Missing required field: transactionHash');
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return error('Invalid transaction hash format');
    }

    // 4.2 - Validate network
    if (!network) {
      return error('Missing required field: network');
    }

    if (!['testnet', 'mainnet'].includes(network)) {
      return error('Invalid network. Must be "testnet" or "mainnet"');
    }

    // 4.3 - Check for duplicates (per network)
    const { data: existing } = await supabase
      .from('sdk_pending_transactions')
      .select('id, status, submitted_at, network')
      .eq('transaction_hash', transactionHash)
      .eq('network', network)
      .maybeSingle();

    if (existing) {
      // Already submitted on this network
      return 409 Conflict;
    }
```

---

## ⛓️ Step 5: Extract Data from Blockchain

```typescript
    // 5.1 - Get network configuration
    const networkConfig = network === 'mainnet' 
      ? { 
          rpcUrl: process.env.RPC_URL,
          contractAddress: process.env.CONTRACT_ADDRESS
        }
      : { 
          rpcUrl: process.env.TESTNET_RPC_URL,
          contractAddress: process.env.TESTNET_CONTRACT_ADDRESS
        };

    // 5.2 - Connect to blockchain
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

    // 5.3 - Get transaction from blockchain
    const tx = await provider.getTransaction(transactionHash);
    
    if (!tx) {
      return error('Transaction not found on blockchain');
    }

    // Transaction object looks like:
    // {
    //   hash: '0x83d90d1d...',
    //   from: '0x7818ced1298849b47a9b56066b5adc72cddaf733',
    //   to: '0x123...',
    //   data: '0x6f333570...' (hex encoded app_id),
    //   value: 0,
    //   gasPrice: 562500000000,
    //   ...
    // }

    // 5.4 - Extract app_id from transaction.data if not provided
    let extractedAppId = appId;
    
    if (!extractedAppId && tx.data && tx.data !== '0x') {
      extractedAppId = ethers.toUtf8String(tx.data);
      // Result: "o35pqzk2u7wg64k3eclh"
    }

    // 5.5 - Extract user address if not provided
    let extractedUserAddress = userAddress;
    
    if (!extractedUserAddress) {
      extractedUserAddress = tx.from;
      // Result: "0x7818ced1298849b47a9b56066b5adc72cddaf733"
    }

    console.log('Extracted data:', {
      appId: extractedAppId,
      userAddress: extractedUserAddress,
      from: tx.from,
      value: tx.value.toString()
    });
```

---

## ✅ Step 6: Verify App Registration (Early Validation)

```typescript
    // 6.1 - Connect to smart contract
    const contract = new ethers.Contract(
      networkConfig.contractAddress,
      CROSS_ERA_REWARD_SYSTEM_ABI,
      provider
    );

    // 6.2 - Check if app is registered on-chain
    const isRegistered = await contract.registeredApps(extractedAppId);
    
    if (!isRegistered) {
      return error(`App "${extractedAppId}" is not registered on-chain on mainnet`);
    }

    console.log('✅ App verified on-chain');

    // This prevents invalid transactions from being queued
    // Saves processing time later
```

---

## 🗄️ Step 7: Lookup Project ID

```typescript
    // 7.1 - Try to find project in database
    let projectId = null;
    
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('app_id', extractedAppId)
        .maybeSingle();
      
      if (project) {
        projectId = project.id;
        // Result: "09defcd9-3117-495a-9b09-4f50b87d4f49"
      }
    } catch (error) {
      // If not found, it's okay - will be looked up during batch processing
      console.log('Project ID not found, will lookup during processing');
    }
```

---

## 💾 Step 8: Store in Database Queue

```typescript
    // 8.1 - Insert into sdk_pending_transactions table
    const { data: pendingTx, error: insertError } = await supabase
      .from('sdk_pending_transactions')
      .insert({
        transaction_hash: transactionHash,
        app_id: extractedAppId,
        project_id: projectId,  // May be null
        user_address: extractedUserAddress.toLowerCase(),
        network: network,
        status: 'pending',      // ← Transaction is now queued!
        retry_count: 0,
        max_retries: 3,
        submitted_at: NOW()     // Timestamp recorded
      })
      .select()
      .single();

    if (insertError) {
      return error('Failed to store transaction for processing');
    }

    // Database record created:
    // {
    //   id: "6735815f-9d0b-4b59-b129-a071f913c50b",
    //   transaction_hash: "0x83d90d1d...",
    //   app_id: "o35pqzk2u7wg64k3eclh",
    //   project_id: "09defcd9-3117-495a-9b09-4f50b87d4f49",
    //   user_address: "0x7818ced1298849b47a9b56066b5adc72cddaf733",
    //   network: "mainnet",
    //   status: "pending",
    //   retry_count: 0,
    //   max_retries: 3,
    //   submitted_at: "2025-10-06T03:22:53.161288+00:00",
    //   processed_at: null,
    //   batch_id: null,
    //   process_tx_hash: null,
    //   error_message: null
    // }
```

---

## ⏰ Step 9: Calculate Estimated Processing Time

```typescript
    // 9.1 - Calculate when next batch runs
    function getEstimatedProcessingTime(): string {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0); // Next midnight UTC
      
      const hoursUntilProcessing = Math.ceil(
        (tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)
      );
      
      return `~${hoursUntilProcessing} hours (next batch runs at 00:00 UTC)`;
    }

    // If submitted at 10:00 UTC → "~14 hours"
    // If submitted at 22:00 UTC → "~2 hours"
```

---

## 📤 Step 10: Return Success Response to SDK

```typescript
    // 10.1 - Build response
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

    // Response:
    // {
    //   success: true,
    //   message: "Transaction submitted for batch processing",
    //   data: {
    //     id: "6735815f-9d0b-4b59-b129-a071f913c50b",
    //     transaction_hash: "0x83d90d1d...",
    //     app_id: "o35pqzk2u7wg64k3eclh",
    //     user_address: "0x7818ced1298849b47a9b56066b5adc72cddaf733",
    //     network: "mainnet",
    //     status: "pending",
    //     submitted_at: "2025-10-06T03:22:53.161288+00:00",
    //     estimated_processing_time: "~21 hours (next batch runs at 00:00 UTC)"
    //   }
    // }
```

---

## 📥 Step 11: SDK Receives Response

### **File**: `crossera-sdk/src/index.ts` (Line 160-173)

```typescript
    // 11.1 - Get response from API
    const response = await this.apiClient.submitForProcessing(network, requestData);
    const data = response.data.data;

    // 11.2 - Map snake_case API response to camelCase SDK format
    return {
      success: response.data.success,
      transactionHash: data.transaction_hash || data.transactionHash,
      appId: data.app_id || data.appId || '',
      userAddress: data.user_address || data.userAddress || '',
      status: data.status || 'pending',
      submittedAt: data.submitted_at || data.submittedAt,
      estimatedProcessingTime: data.estimated_processing_time || '24 hours',
      id: data.id || '',
      network
    };

    // SDK returns to user:
    // {
    //   success: true,
    //   transactionHash: '0x83d90d1d...',
    //   appId: 'o35pqzk2u7wg64k3eclh',
    //   userAddress: '0x7818ced1298849b47a9b56066b5adc72cddaf733',
    //   network: 'mainnet',
    //   status: 'pending',
    //   submittedAt: '2025-10-06T03:22:53.161288+00:00',
    //   estimatedProcessingTime: '~21 hours (next batch runs at 00:00 UTC)',
    //   id: '6735815f-9d0b-4b59-b129-a071f913c50b'
    // }
```

---

## ✨ Step 12: User Gets Confirmation

```typescript
// User's console output:
console.log('Result:', result);

// Output:
// {
//   success: true,
//   status: 'pending',
//   estimatedProcessingTime: '~21 hours',
//   id: '6735815f-9d0b-4b59-b129-a071f913c50b'
// }

// User knows:
// ✅ Transaction was accepted
// ✅ It's queued for processing
// ✅ Will be processed in ~21 hours
// ✅ Can track with the ID
```

---

## ⏳ Step 13: Transaction Waits in Database

### **In the Database**

```sql
-- Transaction sits in sdk_pending_transactions table
SELECT * FROM sdk_pending_transactions 
WHERE transaction_hash = '0x83d90d1d...';

-- Result:
-- id: 6735815f-9d0b-4b59-b129-a071f913c50b
-- status: 'pending'           ← Waiting to be processed
-- network: 'mainnet'
-- submitted_at: 2025-10-06 03:22:53
-- processed_at: null          ← Not processed yet
-- batch_id: null              ← No batch assigned yet
-- retry_count: 0
```

---

## 🔎 Step 14: User Can Check Status Anytime

### **User's Code**

```typescript
// Anytime after submission, user can check status
const status = await sdk.getTransactionStatus({
  transactionHash: '0x83d90d1d...',
  network: 'mainnet'
});

console.log('Current status:', status.status);  // 'pending'
console.log('Estimated time:', status.estimatedProcessingTime);
```

### **What Happens**

```typescript
// SDK → GET /api/sdk/status/0x83d90d1d...?network=mainnet

// API queries database:
const pendingTx = await supabase
  .from('sdk_pending_transactions')
  .select('*')
  .eq('transaction_hash', txHash)
  .eq('network', network)
  .single();

// Returns:
{
  status: 'pending',
  submittedAt: '2025-10-06T03:22:53',
  estimatedProcessingTime: '~20 hours',
  batchInfo: null  // Not processed yet
}
```

---

## ⏰ Step 15: Daily Batch Runs (00:00 UTC)

### **Cron Triggers Batch Processor**

```bash
# At 00:00 UTC daily (or manually)
node scripts/process-sdk-batch-complete.js
```

### **File**: `scripts/process-sdk-batch-complete.js`

```javascript
async function processBatchComplete() {
  console.log('🚀 Starting Complete SDK Batch Processor...');
  
  // 15.1 - Create batch run record
  const { data: batchRun } = await supabase
    .from('sdk_batch_runs')
    .insert({
      run_date: '2025-10-06',
      status: 'running',
      triggered_by: 'cron',
      started_at: NOW()
    })
    .select()
    .single();
  
  const batchId = batchRun.id;
  // Result: "82df2a09-3a01-4786-a679-c96458658ae1"
  
  console.log('📦 Batch ID:', batchId);
  
  // 15.2 - Fetch all pending transactions
  const { data: pendingTxs } = await supabase
    .from('sdk_pending_transactions')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true });
  
  console.log('📊 Found', pendingTxs.length, 'pending transactions');
  
  // Finds our transaction:
  // {
  //   id: "6735815f-9d0b-4b59-b129-a071f913c50b",
  //   transaction_hash: "0x83d90d1d...",
  //   app_id: "o35pqzk2u7wg64k3eclh",
  //   network: "mainnet",
  //   status: "pending"
  // }
```

---

## 🔄 Step 16: Process Transaction (THE MAIN PROCESSING)

### **For Each Pending Transaction**

```javascript
async function processCompleteTransaction(pendingTx, batchId, ...) {
  
  // 16.1 - Update status to 'processing'
  await supabase
    .from('sdk_pending_transactions')
    .update({ 
      status: 'processing',  // ← Changed from 'pending'
      batch_id: batchId      // ← Linked to batch
    })
    .eq('id', pendingTx.id);
  
  // 16.2 - Check if already processed on-chain
  const isProcessed = await contract.processedTransactions(txHash);
  if (isProcessed) {
    // Skip if already done
    return { skipped: true };
  }
  
  // 16.3 - Get transaction details from blockchain
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  
  // 16.4 - Verify app is registered
  const isRegistered = await contract.registeredApps(appId);
  if (!isRegistered) {
    throw new Error('App not registered');
  }
  
  // 16.5 - Get registered campaigns
  const registeredCampaigns = await contract.getAppRegisteredCampaigns(appId);
  // Result: [25] (Campaign IDs)
  
  console.log('📋 App registered for', registeredCampaigns.length, 'campaigns');
  
  // 16.6 - Calculate transaction metrics
  const gasUsed = receipt.gasUsed;           // 29115
  const gasPrice = tx.gasPrice;              // 562500000000
  const feeGenerated = gasUsed * gasPrice;   // 16377187500000000
  const transactionValue = tx.value;         // 0
  
  console.log('⛽ Gas:', gasUsed.toString(), '×', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');
  console.log('💰 Fee Generated:', ethers.formatEther(feeGenerated), 'XFI');
```

---

## 👥 Step 17: Track Unique User

```javascript
  // 17.1 - Get or use project ID
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
  
  // 17.2 - Check if this is a new unique user
  const { data: existingUser } = await supabase
    .from('project_unique_users')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_address', userAddress)
    .maybeSingle();
  
  const isNewUniqueUser = !existingUser;
  
  // 17.3 - Calculate estimated reward (10% of gas fee)
  const estimatedReward = feeGenerated / BigInt(10);
  const minReward = BigInt(1000000000000000);  // 0.001 XFI
  const finalReward = estimatedReward > minReward ? estimatedReward : minReward;
  
  // 17.4 - Insert new user or update existing
  if (isNewUniqueUser) {
    await supabase.rpc('insert_new_unique_user', {
      p_project_id: projectId,
      p_user_address: userAddress,
      p_transaction_volume: transactionValue.toString(),
      p_transaction_fees: feeGenerated.toString(),
      p_transaction_rewards: finalReward.toString()
    });
    
    console.log('👤 New unique user tracked');
    
    // This function:
    // - Inserts into project_unique_users
    // - Updates project_user_stats (unique_users_count++)
  } else {
    await supabase.rpc('update_existing_user_stats', {
      p_project_id: projectId,
      p_user_address: userAddress,
      p_transaction_volume: transactionValue.toString(),
      p_transaction_fees: feeGenerated.toString(),
      p_transaction_rewards: finalReward.toString()
    });
    
    console.log('👤 User stats updated');
    
    // This function:
    // - Updates project_unique_users (totals++)
    // - Updates project_user_stats (aggregates++)
  }
```

---

## ⛓️ Step 18: Process On-Chain for Rewards

### **THE KEY STEP - Calls Smart Contract**

```javascript
  // 18.1 - Create verifier wallet (your wallet with private key)
  const verifierWallet = new ethers.Wallet(
    process.env.VERIFIER_PRIVATE_KEY,
    provider
  );
  
  console.log('✅ Verifier:', verifierWallet.address);
  // Your verifier: 0x234761e3eE6Fc918432f98B139d9584Be3919064
  
  // 18.2 - Create contract instance with signer
  const contractWithSigner = new ethers.Contract(
    CONTRACT_ADDRESS,
    CROSS_ERA_REWARD_SYSTEM_ABI,
    verifierWallet  // ← Can now send transactions
  );
  
  console.log('⛓️  Processing on-chain...');
  
  // 18.3 - Call processTransaction on smart contract
  const processTx = await contractWithSigner.processTransaction(
    appId,              // "o35pqzk2u7wg64k3eclh"
    txHash,             // "0x83d90d1d..."
    gasUsed,            // 29115
    gasPrice,           // 562500000000
    transactionValue    // 0
  );
  
  // This smart contract call:
  // function processTransaction(
  //     string memory _appId,
  //     bytes32 _txHash,
  //     uint256 _gasUsed,
  //     uint256 _gasPrice,
  //     uint256 _value
  // ) external onlyVerifier {
  //     // Mark as processed
  //     processedTransactions[_txHash] = true;
  //     
  //     // Update campaign metrics
  //     for each campaign {
  //         metrics.totalFees += (_gasUsed * _gasPrice);
  //         metrics.totalVolume += _value;
  //         metrics.txCount += 1;
  //         metrics.estimatedReward += (_gasUsed * _gasPrice) / 10;
  //     }
  //     
  //     emit TransactionProcessed(_appId, _txHash, ...);
  // }
  
  console.log('⏳ Waiting for confirmation...');
  
  // 18.4 - Wait for on-chain confirmation
  const processReceipt = await processTx.wait();
  
  console.log('✅ On-chain confirmed: Block', processReceipt.blockNumber);
  console.log('🔗 Process TX:', processReceipt.hash);
  
  // Receipt:
  // {
  //   hash: "0x57892fd388114b357a34fcea41fbff90ae2bbb3e13be7c39f9543d2194c81270",
  //   blockNumber: 5481578,
  //   status: 1 (success)
  // }
```

---

## 💾 Step 19: Save to Transactions Table

```javascript
  // 19.1 - Prepare transaction records (one per campaign)
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
    process_tx_hash: processReceipt.hash,  // ← On-chain proof!
    is_unique_user: isNewUniqueUser,
    reward_calculated: finalReward.toString()
  }));

  // 19.2 - Bulk insert into transactions table
  const { error: saveError } = await supabase
    .from('transactions')
    .insert(transactionInserts);
  
  if (!saveError) {
    console.log('💾 Saved', transactionInserts.length, 'transaction records');
  }
  
  // Database now has full transaction record with all details
```

---

## 📊 Step 20: Update Campaign Metrics & Leaderboard

```javascript
  console.log('📊 Updating campaign metrics...');
  
  // 20.1 - Fetch updated metrics from smart contract
  const campaignMetrics = await Promise.all(
    registeredCampaigns.map(async (campaignId) => {
      const metrics = await contract.getAppCampaignMetrics(appId, campaignId);
      
      return {
        campaignId: Number(campaignId),
        totalFees: metrics.totalFees.toString(),
        totalVolume: metrics.totalVolume.toString(),
        txCount: Number(metrics.txCount),
        estimatedReward: metrics.estimatedReward.toString()
      };
    })
  );
  
  // Result for Campaign 25:
  // {
  //   campaignId: 25,
  //   totalFees: "81881250000000000",     (0.082 XFI)
  //   totalVolume: "0",
  //   txCount: 5,                         (was 4, now 5!)
  //   estimatedReward: "38888888888888888" (0.039 XFI)
  // }
  
  // 20.2 - Update campaigns table in database
  for (const metric of campaignMetrics) {
    await supabase
      .from('campaigns')
      .update({
        total_transactions: metric.txCount,  // ← LEADERBOARD UPDATED!
        // Other stats can be added here
      })
      .eq('campaign_id', metric.campaignId);
    
    console.log('📈 Campaign', metric.campaignId, ':', metric.txCount, 'txs,', 
                ethers.formatEther(metric.estimatedReward), 'XFI rewards');
  }
  
  // Output:
  // 📈 Campaign 25: 5 txs, 0.038888888888888888 XFI rewards
```

---

## ✅ Step 21: Mark as Completed

```javascript
  // 21.1 - Update SDK transaction status
  await supabase
    .from('sdk_pending_transactions')
    .update({
      status: 'completed',              // ← Changed from 'processing'
      processed_at: NOW(),              // ← Timestamp
      process_tx_hash: processReceipt.hash,  // ← On-chain proof
      batch_id: batchId,                // ← Linked to batch
      error_message: null
    })
    .eq('id', pendingTx.id);
  
  // Database record now:
  // {
  //   id: "6735815f-9d0b-4b59-b129-a071f913c50b",
  //   status: "completed",           ← Updated!
  //   processed_at: "2025-10-07T00:05:23",
  //   process_tx_hash: "0x57892fd...",
  //   batch_id: "82df2a09-3a01-4786-a679-c96458658ae1"
  // }
  
  console.log('✅ Transaction completed successfully');
  
  return { success: true };
}
```

---

## 🏁 Step 22: Batch Completes

```javascript
  // 22.1 - Update batch run statistics
  await supabase
    .from('sdk_batch_runs')
    .update({
      status: 'completed',
      completed_at: NOW(),
      successful_transactions: 1,
      failed_transactions: 0,
      skipped_transactions: 0
    })
    .eq('id', batchId);
  
  // 22.2 - Print summary
  console.log('📊 Batch Processing Summary:');
  console.log('   Total: 1');
  console.log('   ✅ Successful: 1');
  console.log('   📈 Success Rate: 100.0%');
  console.log('🎉 Batch processing completed!');
```

---

## 🔍 Step 23: User Checks Status Again

### **User's Code (Next Day)**

```typescript
const status = await sdk.getTransactionStatus({
  transactionHash: '0x83d90d1d...',
  network: 'mainnet'
});

console.log('Status:', status);
```

### **SDK Response**

```typescript
{
  transactionHash: '0x83d90d1d...',
  appId: 'o35pqzk2u7wg64k3eclh',
  userAddress: '0x7818ced1298849b47a9b56066b5adc72cddaf733',
  network: 'mainnet',
  status: 'completed',                    // ← Now completed!
  submittedAt: '2025-10-06T03:22:53Z',
  processedAt: '2025-10-07T00:05:23Z',    // ← Processing timestamp
  processTxHash: '0x57892fd388114b357a...',  // ← On-chain proof
  retryCount: 0,
  maxRetries: 3,
  estimatedProcessingTime: null,
  errorMessage: null,
  batchInfo: {                            // ← Batch details
    id: '82df2a09-3a01-4786-a679-c96458658ae1',
    startedAt: '2025-10-07T00:00:00Z',
    completedAt: '2025-10-07T00:30:00Z',
    status: 'completed'
  }
}
```

**User now has**:
- ✅ Confirmation it was processed
- ✅ On-chain proof (processTxHash)
- ✅ Batch information
- ✅ Processing timestamps

---

## 🗺️ Complete Data Flow Diagram

```
┌──────────────────────┐
│ 1. User's App        │
│ sdk.submitFor-       │
│ Processing()         │
└──────────┬───────────┘
           │ HTTP POST
           ▼
┌──────────────────────┐
│ 2. CrossEra SDK      │
│ - Validates input    │
│ - Builds request     │
└──────────┬───────────┘
           │ POST /api/sdk/submit
           ▼
┌──────────────────────┐
│ 3. API Endpoint      │
│ - Validates hash     │
│ - Checks duplicates  │
│ - Extracts from blockchain
│ - Verifies app       │
└──────────┬───────────┘
           │ INSERT
           ▼
┌──────────────────────┐
│ 4. Database          │
│ sdk_pending_         │
│ transactions         │
│ status: 'pending'    │
└──────────┬───────────┘
           │ Waits...
           │
           │ ⏰ Daily at 00:00 UTC
           ▼
┌──────────────────────┐
│ 5. Batch Processor   │
│ - Fetches pending    │
│ - Creates batch run  │
└──────────┬───────────┘
           │ For each transaction
           ▼
┌──────────────────────┐
│ 6. Processing        │
│ - Get from blockchain│
│ - Verify registration│
│ - Calculate metrics  │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 7. User Tracking     │
│ - Check if new user  │
│ - Insert or update   │
│ project_unique_users │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 8. Smart Contract    │
│ processTransaction() │
│ - Mark as processed  │
│ - Update metrics     │
│ - Calculate rewards  │
└──────────┬───────────┘
           │ Wait for confirmation
           ▼
┌──────────────────────┐
│ 9. Save Results      │
│ - transactions table │
│ - campaign metrics   │
│ - leaderboard data   │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 10. Update Status    │
│ status: 'completed'  │
│ process_tx_hash: set │
│ batch_id: linked     │
└──────────┬───────────┘
           │
           │ GET /api/sdk/status
           ▼
┌──────────────────────┐
│ 11. User Checks      │
│ - Gets full status   │
│ - Sees completion    │
│ - Has proof          │
└──────────────────────┘
```

---

## 💡 Key Points

### **When User Calls SDK**:
1. ✅ Transaction validated immediately
2. ✅ Stored in database queue
3. ✅ Returns estimated time
4. ✅ Can check status anytime

### **When Batch Runs**:
1. ✅ Fetches all pending transactions
2. ✅ Processes each one on-chain
3. ✅ Tracks users in database
4. ✅ Updates campaign metrics
5. ✅ Updates leaderboard
6. ✅ Saves all transaction data
7. ✅ Marks as completed with proof

### **What User Gets**:
1. ✅ Instant submission confirmation
2. ✅ Estimated processing time
3. ✅ Status tracking
4. ✅ On-chain proof when complete
5. ✅ Batch information
6. ✅ Retry handling if errors

---

## 🎯 Why This Architecture?

### **Benefits**:
- ⚡ **Efficient**: Process 1000s of transactions in one batch
- 💰 **Cost-effective**: Single gas price for batch, not per-transaction API call
- 🛡️ **Reliable**: Retry logic for failures
- 📊 **Trackable**: Complete audit trail
- 🎯 **Scalable**: Can handle high volume

### **Use Cases**:
- Mobile apps submitting transactions
- High-frequency dApps
- Analytics platforms
- Third-party integrations

---

The batch processing method provides a complete end-to-end solution from SDK call to on-chain processing with full database tracking! 🚀

