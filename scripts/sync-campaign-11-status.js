const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rpcUrl = process.env.RPC_URL || 'https://rpc.mainnet.ms';
const contractAddress = process.env.CONTRACT_ADDRESS || '0x64Baa5262A0700061728e3A6Bbf7Eb866EdFC191';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Contract ABI for getCampaign function
const contractABI = [
  'function getCampaign(uint32 campaignId) view returns (uint256 totalPool, uint256 distributedRewards, uint64 startDate, uint64 endDate, bool active)'
];

async function syncCampaignStatus() {
  try {
    console.log('🔄 Syncing Campaign 11 status between smart contract and database...\n');

    // 1. Get campaign data from smart contract
    console.log('1️⃣ Fetching campaign data from smart contract...');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    const campaignId = 11;
    const contractData = await contract.getCampaign(campaignId);
    
    console.log('📊 Smart Contract Data:');
    console.log({
      campaignId: campaignId,
      totalPool: ethers.formatEther(contractData.totalPool) + ' XFI',
      distributedRewards: ethers.formatEther(contractData.distributedRewards) + ' XFI',
      startDate: new Date(Number(contractData.startDate) * 1000).toISOString(),
      endDate: new Date(Number(contractData.endDate) * 1000).toISOString(),
      active: contractData.active
    });

    // 2. Get campaign data from database
    console.log('\n2️⃣ Fetching campaign data from database...');
    const { data: dbCampaign, error: dbError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return;
    }

    if (!dbCampaign) {
      console.error('❌ Campaign 11 not found in database');
      return;
    }

    console.log('📊 Database Data:');
    console.log({
      campaignId: dbCampaign.campaign_id,
      name: dbCampaign.name,
      totalPool: dbCampaign.total_pool,
      distributedRewards: dbCampaign.distributed_rewards,
      startDate: dbCampaign.start_date,
      endDate: dbCampaign.end_date,
      is_active: dbCampaign.is_active
    });

    // 3. Compare and sync
    console.log('\n3️⃣ Comparing data...');
    const needsSync = 
      dbCampaign.is_active !== contractData.active ||
      dbCampaign.total_pool !== contractData.totalPool.toString() ||
      dbCampaign.distributed_rewards !== contractData.distributedRewards.toString();

    if (!needsSync) {
      console.log('✅ Database is already in sync with smart contract');
      return;
    }

    console.log('⚠️  Mismatch detected! Syncing database...');
    console.log('Differences:');
    console.log('- is_active:', dbCampaign.is_active, '→', contractData.active);
    console.log('- total_pool:', dbCampaign.total_pool, '→', contractData.totalPool.toString());
    console.log('- distributed_rewards:', dbCampaign.distributed_rewards, '→', contractData.distributedRewards.toString());

    // 4. Update database
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update({
        is_active: contractData.active,
        total_pool: contractData.totalPool.toString(),
        distributed_rewards: contractData.distributedRewards.toString()
      })
      .eq('campaign_id', campaignId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update database:', updateError);
      return;
    }

    console.log('\n✅ Successfully synced Campaign 11!');
    console.log('Updated database fields:');
    console.log({
      is_active: updatedCampaign.is_active,
      total_pool: updatedCampaign.total_pool,
      distributed_rewards: updatedCampaign.distributed_rewards
    });

    // 5. Verify frontend status
    console.log('\n4️⃣ Verifying frontend status calculation...');
    const now = new Date();
    const startDate = new Date(dbCampaign.start_date);
    const endDate = new Date(dbCampaign.end_date);
    
    let frontendStatus;
    if (now < startDate) {
      frontendStatus = 'upcoming';
    } else if (now >= startDate && now <= endDate && updatedCampaign.is_active) {
      frontendStatus = 'active';
    } else if (now > endDate) {
      frontendStatus = 'ended';
    } else {
      frontendStatus = 'inactive';
    }

    console.log('Frontend will now show status:', frontendStatus);
    console.log('Smart contract active:', contractData.active);
    console.log('Database is_active:', updatedCampaign.is_active);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

syncCampaignStatus();
