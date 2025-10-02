const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0x6342e9382A422697D8B4DB77A1c3cc0ACE7327F7";
  const verifierAddress = "0x234761e3eE6Fc918432f98B139d9584Be3919064";

  console.log("🔍 Checking VERIFIER_ROLE...\n");
  console.log("Contract:", contractAddress);
  console.log("Verifier Address:", verifierAddress);
  console.log("");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);
  
  // Calculate role hash
  const roleHash = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
  console.log("VERIFIER_ROLE hash:", roleHash);
  console.log("");
  
  // Check if address has the role
  const hasRole = await contract.hasRole(roleHash, verifierAddress);
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (hasRole) {
    console.log("✅ YES - Verifier HAS VERIFIER_ROLE");
    console.log("This address CAN process transactions");
  } else {
    console.log("❌ NO - Verifier does NOT have VERIFIER_ROLE");
    console.log("This address CANNOT process transactions");
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

