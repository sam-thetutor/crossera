const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🔍 Getting Deployer Address from Private Key...\n");

  // Check if private key is provided
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ Error: PRIVATE_KEY not found in environment variables");
    console.log("\nTo use this script:");
    console.log("1. Create a .env file in the project root");
    console.log("2. Add: PRIVATE_KEY=your_private_key_without_0x_prefix");
    console.log("3. Run: node scripts/get-deployer-address.js");
    process.exit(1);
  }

  try {
    // Remove 0x prefix if present
    let privateKey = process.env.PRIVATE_KEY;
    if (privateKey.startsWith('0x')) {
      privateKey = privateKey.substring(2);
    }

    // Create wallet from private key
    const wallet = new ethers.Wallet(`0x${privateKey}`);
    
    console.log("✅ Deployer Address:", wallet.address);
    console.log("✅ Private Key (masked):", `${privateKey.substring(0, 6)}...${privateKey.substring(privateKey.length - 4)}`);
    
    console.log("\n📋 CrossFi Mainnet Details:");
    console.log("=====================================");
    console.log("🌐 Network: CrossFi Mainnet");
    console.log("🔗 RPC URL: https://rpc.crossfi.org");
    console.log("🆔 Chain ID: 4158");
    console.log("💰 Token: XFI (Native)");
    console.log("🔍 Explorer: https://scan.crossfi.org");
    console.log("=====================================");
    
    console.log("\n💡 Next Steps:");
    console.log("1. Send XFI tokens to:", wallet.address);
    console.log("2. Recommended amount: 0.5-1.0 XFI (for gas + initial funding)");
    console.log("3. Verify balance on CrossFi Explorer:");
    console.log(`   https://scan.crossfi.org/address/${wallet.address}`);
    
    console.log("\n🚀 Ready for Deployment!");
    console.log("After funding, run:");
    console.log("npx hardhat run scripts/deploy-mainnet.js --network crossfi_mainnet");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\nTroubleshooting:");
    console.log("1. Check your private key format (64 hex characters)");
    console.log("2. Ensure no extra spaces or characters");
    console.log("3. Private key should be without 0x prefix");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
