const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  // Mainnet contract address
  const contractAddress = "0x73062e6e527a517c2b53b93C7BF02E308270AEF0";
  const verifierAddress = "0x234761e3eE6Fc918432f98B139d9584Be3919064";

  console.log("🔐 Granting VERIFIER_ROLE on MAINNET...\n");
  console.log("Contract:", contractAddress);
  console.log("Verifier Address:", verifierAddress);
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer (granting from):", deployer.address);
  console.log("");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);
  
  // Calculate role hash
  const roleHash = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
  console.log("VERIFIER_ROLE hash:", roleHash);
  
  // Check current status
  const hasRoleBefore = await contract.hasRole(roleHash, verifierAddress);
  console.log("Verifier has role before:", hasRoleBefore);
  console.log("");
  
  if (hasRoleBefore) {
    console.log("✅ Verifier already has VERIFIER_ROLE on mainnet");
    return;
  }
  
  // Grant the role
  console.log("📝 Granting VERIFIER_ROLE...");
  const tx = await contract.grantRole(roleHash, verifierAddress);
  console.log("Transaction hash:", tx.hash);
  
  console.log("⏳ Waiting for confirmation...");
  await tx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("");
  
  // Verify
  const hasRoleAfter = await contract.hasRole(roleHash, verifierAddress);
  console.log("Verification - Verifier has role:", hasRoleAfter ? "✅ YES" : "❌ NO");
  
  if (hasRoleAfter) {
    console.log("\n🎉 Successfully granted VERIFIER_ROLE on mainnet!");
    console.log("Verifier can now process transactions on mainnet.");
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
