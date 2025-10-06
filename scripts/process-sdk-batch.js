const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const BATCH_SIZE = 50; // Process 50 transactions at a time
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds
const DELAY_BETWEEN_TRANSACTIONS = 1000; // 1 second between transactions

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function processBatch() {
  console.log('🚀 Starting SDK batch processor...');
  console.log(`📅 Time: ${new Date().toISOString()}`);

  // Create batch run record
  const { data: batchRun, error: batchError } = await supabase
    .from('sdk_batch_runs')
    .insert({
      run_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
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

    // Process transactions
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (let i = 0; i < pendingTxs.length; i += BATCH_SIZE) {
      const batch = pendingTxs.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(pendingTxs.length / BATCH_SIZE);
      
      console.log(`\n🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} transactions)...`);

      for (const tx of batch) {
        const result = await processTransaction(tx, batchId);
        
        if (result.success) {
          successCount++;
          console.log(`  ✅ ${tx.transaction_hash.substring(0, 10)}... [${tx.network}] - Success`);
        } else if (result.skipped) {
          skipCount++;
          console.log(`  ⏭️  ${tx.transaction_hash.substring(0, 10)}... [${tx.network}] - Skipped: ${result.reason}`);
        } else {
          failCount++;
          console.log(`  ❌ ${tx.transaction_hash.substring(0, 10)}... [${tx.network}] - Failed: ${result.error}`);
        }

        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TRANSACTIONS));
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

      // Delay between batches
      if (i + BATCH_SIZE < pendingTxs.length) {
        console.log(`⏸️  Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // Mark batch run as completed
    const finalStatus = failCount === 0 ? 'completed' : (successCount > 0 ? 'partial' : 'failed');
    await supabase
      .from('sdk_batch_runs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId);

    console.log('\n📊 Batch Processing Summary:');
    console.log(`   Total: ${pendingTxs.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   📈 Success Rate: ${((successCount / pendingTxs.length) * 100).toFixed(1)}%`);
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
    
    process.exit(1);
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

    // Call the submit API (uses same endpoint for all networks)
    const response = await fetch(`${APP_URL}/api/submit`, {
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
      // Check if error is retryable
      const errorMsg = result.error || 'Unknown error';
      
      if (tx.retry_count < tx.max_retries && isRetryable(errorMsg)) {
        // Increment retry count, keep as pending for next batch
        await supabase
          .from('sdk_pending_transactions')
          .update({
            status: 'pending',
            retry_count: tx.retry_count + 1,
            error_message: errorMsg
          })
          .eq('id', tx.id);

        return { 
          success: false, 
          error: `Marked for retry (attempt ${tx.retry_count + 1}/${tx.max_retries}): ${errorMsg}` 
        };
      } else {
        // Max retries reached or non-retryable error - mark as failed
        await supabase
          .from('sdk_pending_transactions')
          .update({
            status: 'failed',
            processed_at: new Date().toISOString(),
            error_message: errorMsg
          })
          .eq('id', tx.id);

        return { success: false, error: errorMsg };
      }
    }
    
  } catch (error) {
    console.error(`Error processing transaction ${tx.transaction_hash}:`, error);

    // Check if should retry
    if (tx.retry_count < tx.max_retries && isRetryable(error.message)) {
      await supabase
        .from('sdk_pending_transactions')
        .update({
          status: 'pending',
          retry_count: tx.retry_count + 1,
          error_message: error.message
        })
        .eq('id', tx.id);

      return { success: false, error: `Retrying: ${error.message}` };
    }

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

// Determine if an error should trigger a retry
function isRetryable(errorMessage) {
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
    'gateway'
  ];

  return retryableErrors.some(retryError => error.includes(retryError));
}

// Run the batch processor
processBatch()
  .then(() => {
    console.log('\n✅ Batch processor completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

