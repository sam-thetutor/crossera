const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0xeAa5fF4dd6ee253Aff323831D7af0CA49B28cC9A";
  const userAddress = "0x46992B61b7A1d2e4F59Cd881B74A96a549EF49BF";

  console.log("🔍 Debugging Campaign Creation...\n");

  const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);

  // Check 1: Does user have CAMPAIGN_MANAGER_ROLE?
  console.log("1️⃣ Checking CAMPAIGN_MANAGER_ROLE...");
  const roleHash = ethers.keccak256(ethers.toUtf8Bytes("CAMPAIGN_MANAGER_ROLE"));
  console.log("   Role hash:", roleHash);
  
  try {
    const hasRole = await contract.hasRole(roleHash, userAddress);
    console.log("   User has role:", hasRole ? "✅ YES" : "❌ NO");
    
    if (!hasRole) {
      console.log("   ⚠️  ISSUE: User doesn't have CAMPAIGN_MANAGER_ROLE");
      return;
    }
  } catch (err) {
    console.log("   Error checking role:", err.message);
    return;
  }

  // Check 2: Is contract paused?
  console.log("\n2️⃣ Checking if contract is paused...");
  try {
    const isPaused = await contract.paused();
    console.log("   Contract paused:", isPaused ? "❌ YES (ISSUE)" : "✅ NO");
    
    if (isPaused) {
      console.log("   ⚠️  ISSUE: Contract is paused, cannot create campaigns");
      return;
    }
  } catch (err) {
    console.log("   Error checking paused status:", err.message);
  }

  // Check 3: Decode the transaction data from error
  console.log("\n3️⃣ Decoding transaction parameters...");
  const txData = "0xcdefc1b10000000000000000000000000000000000000000000000000000000068de4e100000000000000000000000000000000000000000000000000000000068f4b718";
  
  try {
    const iface = new ethers.Interface([
      "function createCampaign(uint64 startDate, uint64 endDate) payable returns (uint32)"
    ]);
    
    const decoded = iface.decodeFunctionData("createCampaign", txData);
    const startDate = Number(decoded[0]);
    const endDate = Number(decoded[1]);
    
    console.log("   Start Date:", new Date(startDate * 1000).toLocaleString());
    console.log("   End Date:", new Date(endDate * 1000).toLocaleString());
    console.log("");
    
    const now = Math.floor(Date.now() / 1000);
    console.log("   Current time:", new Date(now * 1000).toLocaleString());
    console.log("");
    
    // Check requirements
    console.log("4️⃣ Validating parameters...");
    console.log("   Start > Now:", startDate > now ? "✅ YES" : "❌ NO (ISSUE)");
    console.log("   End > Start:", endDate > startDate ? "✅ YES" : "❌ NO (ISSUE)");
    console.log("");
    
    if (startDate <= now) {
      console.log("   ⚠️  ISSUE: Start date must be in the future");
    }
    if (endDate <= startDate) {
      console.log("   ⚠️  ISSUE: End date must be after start date");
    }
    
  } catch (err) {
    console.log("   Error decoding:", err.message);
  }

  console.log("\n5️⃣ Checking msg.value (XFI amount)...");
  console.log("   ⚠️  The transaction must include XFI value (msg.value > 0)");
  console.log("   Make sure you set the 'total_pool' amount when creating the campaign");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

