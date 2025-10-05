const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSDKTransactions() {
  console.log('📊 SDK Transactions Status Report');
  console.log('================================');
  
  try {
    // Get pending transactions
    const { data: pendingTransactions } = await supabase
      .from('sdk_pending_transactions')
      .select('*')
      .in('status', ['pending', 'processing', 'failed'])
      .order('submitted_at', { ascending: true });

    // Get recent batch runs
    const { data: batchRuns } = await supabase
      .from('sdk_batch_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);

    // Get status counts
    const { data: statusCounts } = await supabase
      .from('sdk_pending_transactions')
      .select('status')
      .then(result => {
        const counts = {};
        result.data.forEach(row => {
          counts[row.status] = (counts[row.status] || 0) + 1;
        });
        return { data: counts };
      });

    console.log('\n📈 Status Summary:');
    console.log('------------------');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status.toUpperCase()}: ${count}`);
    });

    if (pendingTransactions && pendingTransactions.length > 0) {
      console.log(`\n⏳ Pending Transactions (${pendingTransactions.length}):`);
      console.log('--------------------------------------------');
      
      pendingTransactions.forEach(tx => {
        const submittedDate = new Date(tx.submitted_at);
        const timeAgo = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60)); // hours ago
        
        console.log(`  📝 ${tx.tx_hash}`);
        console.log(`     App: ${tx.app_id}`);
        console.log(`     Status: ${tx.status}`);
        console.log(`     Retry: ${tx.retry_count}/${tx.max_retries}`);
        console.log(`     Submitted: ${submittedDate.toISOString()} (${timeAgo}h ago)`);
        if (tx.error_message) {
          console.log(`     Error: ${tx.error_message}`);
        }
        console.log('');
      });
    } else {
      console.log('\n✅ No pending transactions');
    }

    if (batchRuns && batchRuns.length > 0) {
      console.log('\n🔄 Recent Batch Runs:');
      console.log('---------------------');
      
      batchRuns.forEach(batch => {
        const startedDate = new Date(batch.started_at);
        const completedDate = batch.completed_at ? new Date(batch.completed_at) : null;
        const duration = completedDate ? 
          Math.floor((completedDate.getTime() - startedDate.getTime()) / 1000) : 
          Math.floor((Date.now() - startedDate.getTime()) / 1000);
        
        console.log(`  🆔 Batch ${batch.id} (${batch.status.toUpperCase()})`);
        console.log(`     Started: ${startedDate.toISOString()}`);
        if (completedDate) {
          console.log(`     Completed: ${completedDate.toISOString()}`);
        }
        console.log(`     Duration: ${duration}s`);
        console.log(`     Total: ${batch.total_transactions || 0}`);
        console.log(`     Processed: ${batch.processed_transactions || 0}`);
        console.log(`     Failed: ${batch.failed_transactions || 0}`);
        console.log(`     Skipped: ${batch.skipped_transactions || 0}`);
        console.log(`     Retried: ${batch.retried_transactions || 0}`);
        if (batch.gas_used_total) {
          console.log(`     Gas Used: ${batch.gas_used_total}`);
        }
        if (batch.error_message) {
          console.log(`     Error: ${batch.error_message}`);
        }
        console.log('');
      });
    }

    // Check for transactions that have been pending for more than 24 hours
    const { data: oldTransactions } = await supabase
      .from('sdk_pending_transactions')
      .select('*')
      .eq('status', 'pending')
      .lt('submitted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (oldTransactions && oldTransactions.length > 0) {
      console.log('\n⚠️  Old Pending Transactions (>24h):');
      console.log('-----------------------------------');
      oldTransactions.forEach(tx => {
        const submittedDate = new Date(tx.submitted_at);
        const hoursAgo = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60));
        console.log(`  📝 ${tx.tx_hash} (${hoursAgo}h ago)`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking SDK transactions:', error);
  }
}

// Run the script
if (require.main === module) {
  checkSDKTransactions()
    .then(() => {
      console.log('\n🎉 Status check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { checkSDKTransactions };
