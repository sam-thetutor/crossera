const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

const RPC_URL = 'https://rpc.mainnet.ms';
const CONTRACT_ADDRESS = '0x73062e6e527a517c2b53b93C7BF02E308270AEF0';
const CAMPAIGN_ID = 8;
const APP_ID = '7sly71i9xl0lrni0qt3l';
const USER_ADDRESS = '0x7818CEd1298849B47a9B56066b5adc72CDDAf733';

// Contract ABI (minimal for debugging)
const CONTRACT_ABI = [
  "function getCampaign(uint32 campaignId) external view returns (tuple(bool active, uint256 totalPool, uint256 distributedRewards, uint256 startDate, uint256 endDate))",
  "function getAppCampaignMetrics(string memory appId, uint32 campaignId) external view returns (tuple(uint256 totalFees, uint256 totalVolume, uint256 txCount, uint256 estimatedReward))",
  "function getCampaignTotals(uint32 campaignId) external view returns (tuple(uint256 totalFees, uint256 totalVolume, uint256 txCount))",
  "function getClaimableRewards(string memory appId, uint32 campaignId) external view returns (uint256)",
  "function getCampaignApps(uint32 campaignId) external view returns (string[] memory)",
  "function balanceOf(address account) external view returns (uint256)"
];

async function debugClaimIssue() {
  console.log('🔍 Debugging Claim Issue...\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  try {
    // 1. Check campaign details
    console.log('1️⃣ Campaign Details:');
    const campaign = await contract.getCampaign(CAMPAIGN_ID);
    console.log(`   Active: ${campaign.active}`);
    console.log(`   Total Pool: ${ethers.formatEther(campaign.totalPool)} XFI`);
    console.log(`   Distributed: ${ethers.formatEther(campaign.distributedRewards)} XFI`);
    console.log(`   Start Date: ${new Date(Number(campaign.startDate) * 1000).toISOString()}`);
    console.log(`   End Date: ${new Date(Number(campaign.endDate) * 1000).toISOString()}`);
    console.log(`   Current Time: ${new Date().toISOString()}`);
    console.log(`   Campaign Ended: ${Date.now() / 1000 > Number(campaign.endDate)}`);

    // 2. Check contract balance
    console.log('\n2️⃣ Contract Balance:');
    const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
    console.log(`   Contract XFI Balance: ${ethers.formatEther(contractBalance)} XFI`);

    // 3. Check app metrics
    console.log('\n3️⃣ App Metrics:');
    const metrics = await contract.getAppCampaignMetrics(APP_ID, CAMPAIGN_ID);
    console.log(`   Total Fees: ${ethers.formatEther(metrics.totalFees)} XFI`);
    console.log(`   Total Volume: ${ethers.formatEther(metrics.totalVolume)} XFI`);
    console.log(`   Transaction Count: ${metrics.txCount}`);
    console.log(`   Estimated Reward: ${ethers.formatEther(metrics.estimatedReward)} XFI`);

    // 4. Check campaign totals
    console.log('\n4️⃣ Campaign Totals:');
    const totals = await contract.getCampaignTotals(CAMPAIGN_ID);
    console.log(`   Total Fees: ${ethers.formatEther(totals.totalFees)} XFI`);
    console.log(`   Total Volume: ${ethers.formatEther(totals.totalVolume)} XFI`);
    console.log(`   Total Transactions: ${totals.txCount}`);

    // 5. Check if already claimed
    console.log('\n5️⃣ Claim Status:');
    const claimableReward = await contract.getClaimableRewards(APP_ID, CAMPAIGN_ID);
    console.log(`   Claimable Reward: ${ethers.formatEther(claimableReward)} XFI`);
    console.log(`   Already Claimed: ${claimableReward > 0}`);

    // 6. Check registered apps
    console.log('\n6️⃣ Registered Apps:');
    const registeredApps = await contract.getCampaignApps(CAMPAIGN_ID);
    console.log(`   Registered Apps: ${registeredApps.length}`);
    console.log(`   Apps: ${registeredApps.join(', ')}`);
    console.log(`   Our App Registered: ${registeredApps.includes(APP_ID)}`);

    // 7. Manual reward calculation
    console.log('\n7️⃣ Manual Reward Calculation:');
    if (metrics.totalFees > 0 || metrics.totalVolume > 0) {
      let calculatedReward = BigInt(0);
      
      // 70% of pool distributed based on fees contribution
      if (totals.totalFees > 0 && metrics.totalFees > 0) {
        const feeReward = (campaign.totalPool * BigInt(70) / BigInt(100)) * metrics.totalFees / totals.totalFees;
        console.log(`   Fee-based reward: ${ethers.formatEther(feeReward)} XFI`);
        calculatedReward += feeReward;
      }
      
      // 30% of pool distributed based on volume contribution
      if (totals.totalVolume > 0 && metrics.totalVolume > 0) {
        const volumeReward = (campaign.totalPool * BigInt(30) / BigInt(100)) * metrics.totalVolume / totals.totalVolume;
        console.log(`   Volume-based reward: ${ethers.formatEther(volumeReward)} XFI`);
        calculatedReward += volumeReward;
      }
      
      console.log(`   Total Calculated Reward: ${ethers.formatEther(calculatedReward)} XFI`);
    } else {
      console.log('   No contributions found');
    }

    // 8. Check user balance
    console.log('\n8️⃣ User Balance:');
    const userBalance = await provider.getBalance(USER_ADDRESS);
    console.log(`   User XFI Balance: ${ethers.formatEther(userBalance)} XFI`);

    console.log('\n✅ Debug Complete!');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

debugClaimIssue();

