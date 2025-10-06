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
  'function getCampaign(uint32 campaignId) view returns (uint256 totalPool, uint256 distributedRewards, uint64 startDate, uint64 endDate, bool active)',
  'function campaigns(uint32) view returns (uint256 totalPool, uint256 distributedRewards, uint64 startDate, uint64 endDate, bool active)'
];

async function checkAllCampaigns() {
  try {
    console.log('🔍 Fetching ALL campaigns from smart contract and database...\n');

    // 1. Get total campaigns from smart contract
    console.log('1️⃣ Fetching total campaigns from smart contract...');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    const totalCampaigns = await contract.totalCampaigns();
    console.log('📊 Total campaigns on contract:', totalCampaigns.toString());

    // 2. Fetch all campaigns from smart contract
    console.log('\n2️⃣ Fetching all campaign data from smart contract...');
    const contractCampaigns = [];
    
    for (let i = 1; i <= Number(totalCampaigns); i++) {
      try {
        const campaign = await contract.getCampaign(i);
        const now = Math.floor(Date.now() / 1000);
        const startTime = Number(campaign.startDate);
        const endTime = Number(campaign.endDate);
        
        let status = 'unknown';
        if (now < startTime) {
          status = 'upcoming';
        } else if (now >= startTime && now <= endTime && campaign.active) {
          status = 'active';
        } else if (now > endTime) {
          status = 'ended';
        } else if (!campaign.active) {
          status = 'inactive';
        }

        contractCampaigns.push({
          campaignId: i,
          totalPool: ethers.formatEther(campaign.totalPool),
          distributedRewards: ethers.formatEther(campaign.distributedRewards),
          startDate: new Date(startTime * 1000).toISOString(),
          endDate: new Date(endTime * 1000).toISOString(),
          active: campaign.active,
          status: status,
          startTimestamp: startTime,
          endTimestamp: endTime
        });
      } catch (error) {
        console.log(`⚠️  Campaign ${i} not found or error:`, error.message);
      }
    }

    console.log('📊 Smart Contract Campaigns:');
    contractCampaigns.forEach(campaign => {
      console.log(`Campaign ${campaign.campaignId}:`, {
        name: `Campaign ${campaign.campaignId}`,
        totalPool: campaign.totalPool + ' XFI',
        distributedRewards: campaign.distributedRewards + ' XFI',
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        active: campaign.active,
        status: campaign.status
      });
    });

    // 3. Fetch all campaigns from database
    console.log('\n3️⃣ Fetching all campaign data from database...');
    const { data: dbCampaigns, error: dbError } = await supabase
      .from('campaigns')
      .select('*')
      .order('campaign_id', { ascending: true });

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return;
    }

    console.log('📊 Database Campaigns:');
    dbCampaigns.forEach(campaign => {
      const now = new Date();
      const startDate = new Date(campaign.start_date);
      const endDate = new Date(campaign.end_date);
      
      let status = 'unknown';
      if (now < startDate) {
        status = 'upcoming';
      } else if (now >= startDate && now <= endDate && campaign.is_active) {
        status = 'active';
      } else if (now > endDate) {
        status = 'ended';
      } else if (!campaign.is_active) {
        status = 'inactive';
      }

      console.log(`Campaign ${campaign.campaign_id}:`, {
        name: campaign.name,
        totalPool: campaign.total_pool,
        distributedRewards: campaign.distributed_rewards,
        startDate: campaign.start_date,
        endDate: campaign.end_date,
        is_active: campaign.is_active,
        status: status
      });
    });

    // 4. Compare and identify mismatches
    console.log('\n4️⃣ Comparing smart contract vs database...');
    
    const contractIds = new Set(contractCampaigns.map(c => c.campaignId));
    const dbIds = new Set(dbCampaigns.map(c => c.campaign_id));
    
    console.log('Contract campaign IDs:', Array.from(contractIds).sort((a, b) => a - b));
    console.log('Database campaign IDs:', Array.from(dbIds).sort((a, b) => a - b));
    
    // Find missing campaigns
    const missingInDb = contractCampaigns.filter(c => !dbIds.has(c.campaignId));
    const missingInContract = dbCampaigns.filter(c => !contractIds.has(c.campaign_id));
    
    if (missingInDb.length > 0) {
      console.log('\n⚠️  Campaigns in contract but missing in database:');
      missingInDb.forEach(campaign => {
        console.log(`  - Campaign ${campaign.campaignId}: ${campaign.status} (${campaign.active ? 'active' : 'inactive'})`);
      });
    }
    
    if (missingInContract.length > 0) {
      console.log('\n⚠️  Campaigns in database but missing in contract:');
      missingInContract.forEach(campaign => {
        console.log(`  - Campaign ${campaign.campaign_id}: ${campaign.name}`);
      });
    }

    // Find mismatched status
    console.log('\n5️⃣ Checking for status mismatches...');
    const mismatches = [];
    
    contractCampaigns.forEach(contractCampaign => {
      const dbCampaign = dbCampaigns.find(c => c.campaign_id === contractCampaign.campaignId);
      if (dbCampaign) {
        if (dbCampaign.is_active !== contractCampaign.active) {
          mismatches.push({
            campaignId: contractCampaign.campaignId,
            name: dbCampaign.name,
            contractActive: contractCampaign.active,
            dbActive: dbCampaign.is_active,
            contractStatus: contractCampaign.status
          });
        }
      }
    });
    
    if (mismatches.length > 0) {
      console.log('⚠️  Status mismatches found:');
      mismatches.forEach(mismatch => {
        console.log(`  - Campaign ${mismatch.campaignId} (${mismatch.name}):`);
        console.log(`    Contract: ${mismatch.contractActive ? 'active' : 'inactive'} (${mismatch.contractStatus})`);
        console.log(`    Database: ${mismatch.dbActive ? 'active' : 'inactive'}`);
      });
    } else {
      console.log('✅ No status mismatches found');
    }

    // 6. Summary
    console.log('\n6️⃣ Summary:');
    console.log(`Total campaigns on contract: ${contractCampaigns.length}`);
    console.log(`Total campaigns in database: ${dbCampaigns.length}`);
    console.log(`Missing in database: ${missingInDb.length}`);
    console.log(`Missing in contract: ${missingInContract.length}`);
    console.log(`Status mismatches: ${mismatches.length}`);

    // 7. Check specific campaigns 12 and 13
    console.log('\n7️⃣ Checking Campaigns 12 and 13 specifically...');
    
    const campaign12Contract = contractCampaigns.find(c => c.campaignId === 12);
    const campaign12Db = dbCampaigns.find(c => c.campaign_id === 12);
    
    const campaign13Contract = contractCampaigns.find(c => c.campaignId === 13);
    const campaign13Db = dbCampaigns.find(c => c.campaign_id === 13);
    
    console.log('Campaign 12:');
    if (campaign12Contract) {
      console.log(`  Contract: ${campaign12Contract.active ? 'active' : 'inactive'} (${campaign12Contract.status})`);
    } else {
      console.log('  Contract: NOT FOUND');
    }
    if (campaign12Db) {
      console.log(`  Database: ${campaign12Db.is_active ? 'active' : 'inactive'}`);
    } else {
      console.log('  Database: NOT FOUND');
    }
    
    console.log('Campaign 13:');
    if (campaign13Contract) {
      console.log(`  Contract: ${campaign13Contract.active ? 'active' : 'inactive'} (${campaign13Contract.status})`);
    } else {
      console.log('  Contract: NOT FOUND');
    }
    if (campaign13Db) {
      console.log(`  Database: ${campaign13Db.is_active ? 'active' : 'inactive'}`);
    } else {
      console.log('  Database: NOT FOUND');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllCampaigns();
