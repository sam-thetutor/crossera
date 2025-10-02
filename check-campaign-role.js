const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0x6342e9382A422697D8B4DB77A1c3cc0ACE7327F7";
  const addressToCheck = process.argv[2] || "0x46992B61b7A1d2e4F59Cd881B74A96a549EF49BF";

  console.log("🔍 Checking CAMPAIGN_MANAGER_ROLE...\n");
  console.log("Contract:", contractAddress);
  console.log("Address to check:", addressToCheck);
  console.log("");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);
  
  // Calculate role hash
  const roleHash = ethers.keccak256(ethers.toUtf8Bytes("CAMPAIGN_MANAGER_ROLE"));
  console.log("CAMPAIGN_MANAGER_ROLE hash:", roleHash);
  console.log("");
  
  // Check if address has the role
  const hasRole = await contract.hasRole(roleHash, addressToCheck);
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (hasRole) {
    console.log("✅ YES - Address HAS CAMPAIGN_MANAGER_ROLE");
    console.log("This address CAN create campaigns");
  } else {
    console.log("❌ NO - Address does NOT have CAMPAIGN_MANAGER_ROLE");
    console.log("This address CANNOT create campaigns");
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

