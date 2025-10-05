const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Load contract ABI
const crossEraABI = require('../src/lib/cross-era-abi.json').abi;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  crossEraABI,
  provider
);

// Create verifier wallet
const verifierWallet = new ethers.Wallet(
  process.env.VERIFIER_PRIVATE_KEY,
  provider
);

const contractWithSigner = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  crossEraABI,
  verifierWallet
);

async function processSDKTransactions() {
  console.log('🚀 Starting SDK batch processing...');
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  
  // Create batch run record
  const { data: batchRun, error: batchError } = await supabase
    .from('sdk_batch_runs')
    .insert({
      started_at: new Date().toISOString(),
      status: 'running'
    })
    .select()
    .single();

  if (batchError) {
    console.error('❌ Failed to create batch run record:', batchError);
    return;
  }

  const batchId = batchRun.id;
  console.log(`📊 Batch Run ID: ${batchId}`);

  try {
    // Get all pending transactions (including retry attempts)
    const { data: pendingTransactions, error: fetchError } = await supabase
      .from('sdk_pending_transactions')
      .select(`
        id,
        tx_hash,
        app_id,
        project_id,
        user_address,
        status,
        retry_count,
        max_retries,
        error_message,
        submitted_at
      `)
      .in('status', ['pending', 'failed'])
      .lt('retry_count', 3) // Only process transactions that haven't exceeded max retries
      .order('submitted_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch pending transactions: ${fetchError.message}`);
    }

    console.log(`📋 Found ${pendingTransactions.length} transactions to process`);

    if (pendingTransactions.length === 0) {
      console.log('✅ No transactions to process. Batch completed.');
      await updateBatchRun(batchId, 'completed', 0, 0, 0, 0, 0);
      return;
    }

    // Update batch run with total count
    await supabase
      .from('sdk_batch_runs')
      .update({ total_transactions: pendingTransactions.length })
      .eq('id', batchId);

    let processedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let retriedCount = 0;
    let totalGasUsed = BigInt(0);

    // Group transactions by app_id for efficient processing
    const transactionsByApp = {};
    pendingTransactions.forEach(tx => {
      if (!transactionsByApp[tx.app_id]) {
        transactionsByApp[tx.app_id] = [];
      }
      transactionsByApp[tx.app_id].push(tx);
    });

    console.log(`📦 Grouped transactions into ${Object.keys(transactionsByApp).length} app groups`);

    // Process each app's transactions
    for (const [appId, transactions] of Object.entries(transactionsByApp)) {
      console.log(`\n🔄 Processing ${transactions.length} transactions for app: ${appId}`);
      
      for (const transaction of transactions) {
        try {
          // Update transaction status to processing
          await supabase
            .from('sdk_pending_transactions')
            .update({ 
              status: 'processing',
              batch_id: batchId
            })
            .eq('id', transaction.id);

          console.log(`  📝 Processing tx: ${transaction.tx_hash} (attempt ${transaction.retry_count + 1})`);

          // Get transaction details from blockchain
          const tx = await provider.getTransaction(transaction.tx_hash);
          if (!tx) {
            throw new Error('Transaction not found on blockchain');
          }

          const receipt = await provider.getTransactionReceipt(transaction.tx_hash);
          if (!receipt) {
            throw new Error('Transaction receipt not found');
          }

          // Check if already processed on-chain (double-check)
          const isProcessed = await contract.processedTransactions(transaction.tx_hash);
          if (isProcessed) {
            console.log(`  ⚠️  Transaction already processed on-chain, marking as skipped`);
            await supabase
              .from('sdk_pending_transactions')
              .update({ 
                status: 'skipped',
                processed_at: new Date().toISOString(),
                error_message: 'Already processed on-chain'
              })
              .eq('id', transaction.id);
            skippedCount++;
            continue;
          }

          // Calculate transaction metrics
          const gasUsed = receipt.gasUsed;
          const gasPrice = tx.gasPrice || BigInt(0);
          const feeGenerated = gasUsed * gasPrice;
          const transactionValue = tx.value || BigInt(0);

          // Call processTransaction on smart contract
          const processTx = await contractWithSigner.processTransaction(
            transaction.app_id,
            transaction.tx_hash,
            gasUsed,
            gasPrice,
            transactionValue
          );

          // Wait for transaction confirmation
          const processReceipt = await processTx.wait();
          
          console.log(`  ✅ Successfully processed tx: ${processReceipt.hash}`);
          console.log(`  ⛽ Gas used: ${gasUsed.toString()}`);

          totalGasUsed += gasUsed;

          // Save to main transactions table
          const { error: saveError } = await supabase
            .from('transactions')
            .insert({
              tx_hash: transaction.tx_hash,
              app_id: transaction.app_id,
              project_id: transaction.project_id,
              from_address: tx.from,
              to_address: tx.to,
              user_address: transaction.user_address,
              amount: transactionValue.toString(),
              gas_used: gasUsed.toString(),
              gas_price: gasPrice.toString(),
              fee_generated: feeGenerated.toString(),
              block_number: receipt.blockNumber,
              timestamp: new Date().toISOString(),
              status: 'processed',
              process_tx_hash: processReceipt.hash,
              is_unique_user: true, // SDK transactions are considered unique
              reward_calculated: '0' // Will be calculated later
            });

          if (saveError) {
            console.log(`  ⚠️  Warning: Failed to save to main transactions table: ${saveError.message}`);
          }

          // Update SDK transaction status
          await supabase
            .from('sdk_pending_transactions')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString(),
              batch_id: batchId,
              error_message: null
            })
            .eq('id', transaction.id);

          processedCount++;

          // Small delay between transactions to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`  ❌ Failed to process tx ${transaction.tx_hash}:`, error.message);
          
          const newRetryCount = transaction.retry_count + 1;
          const shouldRetry = newRetryCount < transaction.max_retries;
          
          await supabase
            .from('sdk_pending_transactions')
            .update({ 
              status: shouldRetry ? 'failed' : 'failed',
              retry_count: newRetryCount,
              error_message: error.message,
              batch_id: batchId
            })
            .eq('id', transaction.id);

          if (shouldRetry) {
            console.log(`  🔄 Will retry (attempt ${newRetryCount}/${transaction.max_retries})`);
            retriedCount++;
          } else {
            console.log(`  💀 Max retries exceeded, giving up`);
          }

          failedCount++;
        }
      }
    }

    // Update batch run with final statistics
    await updateBatchRun(
      batchId, 
      'completed', 
      pendingTransactions.length, 
      processedCount, 
      failedCount, 
      skippedCount, 
      retriedCount,
      totalGasUsed
    );

    console.log('\n📊 Batch Processing Summary:');
    console.log(`  📋 Total transactions: ${pendingTransactions.length}`);
    console.log(`  ✅ Processed: ${processedCount}`);
    console.log(`  ❌ Failed: ${failedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  🔄 Retried: ${retriedCount}`);
    console.log(`  ⛽ Total gas used: ${totalGasUsed.toString()}`);
    console.log(`  📅 Completed at: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('💥 Batch processing failed:', error);
    
    await supabase
      .from('sdk_batch_runs')
      .update({ 
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId);
  }
}

async function updateBatchRun(batchId, status, total, processed, failed, skipped, retried, gasUsed = BigInt(0)) {
  await supabase
    .from('sdk_batch_runs')
    .update({
      status: status,
      completed_at: new Date().toISOString(),
      total_transactions: total,
      processed_transactions: processed,
      failed_transactions: failed,
      skipped_transactions: skipped,
      retried_transactions: retried,
      gas_used_total: gasUsed.toString()
    })
    .eq('id', batchId);
}

// Run the script
if (require.main === module) {
  processSDKTransactions()
    .then(() => {
      console.log('🎉 SDK batch processing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { processSDKTransactions };
