const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0x188c68b28C057BED4e93d7ee15EB807Aa63a7Dd5";
  const appId = "test-defi-app"; // The app being registered
  const campaignId = 2; // Campaign ID
  const userAddress = "0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7";

  console.log("🔍 Debugging Campaign Registration...\n");
  console.log("App ID:", appId);
  console.log("Campaign ID:", campaignId);
  console.log("User Address:", userAddress);
  console.log("");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);

  // Check 1: Is app registered on-chain?
  console.log("1️⃣ Checking if app is registered on-chain...");
  const isAppRegistered = await contract.registeredApps(appId);
  console.log("   App registered:", isAppRegistered ? "✅ YES" : "❌ NO");
  
  if (!isAppRegistered) {
    console.log("   ⚠️  ISSUE: App must be registered on-chain first");
    return;
  }

  // Check 2: Does user own the app?
  console.log("\n2️⃣ Checking app ownership...");
  const appOwner = await contract.appOwners(appId);
  console.log("   App owner:", appOwner);
  console.log("   User address:", userAddress);
  console.log("   User owns app:", appOwner.toLowerCase() === userAddress.toLowerCase() ? "✅ YES" : "❌ NO");
  
  if (appOwner.toLowerCase() !== userAddress.toLowerCase()) {
    console.log("   ⚠️  ISSUE: User doesn't own this app");
    return;
  }

  // Check 3: Does campaign exist and is it active?
  console.log("\n3️⃣ Checking campaign status...");
  try {
    const campaignData = await contract.getCampaign(campaignId);
    console.log("   Campaign exists: ✅ YES");
    console.log("   Total Pool:", ethers.formatEther(campaignData.totalPool), "XFI");
    console.log("   Start Date:", new Date(Number(campaignData.startDate) * 1000).toLocaleString());
    console.log("   End Date:", new Date(Number(campaignData.endDate) * 1000).toLocaleString());
    console.log("   Active:", campaignData.active ? "✅ YES" : "❌ NO");
    
    if (!campaignData.active) {
      console.log("   ⚠️  ISSUE: Campaign is not active");
      return;
    }

    // Check 4: Is current time within campaign dates?
    const now = Math.floor(Date.now() / 1000);
    const start = Number(campaignData.startDate);
    const end = Number(campaignData.endDate);
    
    console.log("\n4️⃣ Checking campaign timeline...");
    console.log("   Current time:", new Date(now * 1000).toLocaleString());
    console.log("   Campaign started:", now >= start ? "✅ YES" : "❌ NO (starts in future)");
    console.log("   Campaign not ended:", now <= end ? "✅ YES" : "❌ NO (already ended)");
    
    if (now < start) {
      console.log("   ⚠️  ISSUE: Campaign hasn't started yet");
      return;
    }
    if (now > end) {
      console.log("   ⚠️  ISSUE: Campaign has already ended");
      return;
    }

    console.log("\n✅ All checks passed! Registration should work.");
    console.log("\nℹ️  If still failing, try calling the contract function manually:");
    console.log(`await contract.registerAppForCampaign("${appId}", ${campaignId}, "0x0000000000000000000000000000000000000000000000000000000000000000");`);

  } catch (err) {
    console.log("   Campaign error:", err.message);
    if (err.message.includes('totalPool')) {
      console.log("   ⚠️  ISSUE: Campaign doesn't exist or has no pool");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

