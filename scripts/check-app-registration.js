const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0x6342e9382A422697D8B4DB77A1c3cc0ACE7327F7";
  const appId = process.argv[2] || "1d5recrfn2oozhdbd6gk";

  console.log("🔍 Checking App Registration On-Chain...\n");
  console.log("Contract:", contractAddress);
  console.log("App ID:", appId);
  console.log("");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);
  
  // Check if app is registered
  const isRegistered = await contract.registeredApps(appId);
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (isRegistered) {
    console.log("✅ App IS registered on-chain");
    
    // Get app owner
    const owner = await contract.appOwners(appId);
    console.log("Owner:", owner);
    
    // Get registered campaigns
    try {
      const campaigns = await contract.getAppRegisteredCampaigns(appId);
      console.log("Registered campaigns:", campaigns.length);
      if (campaigns.length > 0) {
        console.log("Campaign IDs:", campaigns.map(c => c.toString()).join(", "));
      }
    } catch (err) {
      console.log("Could not fetch campaigns");
    }
  } else {
    console.log("❌ App is NOT registered on-chain");
    console.log("\nPossible reasons:");
    console.log("1. Registration transaction failed");
    console.log("2. Registration is still pending");
    console.log("3. Wrong network (mainnet vs testnet)");
    console.log("4. App was only saved to database, not blockchain");
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

