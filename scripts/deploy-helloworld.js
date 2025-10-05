const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying HelloWorld to CrossFi Mainnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "XFI\n");

  // Deploy HelloWorld
  console.log("📦 Deploying HelloWorld contract...");
  const HelloWorld = await ethers.getContractFactory("HelloWorld");
  const helloWorld = await HelloWorld.deploy();
  
  await helloWorld.waitForDeployment();
  const helloWorldAddress = await helloWorld.getAddress();
  
  console.log("✅ HelloWorld deployed to:", helloWorldAddress);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalInteractions = await helloWorld.totalInteractions();
  console.log("   Total Interactions:", totalInteractions.toString());
  
  console.log("\n📋 Deployment Summary:");
  console.log("=====================================");
  console.log("Network: crossfi_mainnet");
  console.log("Chain ID: 4158");
  console.log("HelloWorld Contract:", helloWorldAddress);
  console.log("Deployer:", deployer.address);
  console.log("=====================================");

  console.log("\n💡 Frontend Configuration:");
  console.log(`Add to .env.local:`);
  console.log(`NEXT_PUBLIC_HELLOWORLD_ADDRESS=${helloWorldAddress}`);

  console.log("\n🔗 Usage Example:");
  console.log(`// Send transaction with app_id in data field`);
  console.log(`const appIdHex = ethers.hexlify(ethers.toUtf8Bytes("my-app-id"));`);
  console.log(`await signer.sendTransaction({`);
  console.log(`  to: "${helloWorldAddress}",`);
  console.log(`  value: ethers.parseEther("0.01"),`);
  console.log(`  data: appIdHex  // Raw app_id hex`);
  console.log(`});`);

  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

