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

async function fixCampaigns12And13() {
  try {
    console.log('🔧 Fixing Campaigns 12 and 13 database sync...\n');

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Fix Campaign 12
    console.log('1️⃣ Fixing Campaign 12...');
    const campaign12Contract = await contract.getCampaign(12);
    
    const { data: campaign12Db, error: campaign12Error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', 12)
      .single();

    if (campaign12Error) {
      console.error('❌ Error fetching Campaign 12 from database:', campaign12Error);
    } else {
      console.log('Campaign 12 Contract Data:', {
        active: campaign12Contract.active,
        totalPool: ethers.formatEther(campaign12Contract.totalPool) + ' XFI',
        distributedRewards: ethers.formatEther(campaign12Contract.distributedRewards) + ' XFI'
      });

      console.log('Campaign 12 Database Data:', {
        is_active: campaign12Db.is_active,
        totalPool: campaign12Db.total_pool,
        distributedRewards: campaign12Db.distributed_rewards
      });

      // Update Campaign 12
      const { data: updatedCampaign12, error: updateError12 } = await supabase
        .from('campaigns')
        .update({
          is_active: campaign12Contract.active,
          total_pool: campaign12Contract.totalPool.toString(),
          distributed_rewards: campaign12Contract.distributedRewards.toString()
        })
        .eq('campaign_id', 12)
        .select()
        .single();

      if (updateError12) {
        console.error('❌ Failed to update Campaign 12:', updateError12);
      } else {
        console.log('✅ Campaign 12 updated successfully:', {
          is_active: updatedCampaign12.is_active,
          total_pool: updatedCampaign12.total_pool,
          distributed_rewards: updatedCampaign12.distributed_rewards
        });
      }
    }

    // Fix Campaign 13
    console.log('\n2️⃣ Fixing Campaign 13...');
    const campaign13Contract = await contract.getCampaign(13);
    
    const { data: campaign13Db, error: campaign13Error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', 13)
      .single();

    if (campaign13Error) {
      console.error('❌ Error fetching Campaign 13 from database:', campaign13Error);
    } else {
      console.log('Campaign 13 Contract Data:', {
        active: campaign13Contract.active,
        totalPool: ethers.formatEther(campaign13Contract.totalPool) + ' XFI',
        distributedRewards: ethers.formatEther(campaign13Contract.distributedRewards) + ' XFI'
      });

      console.log('Campaign 13 Database Data:', {
        is_active: campaign13Db.is_active,
        totalPool: campaign13Db.total_pool,
        distributedRewards: campaign13Db.distributed_rewards
      });

      // Update Campaign 13
      const { data: updatedCampaign13, error: updateError13 } = await supabase
        .from('campaigns')
        .update({
          is_active: campaign13Contract.active,
          total_pool: campaign13Contract.totalPool.toString(),
          distributed_rewards: campaign13Contract.distributedRewards.toString()
        })
        .eq('campaign_id', 13)
        .select()
        .single();

      if (updateError13) {
        console.error('❌ Failed to update Campaign 13:', updateError13);
      } else {
        console.log('✅ Campaign 13 updated successfully:', {
          is_active: updatedCampaign13.is_active,
          total_pool: updatedCampaign13.total_pool,
          distributed_rewards: updatedCampaign13.distributed_rewards
        });
      }
    }

    // Check current time vs Campaign 13 end time
    console.log('\n3️⃣ Checking Campaign 13 timing...');
    const now = Math.floor(Date.now() / 1000);
    const campaign13EndTime = Number(campaign13Contract.endDate);
    const timeRemaining = campaign13EndTime - now;

    console.log('Current time:', new Date(now * 1000).toISOString());
    console.log('Campaign 13 end time:', new Date(campaign13EndTime * 1000).toISOString());
    
    if (timeRemaining > 0) {
      console.log(`✅ Campaign 13 should be ACTIVE (${Math.floor(timeRemaining / 60)} minutes remaining)`);
    } else {
      console.log(`❌ Campaign 13 has ENDED (${Math.floor(Math.abs(timeRemaining) / 60)} minutes ago)`);
    }

    console.log('\n✅ Campaigns 12 and 13 database sync completed!');
    console.log('The frontend should now show the correct status for these campaigns.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixCampaigns12And13();
