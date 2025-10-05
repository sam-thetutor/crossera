const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking CrossFi Mainnet Deployment Setup...\n");

  try {
    // Check if we can connect to mainnet
    console.log("1. 🌐 Testing CrossFi Mainnet Connection...");
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    console.log("   ✅ Connected to network:", network.name);
    console.log("   ✅ Chain ID:", network.chainId.toString());
    console.log("   ✅ Expected Chain ID: 4158");
    
    if (network.chainId !== 4158n) {
      throw new Error(`❌ Wrong network! Expected 4158, got ${network.chainId}`);
    }

    // Check deployer account
    console.log("\n2. 👤 Checking Deployer Account...");
    const [deployer] = await ethers.getSigners();
    console.log("   ✅ Deployer address:", deployer.address);
    
    // Check balance
    const balance = await provider.getBalance(deployer.address);
    const balanceInXFI = ethers.formatEther(balance);
    console.log("   ✅ Account balance:", balanceInXFI, "XFI");
    
    // Check if balance is sufficient
    const minBalance = ethers.parseEther("0.1");
    if (balance < minBalance) {
      console.log("   ⚠️  WARNING: Balance might be too low for deployment");
      console.log("   ⚠️  Recommended: At least 0.1 XFI for gas fees");
    } else {
      console.log("   ✅ Balance sufficient for deployment");
    }

    // Check gas price
    console.log("\n3. ⛽ Checking Gas Configuration...");
    const gasPrice = await provider.getGasPrice();
    const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");
    console.log("   ✅ Current gas price:", gasPriceGwei, "gwei");
    
    // Estimate deployment gas
    console.log("\n4. 📦 Estimating Deployment Gas...");
    const CrossEraRewardSystem = await ethers.getContractFactory("CrossEraRewardSystem");
    const deploymentTx = await CrossEraRewardSystem.getDeployTransaction(deployer.address);
    
    try {
      const estimatedGas = await provider.estimateGas(deploymentTx);
      const estimatedCost = gasPrice * estimatedGas;
      const estimatedCostXFI = ethers.formatEther(estimatedCost);
      
      console.log("   ✅ Estimated gas:", estimatedGas.toString());
      console.log("   ✅ Estimated cost:", estimatedCostXFI, "XFI");
      
      if (balance < estimatedCost * 2n) {
        console.log("   ⚠️  WARNING: Balance might not cover gas with buffer");
      } else {
        console.log("   ✅ Balance sufficient for deployment with buffer");
      }
    } catch (error) {
      console.log("   ⚠️  Could not estimate gas:", error.message);
    }

    // Check contract compilation
    console.log("\n5. 🔨 Checking Contract Compilation...");
    try {
      await ethers.getContractFactory("CrossEraRewardSystem");
      console.log("   ✅ CrossEraRewardSystem contract compiled successfully");
    } catch (error) {
      console.log("   ❌ Contract compilation failed:", error.message);
      throw error;
    }

    // Check environment variables
    console.log("\n6. 🔧 Checking Environment Configuration...");
    if (process.env.PRIVATE_KEY) {
      console.log("   ✅ PRIVATE_KEY is set");
    } else {
      console.log("   ❌ PRIVATE_KEY not found in environment");
    }

    console.log("\n📋 Setup Summary:");
    console.log("=====================================");
    console.log("✅ Network: CrossFi Mainnet (4158)");
    console.log("✅ Deployer:", deployer.address);
    console.log("✅ Balance:", balanceInXFI, "XFI");
    console.log("✅ Gas Price:", gasPriceGwei, "gwei");
    console.log("✅ Contract: Compiled successfully");
    console.log("=====================================");

    console.log("\n🎯 Ready for Deployment!");
    console.log("\nNext steps:");
    console.log("1. Run: npx hardhat run scripts/deploy-mainnet.js --network crossfi_mainnet");
    console.log("2. Verify deployment on CrossFi explorer");
    console.log("3. Update frontend configuration");

  } catch (error) {
    console.error("\n❌ Setup Check Failed:");
    console.error(error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Check your .env file has PRIVATE_KEY set");
    console.error("2. Ensure you have sufficient XFI balance");
    console.error("3. Verify CrossFi mainnet RPC is accessible");
    console.error("4. Run 'npx hardhat compile' to check contracts");
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
