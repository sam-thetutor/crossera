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

// Contract ABI for campaign functions
const contractABI = [
  'function totalCampaigns() view returns (uint32)',
  'function getCampaign(uint32 campaignId) view returns (uint256 totalPool, uint256 distributedRewards, uint64 startDate, uint64 endDate, bool active)'
];

async function checkCampaign14() {
  try {
    console.log('🔍 Checking Campaign 14 status...\n');

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // 1. Check total campaigns on contract
    console.log('1️⃣ Checking total campaigns on smart contract...');
    const totalCampaigns = await contract.totalCampaigns();
    console.log('Total campaigns on contract:', totalCampaigns.toString());

    // 2. Check if Campaign 14 exists on contract
    console.log('\n2️⃣ Checking Campaign 14 on smart contract...');
    let campaign14Contract;
    try {
      campaign14Contract = await contract.getCampaign(14);
      console.log('✅ Campaign 14 found on smart contract!');
    } catch (error) {
      console.log('❌ Campaign 14 NOT found on smart contract:', error.message);
      console.log('This means Campaign 14 was not created on the blockchain yet.');
      return;
    }

    // 3. Display smart contract data
    const now = Math.floor(Date.now() / 1000);
    const startTime = Number(campaign14Contract.startDate);
    const endTime = Number(campaign14Contract.endDate);
    
    let status = 'unknown';
    if (now < startTime) {
      status = 'upcoming';
    } else if (now >= startTime && now <= endTime && campaign14Contract.active) {
      status = 'active';
    } else if (now > endTime) {
      status = 'ended';
    } else if (!campaign14Contract.active) {
      status = 'inactive';
    }

    console.log('📊 Smart Contract Data:');
    console.log({
      campaignId: 14,
      totalPool: ethers.formatEther(campaign14Contract.totalPool) + ' XFI',
      distributedRewards: ethers.formatEther(campaign14Contract.distributedRewards) + ' XFI',
      startDate: new Date(startTime * 1000).toISOString(),
      endDate: new Date(endTime * 1000).toISOString(),
      active: campaign14Contract.active,
      status: status,
      currentTime: new Date(now * 1000).toISOString()
    });

    // 4. Check Campaign 14 in database
    console.log('\n3️⃣ Checking Campaign 14 in database...');
    const { data: campaign14Db, error: dbError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', 14)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        console.log('❌ Campaign 14 NOT found in database');
      } else {
        console.error('❌ Database error:', dbError);
      }
    } else {
      console.log('✅ Campaign 14 found in database!');
      console.log('📊 Database Data:');
      
      const dbNow = new Date();
      const dbStartDate = new Date(campaign14Db.start_date);
      const dbEndDate = new Date(campaign14Db.end_date);
      
      let dbStatus = 'unknown';
      if (dbNow < dbStartDate) {
        dbStatus = 'upcoming';
      } else if (dbNow >= dbStartDate && dbNow <= dbEndDate && campaign14Db.is_active) {
        dbStatus = 'active';
      } else if (dbNow > dbEndDate) {
        dbStatus = 'ended';
      } else if (!campaign14Db.is_active) {
        dbStatus = 'inactive';
      }

      console.log({
        campaignId: campaign14Db.campaign_id,
        name: campaign14Db.name,
        totalPool: campaign14Db.total_pool,
        distributedRewards: campaign14Db.distributed_rewards,
        startDate: campaign14Db.start_date,
        endDate: campaign14Db.end_date,
        is_active: campaign14Db.is_active,
        status: dbStatus,
        currentTime: dbNow.toISOString()
      });
    }

    // 5. Compare and identify issues
    if (campaign14Db) {
      console.log('\n4️⃣ Comparing smart contract vs database...');
      
      const mismatches = [];
      if (campaign14Db.is_active !== campaign14Contract.active) {
        mismatches.push(`is_active: ${campaign14Db.is_active} vs ${campaign14Contract.active}`);
      }
      if (campaign14Db.total_pool !== campaign14Contract.totalPool.toString()) {
        mismatches.push(`total_pool: ${campaign14Db.total_pool} vs ${campaign14Contract.totalPool.toString()}`);
      }
      if (campaign14Db.distributed_rewards !== campaign14Contract.distributedRewards.toString()) {
        mismatches.push(`distributed_rewards: ${campaign14Db.distributed_rewards} vs ${campaign14Contract.distributedRewards.toString()}`);
      }

      if (mismatches.length > 0) {
        console.log('⚠️  Mismatches found:');
        mismatches.forEach(mismatch => console.log(`  - ${mismatch}`));
        
        // 6. Fix the mismatches
        console.log('\n5️⃣ Fixing mismatches...');
        const { data: updatedCampaign14, error: updateError } = await supabase
          .from('campaigns')
          .update({
            is_active: campaign14Contract.active,
            total_pool: campaign14Contract.totalPool.toString(),
            distributed_rewards: campaign14Contract.distributedRewards.toString()
          })
          .eq('campaign_id', 14)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Failed to update Campaign 14:', updateError);
        } else {
          console.log('✅ Campaign 14 updated successfully!');
          console.log('Updated fields:', {
            is_active: updatedCampaign14.is_active,
            total_pool: updatedCampaign14.total_pool,
            distributed_rewards: updatedCampaign14.distributed_rewards
          });
        }
      } else {
        console.log('✅ No mismatches found - database is in sync!');
      }
    } else {
      console.log('\n4️⃣ Campaign 14 exists on contract but not in database!');
      console.log('You need to create Campaign 14 in the database first.');
    }

    // 7. Check timing for frontend status
    console.log('\n6️⃣ Frontend status analysis...');
    const timeRemaining = endTime - now;
    const timeUntilStart = startTime - now;
    
    if (timeUntilStart > 0) {
      console.log(`📅 Campaign 14 will start in ${Math.floor(timeUntilStart / 60)} minutes`);
      console.log('Frontend status: upcoming');
    } else if (timeRemaining > 0 && campaign14Contract.active) {
      console.log(`⏰ Campaign 14 is ACTIVE with ${Math.floor(timeRemaining / 60)} minutes remaining`);
      console.log('Frontend status: active');
    } else if (timeRemaining <= 0) {
      console.log(`⏹️  Campaign 14 has ENDED (${Math.floor(Math.abs(timeRemaining) / 60)} minutes ago)`);
      console.log('Frontend status: ended');
    } else if (!campaign14Contract.active) {
      console.log('❌ Campaign 14 is INACTIVE on contract');
      console.log('Frontend status: inactive');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCampaign14();
