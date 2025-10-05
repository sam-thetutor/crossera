const { ethers } = require('ethers');
require('dotenv').config({ path: '.env' });

async function main() {
  const rpcUrl = "https://rpc.mainnet.ms";
  const verifierAddress = "0x234761e3eE6Fc918432f98B139d9584Be3919064";
  const amountToSend = "0.1"; // Send 0.1 XFI

  console.log("💰 Funding verifier wallet on MAINNET...\n");
  console.log("RPC URL:", rpcUrl);
  console.log("Verifier Address:", verifierAddress);
  console.log("Amount to send:", amountToSend, "XFI");
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
  console.log("Deployer (sending from):", deployerWallet.address);
  console.log("");

  try {
    // Check balances before
    const deployerBalanceBefore = await provider.getBalance(deployerWallet.address);
    const verifierBalanceBefore = await provider.getBalance(verifierAddress);
    
    console.log("📊 Balances BEFORE:");
    console.log("Deployer:", ethers.formatEther(deployerBalanceBefore), "XFI");
    console.log("Verifier:", ethers.formatEther(verifierBalanceBefore), "XFI");
    console.log("");

    // Send XFI to verifier
    console.log("📤 Sending XFI to verifier...");
    const tx = await deployerWallet.sendTransaction({
      to: verifierAddress,
      value: ethers.parseEther(amountToSend)
    });
    
    console.log("Transaction hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
    console.log("");

    // Check balances after
    const deployerBalanceAfter = await provider.getBalance(deployerWallet.address);
    const verifierBalanceAfter = await provider.getBalance(verifierAddress);
    
    console.log("📊 Balances AFTER:");
    console.log("Deployer:", ethers.formatEther(deployerBalanceAfter), "XFI");
    console.log("Verifier:", ethers.formatEther(verifierBalanceAfter), "XFI");
    console.log("");

    console.log("🎉 Successfully funded verifier wallet!");
    console.log("Verifier can now process transactions.");
    
  } catch (error) {
    console.error("❌ Error funding verifier:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
