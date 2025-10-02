const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0x6342e9382A422697D8B4DB77A1c3cc0ACE7327F7";
  const campaignId = process.argv[2] || "1";
  const userAddress = "0x46992B61b7A1d2e4F59Cd881B74A96a549EF49BF";

  console.log("🔍 Checking Campaign Status...\n");
  console.log("Contract:", contractAddress);
  console.log("Campaign ID:", campaignId);
  console.log("User:", userAddress);
  console.log("");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);
  
  try {
    // Get campaign details
    const campaign = await contract.campaigns(campaignId);
    
    console.log("📋 Campaign Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Total Pool:", ethers.formatEther(campaign.totalPool), "XFI");
    console.log("Distributed:", ethers.formatEther(campaign.distributedRewards), "XFI");
    console.log("Start Date:", new Date(Number(campaign.startDate) * 1000).toLocaleString());
    console.log("End Date:", new Date(Number(campaign.endDate) * 1000).toLocaleString());
    console.log("Active:", campaign.active ? "✅ YES" : "❌ NO");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    
    // Check if campaign exists (totalPool > 0)
    if (campaign.totalPool === 0n) {
      console.log("❌ Campaign does NOT exist (totalPool is 0)");
      console.log("This campaign was never created on-chain");
      return;
    }
    
    // Get total campaigns count
    const totalCampaigns = await contract.totalCampaigns();
    console.log("Total campaigns created:", totalCampaigns.toString());
    console.log("");
    
    // Check current time vs campaign dates
    const now = Math.floor(Date.now() / 1000);
    console.log("⏰ Time Check:");
    console.log("Current time:", new Date().toLocaleString());
    if (now < campaign.startDate) {
      console.log("⚠️  Campaign hasn't started yet");
    } else if (now > campaign.endDate) {
      console.log("⚠️  Campaign has already ended");
    } else {
      console.log("✅ Campaign is within valid time range");
    }
    console.log("");
    
    // Check if user can activate (check if they have CAMPAIGN_MANAGER_ROLE)
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes("CAMPAIGN_MANAGER_ROLE"));
    const hasRole = await contract.hasRole(roleHash, userAddress);
    
    console.log("🔐 Permission Check:");
    if (hasRole) {
      console.log("✅ User HAS CAMPAIGN_MANAGER_ROLE - can activate");
    } else {
      console.log("❌ User does NOT have CAMPAIGN_MANAGER_ROLE - CANNOT activate");
      console.log("\nThis is likely the issue!");
    }
    console.log("");
    
    // Try to simulate the activation
    console.log("🧪 Simulation:");
    try {
      await contract.activateCampaign.staticCall(campaignId, { from: userAddress });
      console.log("✅ activateCampaign() would succeed");
    } catch (err) {
      console.log("❌ activateCampaign() would fail");
      console.log("Error:", err.message);
    }
    
  } catch (error) {
    console.error("Error checking campaign:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

