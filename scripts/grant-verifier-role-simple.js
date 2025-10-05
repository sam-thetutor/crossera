const { ethers } = require('ethers');
require('dotenv').config({ path: '.env' });

async function main() {
  // Mainnet contract address
  const contractAddress = "0x73062e6e527a517c2b53b93C7BF02E308270AEF0";
  const verifierAddress = "0x234761e3eE6Fc918432f98B139d9584Be3919064";
  const rpcUrl = "https://rpc.mainnet.ms";

  console.log("🔐 Granting VERIFIER_ROLE on MAINNET...\n");
  console.log("Contract:", contractAddress);
  console.log("Verifier Address:", verifierAddress);
  console.log("RPC URL:", rpcUrl);
  console.log("");

  // Create provider
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Create wallet from deployer private key
  const deployerPrivateKey = process.env.PRIVATE_KEY;
  if (!deployerPrivateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }
  
  const deployerWallet = new ethers.Wallet(deployerPrivateKey, provider);
  console.log("Deployer (granting from):", deployerWallet.address);
  console.log("");

  // Contract ABI (minimal - just what we need)
  const contractABI = [
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
  ];

  const contract = new ethers.Contract(contractAddress, contractABI, deployerWallet);
  
  // Calculate role hash
  const roleHash = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
  console.log("VERIFIER_ROLE hash:", roleHash);
  
  // Check current status
  console.log("🔍 Checking current role status...");
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
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
  console.log("");
  
  // Verify
  console.log("🔍 Verifying role was granted...");
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
