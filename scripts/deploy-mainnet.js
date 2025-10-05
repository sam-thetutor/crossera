const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying CrossEra Reward System to CrossFi MAINNET...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "XFI\n");

  // Check minimum balance for deployment
  const minBalance = ethers.parseEther("0.1"); // 0.1 XFI minimum
  if (balance < minBalance) {
    throw new Error(`❌ Insufficient balance. Need at least 0.1 XFI for deployment. Current: ${ethers.formatEther(balance)} XFI`);
  }

  console.log("ℹ️  Contract uses native XFI for rewards (no token contract needed)\n");

  // Get current gas price
  let gasPrice;
  try {
    gasPrice = await ethers.provider.getGasPrice();
    console.log("⛽ Current gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  } catch (error) {
    console.log("⛽ Using network-required gas price");
    gasPrice = ethers.parseUnits("1505", "gwei"); // High gas price as required by CrossFi mainnet
  }

  // Deploy CrossEra Reward System
  console.log("📦 Deploying CrossEra Reward System...");
  const CrossEraRewardSystem = await ethers.getContractFactory("CrossEraRewardSystem");
  
  // Estimate gas for deployment
  const deploymentTx = await CrossEraRewardSystem.getDeployTransaction(
    deployer.address     // Admin address
  );
  
  const estimatedGas = await ethers.provider.estimateGas(deploymentTx);
  console.log("⛽ Estimated gas:", estimatedGas.toString());
  
  const estimatedCost = gasPrice * estimatedGas;
  console.log("💰 Estimated deployment cost:", ethers.formatEther(estimatedCost), "XFI");

  // Deploy with gas limit
  const crossEra = await CrossEraRewardSystem.deploy(
    deployer.address,     // Admin address
    {
      gasLimit: estimatedGas + 100000n, // Add buffer
      gasPrice: gasPrice
    }
  );
  
  console.log("⏳ Waiting for deployment confirmation...");
  await crossEra.waitForDeployment();
  const crossEraAddress = await crossEra.getAddress();
  
  console.log("✅ CrossEra Reward System deployed to:", crossEraAddress);
  
  // Wait for a few confirmations
  console.log("⏳ Waiting for transaction confirmations...");
  await crossEra.deploymentTransaction().wait(3);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalApps = await crossEra.totalApps();
  const totalCampaigns = await crossEra.totalCampaigns();
  const minRewardAmount = await crossEra.minRewardAmount();
  const adminRole = await crossEra.DEFAULT_ADMIN_ROLE();
  const hasAdminRole = await crossEra.hasRole(adminRole, deployer.address);
  
  console.log("   ✅ Total Apps:", totalApps.toString());
  console.log("   ✅ Total Campaigns:", totalCampaigns.toString());
  console.log("   ✅ Min Reward Amount:", ethers.formatEther(minRewardAmount), "XFI");
  console.log("   ✅ Admin role assigned:", hasAdminRole);
  
  // Grant additional roles if needed
  console.log("\n🔐 Verifying roles...");
  const VERIFIER_ROLE = await crossEra.VERIFIER_ROLE();
  const CAMPAIGN_MANAGER_ROLE = await crossEra.CAMPAIGN_MANAGER_ROLE();
  const ADMIN_ROLE = await crossEra.ADMIN_ROLE();
  
  const hasVerifierRole = await crossEra.hasRole(VERIFIER_ROLE, deployer.address);
  const hasCampaignManagerRole = await crossEra.hasRole(CAMPAIGN_MANAGER_ROLE, deployer.address);
  const hasAdminRoleCheck = await crossEra.hasRole(ADMIN_ROLE, deployer.address);
  
  console.log("   ✅ VERIFIER_ROLE:", hasVerifierRole);
  console.log("   ✅ CAMPAIGN_MANAGER_ROLE:", hasCampaignManagerRole);
  console.log("   ✅ ADMIN_ROLE:", hasAdminRoleCheck);

  // Get deployment transaction details
  const deploymentTxHash = crossEra.deploymentTransaction().hash;
  const deploymentBlock = crossEra.deploymentTransaction().blockNumber;
  
  // Save deployment info
  const deploymentInfo = {
    network: "crossfi_mainnet",
    chainId: 4158,
    contracts: {
      CrossEraRewardSystem: {
        address: crossEraAddress,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        deploymentTxHash: deploymentTxHash,
        deploymentBlock: deploymentBlock,
        rewardToken: "NATIVE_XFI",
        minRewardAmount: ethers.formatEther(minRewardAmount),
        gasUsed: estimatedGas.toString(),
        gasPrice: ethers.formatUnits(gasPrice, "gwei") + " gwei"
      }
    },
    roles: {
      ADMIN_ROLE: ADMIN_ROLE,
      VERIFIER_ROLE: VERIFIER_ROLE,
      CAMPAIGN_MANAGER_ROLE: CAMPAIGN_MANAGER_ROLE,
      DEFAULT_ADMIN_ROLE: adminRole
    },
    explorer: {
      transaction: `https://scan.crossfi.org/tx/${deploymentTxHash}`,
      contract: `https://scan.crossfi.org/address/${crossEraAddress}`
    }
  };

  // Save deployment info to file
  const deploymentFile = path.join(__dirname, '..', 'deployment-mainnet.json');
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📁 Deployment info saved to: ${deploymentFile}`);

  console.log("\n📋 Deployment Summary:");
  console.log("=====================================");
  console.log("Network: CrossFi Mainnet");
  console.log("Chain ID: 4158");
  console.log("CrossEra Contract:", deploymentInfo.contracts.CrossEraRewardSystem.address);
  console.log("Reward Token: Native XFI");
  console.log("Admin:", deploymentInfo.contracts.CrossEraRewardSystem.deployer);
  console.log("Min Reward:", deploymentInfo.contracts.CrossEraRewardSystem.minRewardAmount, "XFI");
  console.log("Gas Used:", deploymentInfo.contracts.CrossEraRewardSystem.gasUsed);
  console.log("Gas Price:", deploymentInfo.contracts.CrossEraRewardSystem.gasPrice);
  console.log("Deployment Tx:", deploymentInfo.explorer.transaction);
  console.log("Contract Explorer:", deploymentInfo.explorer.contract);
  console.log("=====================================");

  console.log("\n🔗 Next Steps:");
  console.log("1. ✅ Contract deployed successfully");
  console.log("2. 🔍 Verify contract on CrossFi Explorer:");
  console.log(`   ${deploymentInfo.explorer.contract}`);
  console.log("3. 💰 Fund the contract with native XFI for campaigns:");
  console.log(`   Send XFI directly to: ${crossEraAddress}`);
  console.log("4. 🔐 Set up verifier service with VERIFIER_ROLE");
  console.log("5. 📊 Create first campaign using createCampaign() with native XFI");
  console.log("6. 🌐 Update frontend configuration with contract address");
  console.log("7. 📝 Update .env file with new contract address");
  
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

  console.log("\n🎉 MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("⚠️  IMPORTANT: This is a LIVE MAINNET deployment!");
  console.log("⚠️  Please verify all settings before proceeding with operations.");
  
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
