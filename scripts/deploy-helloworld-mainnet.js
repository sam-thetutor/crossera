const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying HelloWorld to CrossFi MAINNET...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "XFI\n");

  // Check minimum balance for deployment
  const minBalance = ethers.parseEther("0.1"); // 0.1 XFI minimum
  if (balance < minBalance) {
    throw new Error(`❌ Insufficient balance. Need at least 0.1 XFI for deployment. Current: ${ethers.formatEther(balance)} XFI`);
  }

  // Get current gas price
  let gasPrice;
  try {
    gasPrice = await ethers.provider.getGasPrice();
    console.log("⛽ Current gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  } catch (error) {
    console.log("⛽ Using network-required gas price");
    gasPrice = ethers.parseUnits("1505", "gwei"); // High gas price as required by CrossFi mainnet
  }

  // Deploy HelloWorld
  console.log("📦 Deploying HelloWorld contract...");
  const HelloWorld = await ethers.getContractFactory("HelloWorld");
  
  // Estimate gas for deployment
  const deploymentTx = await HelloWorld.getDeployTransaction();
  
  const estimatedGas = await ethers.provider.estimateGas(deploymentTx);
  console.log("⛽ Estimated gas:", estimatedGas.toString());
  
  const estimatedCost = gasPrice * estimatedGas;
  console.log("💰 Estimated deployment cost:", ethers.formatEther(estimatedCost), "XFI");

  // Deploy with gas limit
  const helloWorld = await HelloWorld.deploy({
    gasLimit: estimatedGas + 100000n, // Add buffer
    gasPrice: gasPrice
  });
  
  console.log("⏳ Waiting for deployment confirmation...");
  await helloWorld.waitForDeployment();
  const helloWorldAddress = await helloWorld.getAddress();
  
  console.log("✅ HelloWorld deployed to:", helloWorldAddress);
  
  // Wait for a few confirmations
  console.log("⏳ Waiting for transaction confirmations...");
  await helloWorld.deploymentTransaction().wait(3);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalInteractions = await helloWorld.totalInteractions();
  const contractBalance = await helloWorld.getBalance();
  
  console.log("   ✅ Total Interactions:", totalInteractions.toString());
  console.log("   ✅ Contract Balance:", ethers.formatEther(contractBalance), "XFI");

  // Get deployment transaction details
  const deploymentTxHash = helloWorld.deploymentTransaction().hash;
  const deploymentBlock = helloWorld.deploymentTransaction().blockNumber;
  
  // Save deployment info
  const deploymentInfo = {
    network: "crossfi_mainnet",
    chainId: 4158,
    contracts: {
      HelloWorld: {
        address: helloWorldAddress,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        deploymentTxHash: deploymentTxHash,
        deploymentBlock: deploymentBlock,
        gasUsed: estimatedGas.toString(),
        gasPrice: ethers.formatUnits(gasPrice, "gwei") + " gwei"
      }
    },
    explorer: {
      transaction: `https://scan.crossfi.org/tx/${deploymentTxHash}`,
      contract: `https://scan.crossfi.org/address/${helloWorldAddress}`
    }
  };

  // Save deployment info to file
  const deploymentFile = path.join(__dirname, '..', 'deployment-helloworld-mainnet.json');
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📁 Deployment info saved to: ${deploymentFile}`);

  console.log("\n📋 Deployment Summary:");
  console.log("=====================================");
  console.log("Network: CrossFi Mainnet");
  console.log("Chain ID: 4158");
  console.log("HelloWorld Contract:", deploymentInfo.contracts.HelloWorld.address);
  console.log("Deployer:", deploymentInfo.contracts.HelloWorld.deployer);
  console.log("Gas Used:", deploymentInfo.contracts.HelloWorld.gasUsed);
  console.log("Gas Price:", deploymentInfo.contracts.HelloWorld.gasPrice);
  console.log("Deployment Tx:", deploymentInfo.explorer.transaction);
  console.log("Contract Explorer:", deploymentInfo.explorer.contract);
  console.log("=====================================");

  console.log("\n🔗 Next Steps:");
  console.log("1. ✅ Contract deployed successfully");
  console.log("2. 🔍 Verify contract on CrossFi Explorer:");
  console.log(`   ${deploymentInfo.explorer.contract}`);
  console.log("3. 💰 Send test transactions to the contract");
  console.log(`   Contract address: ${helloWorldAddress}`);
  console.log("4. 🌐 Update frontend configuration with contract address");
  console.log("5. 📝 Update .env file with new contract address");
  
  console.log("\n💡 Contract Interaction Examples:");
  console.log(`// Send transaction with app_id in data field
const appIdHex = ethers.hexlify(ethers.toUtf8Bytes("my-app-id"));
await signer.sendTransaction({
  to: "${helloWorldAddress}",
  value: ethers.parseEther("0.01"),
  data: appIdHex  // Raw app_id hex
});`);

  console.log(`\n// Send plain XFI without data
await signer.sendTransaction({
  to: "${helloWorldAddress}",
  value: ethers.parseEther("0.01")
});`);

  console.log("\n🎉 MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("⚠️  IMPORTANT: This is a LIVE MAINNET deployment!");
  console.log("⚠️  Please verify all settings before proceeding with operations.");
  
  return {
    helloWorldAddress,
    deploymentInfo
  };
}

// Handle deployment errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });