const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0x188c68b28C057BED4e93d7ee15EB807Aa63a7Dd5";
  const userAddress = "0x46992B61b7A1d2e4F59Cd881B74A96a549EF49BF";

  console.log("🔐 Granting CAMPAIGN_MANAGER_ROLE...\n");
  console.log("Contract:", contractAddress);
  console.log("User:", userAddress);
  console.log("");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);
  
  // Get the role hash
  const CAMPAIGN_MANAGER_ROLE = await contract.CAMPAIGN_MANAGER_ROLE();
  console.log("CAMPAIGN_MANAGER_ROLE:", CAMPAIGN_MANAGER_ROLE);
  
  // Check if user already has the role
  const hasRole = await contract.hasRole(CAMPAIGN_MANAGER_ROLE, userAddress);
  console.log("User has role:", hasRole);
  
  if (hasRole) {
    console.log("\n✅ User already has CAMPAIGN_MANAGER_ROLE");
    return;
  }
  
  // Grant the role
  console.log("\n📝 Granting role...");
  const tx = await contract.grantRole(CAMPAIGN_MANAGER_ROLE, userAddress);
  console.log("Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Role granted successfully!");
  
  // Verify
  const hasRoleNow = await contract.hasRole(CAMPAIGN_MANAGER_ROLE, userAddress);
  console.log("\nVerification - User has role:", hasRoleNow);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

