const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0x6342e9382A422697D8B4DB77A1c3cc0ACE7327F7";
  const campaignId = process.argv[2] || "1";

  console.log("🏆 Checking Leaderboard Data for Campaign...\n");
  console.log("Contract:", contractAddress);
  console.log("Campaign ID:", campaignId);
  console.log("");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);
  
  try {
    // Get campaign details
    const campaign = await contract.campaigns(campaignId);
    
    console.log("📋 Campaign Overview:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Total Pool:", ethers.formatEther(campaign.totalPool), "XFI");
    console.log("Distributed:", ethers.formatEther(campaign.distributedRewards), "XFI");
    console.log("Active:", campaign.active ? "✅ YES" : "❌ NO");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    
    // Get campaign-wide totals
    const totals = await contract.getCampaignTotals(campaignId);
    
    console.log("📊 Campaign-Wide Metrics:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Total Fees:", ethers.formatEther(totals.totalFees), "XFI");
    console.log("Total Volume:", ethers.formatEther(totals.totalVolume), "XFI");
    console.log("Total Transactions:", totals.txCount.toString());
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    
    // Get registered apps
    const registeredApps = await contract.getCampaignApps(campaignId);
    const appCount = await contract.getCampaignAppCount(campaignId);
    
    console.log("📱 Registered Apps:", appCount.toString());
    
    if (registeredApps.length === 0) {
      console.log("\n❌ No apps registered for this campaign yet");
      console.log("\n💡 To populate leaderboard:");
      console.log("1. Register an app for this campaign");
      console.log("2. Send test transactions with that app_id");
      console.log("3. Submit transactions for rewards via /api/submit");
      return;
    }
    
    console.log("");
    console.log("🏆 LEADERBOARD:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Fetch metrics for each app and build leaderboard
    const leaderboardData = [];
    
    for (let i = 0; i < registeredApps.length; i++) {
      const appId = registeredApps[i];
      const metrics = await contract.getAppCampaignMetrics(appId, campaignId);
      
      leaderboardData.push({
        rank: i + 1,
        appId,
        totalFees: metrics.totalFees,
        totalVolume: metrics.totalVolume,
        txCount: metrics.txCount,
        estimatedReward: metrics.estimatedReward
      });
    }
    
    // Sort by estimated reward (descending)
    leaderboardData.sort((a, b) => {
      if (b.estimatedReward > a.estimatedReward) return 1;
      if (b.estimatedReward < a.estimatedReward) return -1;
      return 0;
    });
    
    // Update ranks after sorting
    leaderboardData.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    // Display leaderboard
    console.log("");
    leaderboardData.forEach(app => {
      console.log(`#${app.rank} - ${app.appId}`);
      console.log(`   💰 Est. Reward: ${ethers.formatEther(app.estimatedReward)} XFI`);
      console.log(`   ⛽ Fees: ${ethers.formatEther(app.totalFees)} XFI`);
      console.log(`   📊 Volume: ${ethers.formatEther(app.totalVolume)} XFI`);
      console.log(`   📝 Transactions: ${app.txCount.toString()}`);
      console.log("");
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Calculate percentages
    if (totals.totalFees > 0n || totals.totalVolume > 0n) {
      console.log("\n📈 Market Share:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      leaderboardData.forEach(app => {
        let feeShare = 0;
        let volumeShare = 0;
        
        if (totals.totalFees > 0n) {
          feeShare = Number(app.totalFees * 10000n / totals.totalFees) / 100;
        }
        if (totals.totalVolume > 0n) {
          volumeShare = Number(app.totalVolume * 10000n / totals.totalVolume) / 100;
        }
        
        console.log(`${app.appId}:`);
        console.log(`   Fee Share: ${feeShare.toFixed(2)}%`);
        console.log(`   Volume Share: ${volumeShare.toFixed(2)}%`);
        console.log("");
      });
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
    
    // Summary
    console.log("\n✅ Summary:");
    console.log(`   ${registeredApps.length} app(s) registered`);
    console.log(`   ${totals.txCount.toString()} transaction(s) processed`);
    console.log(`   ${ethers.formatEther(totals.totalFees)} XFI in fees generated`);
    console.log(`   ${ethers.formatEther(campaign.totalPool)} XFI available as rewards`);
    
  } catch (error) {
    console.error("Error checking leaderboard:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

