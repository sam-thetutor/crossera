const { ethers } = require("ethers");

async function main() {
  console.log("💰 Checking Deployer Balance...\n");

  const deployerAddress = "0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7";
  
  console.log("📍 Deployer Address:", deployerAddress);
  console.log("\n🔍 To check your XFI balance, please:");
  console.log("1. Visit XFI Scan: https://xfiscan.com/");
  console.log("2. Search for your address:", deployerAddress);
  console.log("3. Check the XFI balance displayed");
  
  console.log("\n📋 Alternative RPC URLs to try:");
  console.log("- https://rpc.crossfi.org (primary)");
  console.log("- https://mainnet.crossfi.org (alternative)");
  console.log("- https://rpc-mainnet.crossfi.org (alternative)");
  
  console.log("\n💡 If RPC is not accessible:");
  console.log("1. Check CrossFi official documentation");
  console.log("2. Join CrossFi Discord/Telegram for latest RPC info");
  console.log("3. Use the explorer to verify balance manually");
  
  console.log("\n🎯 For deployment, you need:");
  console.log("- Minimum: 0.1 XFI (for gas fees)");
  console.log("- Recommended: 0.5-1.0 XFI (for gas + funding)");
  
  console.log("\n🚀 Once you confirm balance, run:");
  console.log("npx hardhat run scripts/deploy-mainnet.js --network crossfi_mainnet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
