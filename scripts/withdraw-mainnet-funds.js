const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Withdrawing all funds from mainnet contract...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "XFI\n");

  // Contract address from deployment-mainnet.json
  const CONTRACT_ADDRESS = "0x73062e6e527a517c2b53b93C7BF02E308270AEF0";
  
  // Get contract instance
  const contract = await ethers.getContractAt("CrossEraRewardSystem", CONTRACT_ADDRESS);
  
  // Check contract balance
  const contractBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  console.log("📋 Contract Address:", CONTRACT_ADDRESS);
  console.log("💰 Contract Balance:", ethers.formatEther(contractBalance), "XFI");
  
  if (contractBalance === 0n) {
    console.log("⚠️  Contract has no funds to withdraw");
    return;
  }

  // Check if deployer has admin role
  const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";
  const hasAdminRole = await contract.hasRole(ADMIN_ROLE, deployer.address);
  
  if (!hasAdminRole) {
    console.log("❌ Deployer does not have ADMIN_ROLE");
    console.log("🔑 Admin role required for emergency withdrawal");
    return;
  }
  
  console.log("✅ Deployer has ADMIN_ROLE");

  // Get current gas price
  let gasPrice;
  try {
    gasPrice = await ethers.provider.getGasPrice();
    console.log("⛽ Current gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  } catch (error) {
    console.log("⛽ Using network-required gas price");
    gasPrice = ethers.parseUnits("1505", "gwei"); // High gas price as required by CrossFi mainnet
  }

  // Estimate gas for withdrawal
  const withdrawalReason = "Contract upgrade - withdrawing all funds before new deployment";
  const estimatedGas = await contract.emergencyWithdraw.estimateGas(
    contractBalance,
    withdrawalReason,
    {
      gasPrice: gasPrice
    }
  );
  
  console.log("⛽ Estimated gas:", estimatedGas.toString());
  
  const estimatedCost = gasPrice * estimatedGas;
  console.log("💰 Estimated withdrawal cost:", ethers.formatEther(estimatedCost), "XFI");

  // Execute withdrawal
  console.log("\n🚀 Executing emergency withdrawal...");
  
  const tx = await contract.emergencyWithdraw(
    contractBalance,
    withdrawalReason,
    {
      gasLimit: estimatedGas + 50000n, // Add buffer
      gasPrice: gasPrice
    }
  );
  
  console.log("⏳ Transaction hash:", tx.hash);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Withdrawal confirmed!");
  console.log("📊 Gas used:", receipt.gasUsed.toString());
  
  // Verify withdrawal
  const newContractBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  const newDeployerBalance = await ethers.provider.getBalance(deployer.address);
  
  console.log("\n📋 Withdrawal Summary:");
  console.log("=====================================");
  console.log("Contract Address:", CONTRACT_ADDRESS);
  console.log("Amount Withdrawn:", ethers.formatEther(contractBalance), "XFI");
  console.log("New Contract Balance:", ethers.formatEther(newContractBalance), "XFI");
  console.log("New Deployer Balance:", ethers.formatEther(newDeployerBalance), "XFI");
  console.log("Transaction Hash:", tx.hash);
  console.log("Explorer:", `https://scan.crossfi.org/tx/${tx.hash}`);
  console.log("=====================================");
  
  if (newContractBalance === 0n) {
    console.log("\n🎉 SUCCESS: All funds withdrawn from contract!");
    console.log("✅ Ready to deploy new contract version");
  } else {
    console.log("\n⚠️  WARNING: Contract still has balance:", ethers.formatEther(newContractBalance), "XFI");
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Withdrawal failed:");
    console.error(error);
    process.exit(1);
  });
