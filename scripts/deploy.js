const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying CrossEra Reward System to CrossFi Testnet...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "XFI\n");

  console.log("ℹ️  Contract uses native XFI for rewards (no token contract needed)\n");

  // Deploy CrossEra Reward System
  console.log("📦 Deploying CrossEra Reward System...");
  const CrossEraRewardSystem = await ethers.getContractFactory("CrossEraRewardSystem");
  
  const crossEra = await CrossEraRewardSystem.deploy(
    deployer.address     // Admin address
  );
  
  await crossEra.waitForDeployment();
  const crossEraAddress = await crossEra.getAddress();
  
  console.log("✅ CrossEra Reward System deployed to:", crossEraAddress);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalApps = await crossEra.totalApps();
  const totalCampaigns = await crossEra.totalCampaigns();
  const minRewardAmount = await crossEra.minRewardAmount();
  
  console.log("   Total Apps:", totalApps.toString());
  console.log("   Total Campaigns:", totalCampaigns.toString());
  console.log("   Min Reward Amount:", ethers.formatEther(minRewardAmount), "XFI");
  
  // Grant additional roles if needed
  console.log("\n🔐 Setting up roles...");
  const VERIFIER_ROLE = await crossEra.VERIFIER_ROLE();
  const CAMPAIGN_MANAGER_ROLE = await crossEra.CAMPAIGN_MANAGER_ROLE();
  
  console.log("   Admin has all roles by default");
  console.log("   VERIFIER_ROLE:", VERIFIER_ROLE);
  console.log("   CAMPAIGN_MANAGER_ROLE:", CAMPAIGN_MANAGER_ROLE);

  // Save deployment info
  const deploymentInfo = {
    network: "crossfi_testnet",
    chainId: 4157,
    contracts: {
      CrossEraRewardSystem: {
        address: crossEraAddress,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        rewardToken: "NATIVE_XFI",
        minRewardAmount: ethers.formatEther(minRewardAmount)
      }
    },
    roles: {
      ADMIN_ROLE: await crossEra.DEFAULT_ADMIN_ROLE(),
      VERIFIER_ROLE: VERIFIER_ROLE,
      CAMPAIGN_MANAGER_ROLE: CAMPAIGN_MANAGER_ROLE
    },
    gasUsed: "TBD",
    transactionHash: "TBD"
  };

  console.log("\n📋 Deployment Summary:");
  console.log("=====================================");
  console.log("Network:", deploymentInfo.network);
  console.log("Chain ID:", deploymentInfo.chainId);
  console.log("CrossEra Contract:", deploymentInfo.contracts.CrossEraRewardSystem.address);
  console.log("Reward Token: Native XFI");
  console.log("Admin:", deploymentInfo.contracts.CrossEraRewardSystem.deployer);
  console.log("Min Reward:", deploymentInfo.contracts.CrossEraRewardSystem.minRewardAmount, "XFI");
  console.log("=====================================");

  console.log("\n🔗 Next Steps:");
  console.log("1. Verify contract on CrossFi Explorer");
  console.log("2. Fund the contract with native XFI for campaigns:");
  console.log(`   Send XFI directly to: ${crossEraAddress}`);
  console.log("3. Set up verifier service with VERIFIER_ROLE");
  console.log("4. Create first campaign using createCampaign() with native XFI");
  console.log("5. Update frontend configuration with contract address");
  
  console.log("\n💡 Contract Interaction Examples:");
  console.log(`// Register an app (minimal on-chain storage)
await crossEra.registerApp("myapp123");
// Note: All metadata (name, description, etc.) stored in Supabase`);

  console.log(`\n// Create a campaign (as admin) - send native XFI with transaction
await crossEra.createCampaign(
  Math.floor(Date.now() / 1000) + 86400, // Start in 24 hours
  Math.floor(Date.now() / 1000) + 86400 * 30, // End in 30 days
  { value: ethers.parseEther("1000") } // Send 1000 XFI as campaign pool
);`);

  console.log("\n🎉 Deployment completed successfully!");
  
  return {
    crossEraAddress,
    deploymentInfo
  };
}

// Handle deployment errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
