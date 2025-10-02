const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0x6342e9382A422697D8B4DB77A1c3cc0ACE7327F7";

  console.log("🔐 Creating Verifier Wallet...\n");

  // Generate new wallet
  const verifierWallet = ethers.Wallet.createRandom();
  
  console.log("📝 New Verifier Wallet Created:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Address:", verifierWallet.address);
  console.log("Private Key:", verifierWallet.privateKey);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("⚠️  SAVE THIS PRIVATE KEY SECURELY!");
  console.log("Add to your .env file as:");
  console.log(`VERIFIER_PRIVATE_KEY=${verifierWallet.privateKey}`);
  console.log("");

  // Connect with deployer to grant role
  const [deployer] = await ethers.getSigners();
  console.log("Deployer (granting role):", deployer.address);
  console.log("Contract:", contractAddress);
  console.log("");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);
  
  // Calculate VERIFIER_ROLE hash
  const roleHash = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
  console.log("VERIFIER_ROLE hash:", roleHash);
  console.log("");
  
  // Grant the role
  console.log("📝 Granting VERIFIER_ROLE to new wallet...");
  const tx = await contract.grantRole(roleHash, verifierWallet.address);
  console.log("Transaction hash:", tx.hash);
  
  console.log("⏳ Waiting for confirmation...");
  await tx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("");
  
  // Verify
  const hasRole = await contract.hasRole(roleHash, verifierWallet.address);
  console.log("Verification - Wallet has VERIFIER_ROLE:", hasRole ? "✅ YES" : "❌ NO");
  
  if (hasRole) {
    console.log("\n🎉 Successfully created and configured verifier wallet!");
    console.log("\n📋 Next Steps:");
    console.log("1. Add the private key to your .env file");
    console.log("2. Update your API routes to use this wallet for processTransaction calls");
    console.log("3. Keep the private key secure and never commit it to git");
  } else {
    console.log("\n❌ Failed to grant role");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

