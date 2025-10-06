# Batch Processing System - Implementation Plan

## 🎯 Overview

**Goal**: Create a batch processing system where SDK users submit transaction hashes that are stored and processed once daily, instead of immediate processing.

**Architecture**:
```
SDK User → /api/sdk/submit → Database (Pending Queue) → Daily Batch Processor → /api/submit (per network)
```

---

## 📊 System Architecture

### **Flow Diagram**

```
┌─────────────┐
│  SDK User   │
└──────┬──────┘
       │ POST /api/sdk/submit
       │ { 
       │   transactionHash: "0x...",
       │   network: "mainnet",
       │   appId?: "...",
       │   userAddress?: "0x..."
       │ }
       ▼
┌─────────────────────────────────────┐
│  /api/sdk/submit API Route          │
│  - Validate transaction hash        │
│  - Extract app_id from tx data      │
│  - Store in sdk_pending_transactions│
│  - Return pending status            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  sdk_pending_transactions (Table)   │
│  - id, tx_hash, app_id              │
│  - status: 'pending'                │
│  - submitted_at                     │
└──────────────┬──────────────────────┘
               │
               │ ⏰ Daily at 00:00 UTC
               ▼
┌─────────────────────────────────────┐
│  Batch Processor (Cron Job)         │
│  - Fetch all 'pending' transactions │
│  - Process in batches of 50         │
│  - Call /api/submit for each        │
│  - Update status & record results   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  sdk_pending_transactions (Updated) │
│  - status: 'completed'/'failed'     │
│  - processed_at                     │
│  - process_tx_hash / error_message  │
└─────────────────────────────────────┘
               │
               │ GET /api/sdk/status/{txHash}
               ▼
┌─────────────────────────────────────┐
│  SDK User Gets Status                │
│  - pending/processing/completed     │
│  - Estimated completion time        │
│  - Results if completed             │
└─────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### **Table 1: `sdk_pending_transactions`**

Stores all transactions submitted via SDK for batch processing.

```sql
CREATE TABLE sdk_pending_transactions (
    id SERIAL PRIMARY KEY,
    
    -- Transaction Info
    transaction_hash VARCHAR(66) NOT NULL,
    app_id VARCHAR(32) NOT NULL,
    user_address VARCHAR(42),
    network VARCHAR(20) NOT NULL, -- 'testnet' or 'mainnet'
    
    -- Unique constraint: same tx_hash can be submitted for different networks
    CONSTRAINT unique_tx_hash_network UNIQUE(transaction_hash, network),
    
    -- Status Tracking
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    -- Status values: 'pending', 'processing', 'completed', 'failed', 'skipped'
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Processing Results
    process_tx_hash VARCHAR(66), -- Hash of the processTransaction call
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Batch Info
    batch_id INTEGER REFERENCES sdk_batch_runs(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_tx_hash CHECK (transaction_hash ~ '^0x[a-fA-F0-9]{64}$'),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    CONSTRAINT valid_app_id CHECK (app_id ~ '^[a-zA-Z0-9-]{3,32}$')
);

-- Indexes for performance
CREATE INDEX idx_sdk_pending_status ON sdk_pending_transactions(status);
CREATE INDEX idx_sdk_pending_submitted_at ON sdk_pending_transactions(submitted_at DESC);
CREATE INDEX idx_sdk_pending_app_id ON sdk_pending_transactions(app_id);
CREATE INDEX idx_sdk_pending_user_address ON sdk_pending_transactions(user_address);
CREATE INDEX idx_sdk_pending_batch_id ON sdk_pending_transactions(batch_id);
```

### **Table 2: `sdk_batch_runs`**

Tracks batch processing runs.

```sql
CREATE TABLE sdk_batch_runs (
    id SERIAL PRIMARY KEY,
    
    -- Run Info
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running',
    -- Status values: 'running', 'completed', 'failed', 'partial'
    
    -- Statistics
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    skipped_transactions INTEGER DEFAULT 0,
    
    -- Metadata
    triggered_by VARCHAR(50) DEFAULT 'cron', -- 'cron', 'manual', 'api'
    error_summary TEXT,
    
    -- Constraints
    CONSTRAINT valid_batch_status CHECK (status IN ('running', 'completed', 'failed', 'partial'))
);

-- Index for recent runs
CREATE INDEX idx_sdk_batch_runs_started_at ON sdk_batch_runs(started_at DESC);
```

---

## 🔧 API Endpoints Implementation

### **Endpoint 1: POST /api/sdk/submit**

**Purpose**: Store transaction hash for batch processing

#### **File**: `src/app/api/sdk/submit/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { supabaseAdmin } from '@/lib/supabase';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';

const supabase = supabaseAdmin!;

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
      ? { rpcUrl: SERVER_CONFIG.rpcUrl, contractAddress: SERVER_CONFIG.contractAddress }
      : { rpcUrl: process.env.TESTNET_RPC_URL!, contractAddress: process.env.TESTNET_CONTRACT_ADDRESS! };

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
          extractedAppId = ethers.toUtf8String(tx.data);
        }

        // Extract user address from transaction
        if (!extractedUserAddress) {
          extractedUserAddress = tx.from;
        }
      } catch (error) {
        console.error('Error extracting transaction data:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to extract transaction data' },
          { status: 400 }
        );
      }
    }

    if (!extractedAppId) {
      return NextResponse.json(
        { success: false, error: 'Could not extract app_id from transaction' },
        { status: 400 }
      );
    }

    // Verify app is registered (optional - for early validation)
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
          { success: false, error: `App "${extractedAppId}" is not registered on-chain` },
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

// Helper function to calculate estimated processing time
function getEstimatedProcessingTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0); // Next midnight UTC
  
  const hoursUntilProcessing = Math.ceil((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  return `~${hoursUntilProcessing} hours (next batch runs at 00:00 UTC)`;
}
```

---

### **Endpoint 2: GET /api/sdk/status/[txHash]/route.ts**

**Purpose**: Check status of a submitted transaction

#### **File**: `src/app/api/sdk/status/[txHash]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = supabaseAdmin!;

export async function GET(
  request: NextRequest,
  { params }: { params: { txHash: string } }
) {
  try {
    const { txHash } = await params;

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Fetch transaction status
    const { data: pendingTx, error } = await supabase
      .from('sdk_pending_transactions')
      .select(`
        *,
        batch_info:sdk_batch_runs(
          id,
          started_at,
          completed_at,
          status
        )
      `)
      .eq('transaction_hash', txHash)
      .maybeSingle();

    if (error) {
      console.error('Error fetching transaction status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch transaction status' },
        { status: 500 }
      );
    }

    if (!pendingTx) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction not found in batch processing queue' 
        },
        { status: 404 }
      );
    }

    // Calculate estimated processing time for pending transactions
    let estimatedProcessingTime = null;
    if (pendingTx.status === 'pending') {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const hoursUntil = Math.ceil((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
      estimatedProcessingTime = `~${hoursUntil} hours`;
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction_hash: pendingTx.transaction_hash,
        app_id: pendingTx.app_id,
        user_address: pendingTx.user_address,
        status: pendingTx.status,
        submitted_at: pendingTx.submitted_at,
        processed_at: pendingTx.processed_at,
        process_tx_hash: pendingTx.process_tx_hash,
        error_message: pendingTx.error_message,
        retry_count: pendingTx.retry_count,
        max_retries: pendingTx.max_retries,
        estimated_processing_time: estimatedProcessingTime,
        batch_info: pendingTx.batch_info
      }
    });

  } catch (error: any) {
    console.error('SDK status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## ⚙️ Batch Processor Implementation

### **Script**: `scripts/process-sdk-batch.js`

**Purpose**: Process all pending transactions daily

```javascript
const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 50; // Process 50 transactions at a time
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function processBatch() {
  console.log('🚀 Starting SDK batch processor...');
  console.log(`📅 Time: ${new Date().toISOString()}`);

  // Create batch run record
  const { data: batchRun, error: batchError } = await supabase
    .from('sdk_batch_runs')
    .insert({
      status: 'running',
      triggered_by: 'cron',
      total_transactions: 0,
      successful_transactions: 0,
      failed_transactions: 0,
      skipped_transactions: 0
    })
    .select()
    .single();

  if (batchError) {
    console.error('❌ Failed to create batch run:', batchError);
    return;
  }

  const batchId = batchRun.id;
  console.log(`📦 Batch ID: ${batchId}`);

  try {
    // Fetch all pending transactions grouped by network
    const { data: pendingTxs, error: fetchError } = await supabase
      .from('sdk_pending_transactions')
      .select('*')
      .eq('status', 'pending')
      .order('network', { ascending: true })
      .order('submitted_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch pending transactions: ${fetchError.message}`);
    }

    console.log(`📊 Found ${pendingTxs.length} pending transactions`);

    if (pendingTxs.length === 0) {
      await supabase
        .from('sdk_batch_runs')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          total_transactions: 0
        })
        .eq('id', batchId);
      
      console.log('✅ No pending transactions to process');
      return;
    }

    // Update batch run with total count
    await supabase
      .from('sdk_batch_runs')
      .update({ total_transactions: pendingTxs.length })
      .eq('id', batchId);

    // Process in batches
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (let i = 0; i < pendingTxs.length; i += BATCH_SIZE) {
      const batch = pendingTxs.slice(i, i + BATCH_SIZE);
      console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} transactions)...`);

      for (const tx of batch) {
        const result = await processTransaction(tx, batchId);
        
        if (result.success) {
          successCount++;
          console.log(`  ✅ ${tx.transaction_hash.substring(0, 10)}... - Success`);
        } else if (result.skipped) {
          skipCount++;
          console.log(`  ⏭️  ${tx.transaction_hash.substring(0, 10)}... - Skipped: ${result.reason}`);
        } else {
          failCount++;
          console.log(`  ❌ ${tx.transaction_hash.substring(0, 10)}... - Failed: ${result.error}`);
        }
      }

      // Update batch statistics
      await supabase
        .from('sdk_batch_runs')
        .update({
          successful_transactions: successCount,
          failed_transactions: failCount,
          skipped_transactions: skipCount
        })
        .eq('id', batchId);

      // Delay between batches to avoid overwhelming the system
      if (i + BATCH_SIZE < pendingTxs.length) {
        console.log(`⏸️  Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // Mark batch run as completed
    await supabase
      .from('sdk_batch_runs')
      .update({
        status: failCount > 0 ? 'partial' : 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId);

    console.log('\n📊 Batch Processing Summary:');
    console.log(`   Total: ${pendingTxs.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log('🎉 Batch processing completed!');

  } catch (error) {
    console.error('❌ Batch processing error:', error);
    
    // Mark batch as failed
    await supabase
      .from('sdk_batch_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_summary: error.message
      })
      .eq('id', batchId);
  }
}

async function processTransaction(tx, batchId) {
  try {
    // Update status to processing
    await supabase
      .from('sdk_pending_transactions')
      .update({ 
        status: 'processing',
        batch_id: batchId
      })
      .eq('id', tx.id);

    // Determine API URL based on network
    const baseUrl = tx.network === 'mainnet' 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : process.env.NEXT_PUBLIC_TESTNET_APP_URL || process.env.NEXT_PUBLIC_APP_URL;

    // Call the submit API for the specific network
    const response = await fetch(`${baseUrl}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_hash: tx.transaction_hash
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Mark as completed
      await supabase
        .from('sdk_pending_transactions')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          process_tx_hash: result.data?.processTxHash || null
        })
        .eq('id', tx.id);

      return { success: true };
    } else {
      // Check if should retry
      if (tx.retry_count < tx.max_retries && isRetryable(result.error)) {
        // Increment retry count, keep as pending
        await supabase
          .from('sdk_pending_transactions')
          .update({
            status: 'pending',
            retry_count: tx.retry_count + 1,
            error_message: result.error || 'Unknown error'
          })
          .eq('id', tx.id);

        return { success: false, error: 'Marked for retry' };
      } else {
        // Mark as failed
        await supabase
          .from('sdk_pending_transactions')
          .update({
            status: 'failed',
            processed_at: new Date().toISOString(),
            error_message: result.error || 'Processing failed'
          })
          .eq('id', tx.id);

        return { success: false, error: result.error || 'Processing failed' };
      }
    }
  } catch (error) {
    console.error(`Error processing transaction ${tx.transaction_hash}:`, error);

    // Mark as failed
    await supabase
      .from('sdk_pending_transactions')
      .update({
        status: 'failed',
        processed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', tx.id);

    return { success: false, error: error.message };
  }
}

function isRetryable(error) {
  // Define which errors should be retried
  const retryableErrors = [
    'network error',
    'timeout',
    'rate limit',
    'temporarily unavailable'
  ];

  return retryableErrors.some(retryError => 
    error?.toLowerCase().includes(retryError)
  );
}

// Run the batch processor
processBatch()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
```

---

## 📅 Cron Job Setup

### **Option A: Vercel Cron Jobs**

**File**: `vercel.json`

```json
{
  "crons": [{
    "path": "/api/cron/process-sdk-batch",
    "schedule": "0 0 * * *"
  }]
}
```

**File**: `src/app/api/cron/process-sdk-batch/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Execute the batch processing script
    const { stdout, stderr } = await execAsync('node scripts/process-sdk-batch.js');
    
    return NextResponse.json({
      success: true,
      message: 'Batch processing completed',
      output: stdout,
      errors: stderr || null
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

### **Option B: External Cron Service (Recommended)**

Use a service like:
- **Cron-job.org** (free, reliable)
- **EasyCron** (flexible scheduling)
- **Your own server** (full control)

**Setup**:
1. Create endpoint: `/api/cron/process-sdk-batch`
2. Set schedule: Daily at 00:00 UTC
3. Configure secret token for security
4. Monitor execution logs

---

## 📊 Monitoring & Analytics

### **Admin Dashboard Endpoint**

**File**: `src/app/api/sdk/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = supabaseAdmin!;

export async function GET(request: NextRequest) {
  try {
    // Get overall statistics
    const { data: stats } = await supabase
      .from('sdk_pending_transactions')
      .select('status')
      .then(result => {
        const counts = {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          skipped: 0
        };
        
        result.data?.forEach(tx => {
          counts[tx.status as keyof typeof counts]++;
        });
        
        return { data: counts };
      });

    // Get recent batch runs
    const { data: recentBatches } = await supabase
      .from('sdk_batch_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    // Get today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayTxs } = await supabase
      .from('sdk_pending_transactions')
      .select('id')
      .gte('submitted_at', today.toISOString());

    return NextResponse.json({
      success: true,
      data: {
        statistics: stats,
        recent_batches: recentBatches,
        today_submissions: todayTxs?.length || 0
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Testing Plan

### **1. Test SDK Submit Endpoint**

```bash
# Test submitting a transaction
curl -X POST http://localhost:3000/api/sdk/submit \
  -H "Content-Type: application/json" \
  -d '{
    "transactionHash": "0x...",
    "network": "mainnet",
    "appId": "my-app-id",
    "userAddress": "0x..."
  }'
```

### **2. Test Status Endpoint**

```bash
# Check transaction status
curl http://localhost:3000/api/sdk/status/0x...
```

### **3. Test Batch Processor**

```bash
# Run batch processor manually
node scripts/process-sdk-batch.js
```

### **4. Test SDK Integration**

```typescript
const sdk = new CrossEraSDK();

// Submit for batch processing
const result = await sdk.submitForProcessing({
  transactionHash: '0x...',
  network: 'mainnet',
  appId: 'my-app-id',  // Optional
  userAddress: '0x...' // Optional
});

console.log('Status:', result.status); // 'pending'
console.log('Network:', result.network); // 'mainnet'
console.log('Estimated time:', result.estimatedProcessingTime);

// Check status later
const status = await sdk.getTransactionStatus({
  transactionHash: '0x...',
  network: 'mainnet'
});

console.log('Current status:', status.status);
console.log('Network:', status.network);
```

---

## 📋 Implementation Checklist

### **Phase 1: Database Setup** (30 mins)
- [ ] Create `sdk_pending_transactions` table
- [ ] Create `sdk_batch_runs` table
- [ ] Add indexes
- [ ] Test table access with `supabaseAdmin`

### **Phase 2: API Endpoints** (2 hours)
- [ ] Create `/api/sdk/submit/route.ts`
- [ ] Create `/api/sdk/status/[txHash]/route.ts`
- [ ] Create `/api/sdk/stats/route.ts`
- [ ] Test all endpoints

### **Phase 3: Batch Processor** (3 hours)
- [ ] Create `scripts/process-sdk-batch.js`
- [ ] Test batch processing locally
- [ ] Add retry logic
- [ ] Add error handling

### **Phase 4: Cron Setup** (1 hour)
- [ ] Choose cron solution (Vercel/External)
- [ ] Create cron endpoint if using Vercel
- [ ] Configure cron schedule (00:00 UTC daily)
- [ ] Add authentication/security
- [ ] Test cron execution

### **Phase 5: Testing** (2 hours)
- [ ] End-to-end testing
- [ ] Load testing (multiple simultaneous submissions)
- [ ] Error scenario testing
- [ ] Monitor first batch run

### **Phase 6: Documentation** (1 hour)
- [ ] Update SDK documentation
- [ ] Add batch processing guide
- [ ] Create troubleshooting guide
- [ ] Add monitoring dashboard docs

---

## 🚀 Deployment Steps

1. **Deploy Database Changes**
   - Run SQL migrations on Supabase
   - Verify tables created

2. **Deploy API Changes**
   - Push code to repository
   - Deploy to Vercel/your hosting
   - Verify endpoints accessible

3. **Setup Cron Job**
   - Configure cron service
   - Set up monitoring/alerts
   - Test first run

4. **Update SDK**
   - SDK already has the methods
   - Just needs endpoints to be live
   - Test SDK integration

5. **Monitor First Week**
   - Check daily batch runs
   - Monitor success rates
   - Adjust batch size if needed
   - Fix any issues

---

## 💡 Best Practices

1. **Rate Limiting**: Add rate limiting to SDK endpoints to prevent abuse
2. **Deduplication**: Check for duplicate submissions before storing
3. **Monitoring**: Set up alerts for failed batch runs
4. **Logging**: Log all batch processing activities
5. **Cleanup**: Archive old completed transactions after 30 days
6. **Scaling**: Increase batch size as volume grows

---

## 📊 Expected Performance

| Metric | Value |
|--------|-------|
| Submissions per day | Up to 10,000 |
| Processing time | 1-2 hours (for 10K txs) |
| Batch size | 50 transactions |
| Retry attempts | 3 per transaction |
| Success rate | >95% expected |

---

## 🎯 Next Steps

1. Review this implementation plan
2. Make any adjustments needed
3. Start with Phase 1 (Database Setup)
4. Progress through phases sequentially
5. Test thoroughly before going live

Ready to start implementation? Let me know if you need any clarifications or changes to the plan!

