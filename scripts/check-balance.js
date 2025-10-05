const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("💰 Checking Deployer Balance on CrossFi Mainnet...\n");

  const deployerAddress = "0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7";
  
  try {
    // Connect to CrossFi mainnet
    const provider = new ethers.JsonRpcProvider("https://rpc.crossfi.org");
    
    console.log("🌐 Connected to CrossFi Mainnet");
    console.log("📍 Checking balance for:", deployerAddress);
    
    // Get balance
    const balance = await provider.getBalance(deployerAddress);
    const balanceInXFI = ethers.formatEther(balance);
    
    console.log("\n📊 Balance Information:");
    console.log("=====================================");
    console.log("💰 Balance:", balanceInXFI, "XFI");
    console.log("💰 Balance (Wei):", balance.toString());
    console.log("=====================================");
    
    // Check if balance is sufficient for deployment
    const minBalance = ethers.parseEther("0.1");
    const recommendedBalance = ethers.parseEther("0.5");
    
    if (balance < minBalance) {
      console.log("\n⚠️  WARNING: Balance might be too low for deployment");
      console.log("⚠️  Recommended: At least 0.1 XFI for gas fees");
    } else if (balance < recommendedBalance) {
      console.log("\n✅ Balance sufficient for deployment");
      console.log("💡 Recommended: 0.5 XFI total for gas + initial funding");
    } else {
      console.log("\n✅ Balance is excellent for deployment!");
      console.log("✅ Sufficient for gas fees + initial contract funding");
    }
    
    // Check current gas price
    const gasPrice = await provider.getGasPrice();
    const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");
    console.log("\n⛽ Current gas price:", gasPriceGwei, "gwei");
    
    // Estimate deployment cost
    console.log("\n📦 Estimating deployment cost...");
    const estimatedGas = 2000000n; // Rough estimate for contract deployment
    const estimatedCost = gasPrice * estimatedGas;
    const estimatedCostXFI = ethers.formatEther(estimatedCost);
    
    console.log("💰 Estimated deployment cost:", estimatedCostXFI, "XFI");
    
    if (balance > estimatedCost * 2n) {
      console.log("✅ Balance sufficient for deployment with buffer");
    } else {
      console.log("⚠️  Balance might not cover deployment with buffer");
    }
    
    console.log("\n🎯 Deployment Status:");
    if (balance >= minBalance) {
      console.log("✅ READY FOR DEPLOYMENT!");
      console.log("🚀 Run: npx hardhat run scripts/deploy-mainnet.js --network crossfi_mainnet");
    } else {
      console.log("❌ Need more XFI for deployment");
      console.log("💳 Send XFI to:", deployerAddress);
    }

  } catch (error) {
    console.error("❌ Error checking balance:", error.message);
    
    if (error.message.includes("network")) {
      console.log("\n🔧 Troubleshooting:");
      console.log("1. Check CrossFi mainnet RPC is accessible");
      console.log("2. Verify network connection");
      console.log("3. Try again in a few moments");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
