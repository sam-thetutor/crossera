const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0x6342e9382A422697D8B4DB77A1c3cc0ACE7327F7";
  const userAddress = "0x46992B61b7A1d2e4F59Cd881B74A96a549EF49BF";

  console.log("🔐 Granting CAMPAIGN_MANAGER_ROLE...\n");
  console.log("Contract:", contractAddress);
  console.log("User:", userAddress);
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer (granting from):", deployer.address);
  console.log("");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);
  
  // Calculate role hash
  const roleHash = ethers.keccak256(ethers.toUtf8Bytes("CAMPAIGN_MANAGER_ROLE"));
  console.log("CAMPAIGN_MANAGER_ROLE hash:", roleHash);
  
  // Check current status
  const hasRoleBefore = await contract.hasRole(roleHash, userAddress);
  console.log("User has role before:", hasRoleBefore);
  console.log("");
  
  if (hasRoleBefore) {
    console.log("✅ User already has CAMPAIGN_MANAGER_ROLE");
    return;
  }
  
  // Grant the role
  console.log("📝 Granting role...");
  const tx = await contract.grantRole(roleHash, userAddress);
  console.log("Transaction hash:", tx.hash);
  
  console.log("⏳ Waiting for confirmation...");
  await tx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("");
  
  // Verify
  const hasRoleAfter = await contract.hasRole(roleHash, userAddress);
  console.log("Verification - User has role:", hasRoleAfter ? "✅ YES" : "❌ NO");
  
  if (hasRoleAfter) {
    console.log("\n🎉 Successfully granted CAMPAIGN_MANAGER_ROLE!");
    console.log("User can now create campaigns.");
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

