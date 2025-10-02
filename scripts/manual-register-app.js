const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0x6342e9382A422697D8B4DB77A1c3cc0ACE7327F7";
  const appId = process.argv[2];

  if (!appId) {
    console.error("❌ Error: Please provide app ID as argument");
    console.log("Usage: npx hardhat run manual-register-app.js --network crossfi_testnet <APP_ID>");
    process.exit(1);
  }

  console.log("📝 Manually Registering App On-Chain...\n");
  console.log("Contract:", contractAddress);
  console.log("App ID:", appId);
  console.log("");

  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);
  console.log("");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);
  
  // Check if already registered
  const isRegistered = await contract.registeredApps(appId);
  if (isRegistered) {
    console.log("⚠️  App is already registered on-chain!");
    const owner = await contract.appOwners(appId);
    console.log("Owner:", owner);
    return;
  }

  // Register the app
  console.log("🔄 Sending registration transaction...");
  const tx = await contract.registerApp(appId);
  console.log("Transaction hash:", tx.hash);
  
  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("Block number:", receipt.blockNumber);
  console.log("");

  // Verify registration
  const nowRegistered = await contract.registeredApps(appId);
  const owner = await contract.appOwners(appId);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (nowRegistered) {
    console.log("✅ SUCCESS - App registered on-chain!");
    console.log("App ID:", appId);
    console.log("Owner:", owner);
    console.log("Transaction:", `https://scan.testnet.crossfi.org/tx/${tx.hash}`);
  } else {
    console.log("❌ FAILED - App not registered");
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

