const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing CrossEra Deployment on CrossFi Testnet...\n");

  // Get contract addresses from environment or prompt user
  const CROSSERA_ADDRESS = process.env.CROSSERA_CONTRACT_ADDRESS;
  const XFI_TOKEN_ADDRESS = process.env.XFI_TOKEN_ADDRESS;

  if (!CROSSERA_ADDRESS) {
    console.log("❌ Please set CROSSERA_CONTRACT_ADDRESS environment variable");
    console.log("   export CROSSERA_CONTRACT_ADDRESS=0x...");
    return;
  }

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("🔑 Testing with accounts:");
  console.log("   Deployer:", deployer.address);
  console.log("   User1:", user1.address);
  console.log("   User2:", user2.address, "\n");

  // Get contract instances
  const crossEra = await ethers.getContractAt("CrossEraRewardSystem", CROSSERA_ADDRESS);
  
  let mockToken = null;
  if (XFI_TOKEN_ADDRESS && XFI_TOKEN_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    mockToken = await ethers.getContractAt("MockXFIToken", XFI_TOKEN_ADDRESS);
    console.log("🪙 Using XFI Token at:", XFI_TOKEN_ADDRESS);
  }

  try {
    // Test 1: Check contract state
    console.log("📊 Testing contract state...");
    const totalApps = await crossEra.totalApps();
    const totalCampaigns = await crossEra.totalCampaigns();
    const minReward = await crossEra.minRewardAmount();
    
    console.log("   Total Apps:", totalApps.toString());
    console.log("   Total Campaigns:", totalCampaigns.toString());
    console.log("   Min Reward:", ethers.formatEther(minReward), "XFI");

    // Test 2: Register an app
    console.log("\n📱 Testing app registration...");
    const appId = "testapp" + Date.now();
    
    try {
      const tx = await crossEra.registerApp(
        appId,
        "Test Application",
        "A test application for CrossEra",
        "Testing",
        "https://test.crossera.com"
      );
      await tx.wait();
      console.log("   ✅ App registered successfully!");
      console.log("   App ID:", appId);
      console.log("   Transaction:", tx.hash);
      
      // Verify app registration
      const appOwner = await crossEra.appOwners(appId);
      const isRegistered = await crossEra.registeredApps(appId);
      console.log("   App Owner:", appOwner);
      console.log("   Is Registered:", isRegistered);
      
    } catch (error) {
      console.log("   ❌ App registration failed:", error.message);
    }

    // Test 3: Test with mock token if available
    if (mockToken) {
      console.log("\n💰 Testing mock token functionality...");
      
      try {
        // Use faucet to get tokens
        const faucetTx = await mockToken.connect(user1).faucet();
        await faucetTx.wait();
        
        const user1Balance = await mockToken.balanceOf(user1.address);
        console.log("   ✅ Faucet worked! User1 balance:", ethers.formatEther(user1Balance), "XFI");
        
        // Test token transfer
        const transferTx = await mockToken.connect(user1).transfer(user2.address, ethers.parseEther("10"));
        await transferTx.wait();
        
        const user2Balance = await mockToken.balanceOf(user2.address);
        console.log("   ✅ Transfer worked! User2 balance:", ethers.formatEther(user2Balance), "XFI");
        
      } catch (error) {
        console.log("   ❌ Mock token test failed:", error.message);
      }
    }

    // Test 4: Create a test campaign (as admin)
    console.log("\n🎯 Testing campaign creation...");
    
    try {
      const startDate = Math.floor(Date.now() / 1000) + 3600; // Start in 1 hour
      const endDate = startDate + (30 * 24 * 3600); // End in 30 days
      const poolAmount = ethers.parseEther("100"); // 100 XFI
      
      // First, fund the deployer with tokens if using mock token
      if (mockToken) {
        const deployerBalance = await mockToken.balanceOf(deployer.address);
        console.log("   Deployer token balance:", ethers.formatEther(deployerBalance), "XFI");
        
        if (deployerBalance < poolAmount) {
          console.log("   Minting more tokens to deployer...");
          const mintTx = await mockToken.mint(deployer.address, poolAmount);
          await mintTx.wait();
        }
        
        // Approve contract to spend tokens
        const approveTx = await mockToken.approve(CROSSERA_ADDRESS, poolAmount);
        await approveTx.wait();
        console.log("   ✅ Approved contract to spend tokens");
      }
      
      const campaignTx = await crossEra.createCampaign(
        "Test Campaign",
        "A test campaign for CrossEra testing",
        poolAmount,
        startDate,
        endDate,
        0, // Proportional rewards
        ethers.keccak256(ethers.toUtf8Bytes("test-campaign-rules"))
      );
      
      const receipt = await campaignTx.wait();
      console.log("   ✅ Campaign created successfully!");
      console.log("   Transaction:", campaignTx.hash);
      
      // Get campaign ID from events
      const campaignCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = crossEra.interface.parseLog(log);
          return parsed.name === 'CampaignCreated';
        } catch {
          return false;
        }
      });
      
      if (campaignCreatedEvent) {
        const parsedEvent = crossEra.interface.parseLog(campaignCreatedEvent);
        const campaignId = parsedEvent.args[0];
        console.log("   Campaign ID:", campaignId.toString());
        
        // Verify campaign
        const campaign = await crossEra.getCampaign(campaignId);
        console.log("   Campaign exists:", campaign.exists);
        console.log("   Campaign pool:", ethers.formatEther(campaign.totalPool), "XFI");
      }
      
    } catch (error) {
      console.log("   ❌ Campaign creation failed:", error.message);
    }

    // Test 5: Check events
    console.log("\n📡 Testing event emission...");
    
    try {
      const filter = crossEra.filters.AppRegistered();
      const events = await crossEra.queryFilter(filter, -100); // Last 100 blocks
      console.log("   Found", events.length, "AppRegistered events");
      
      if (events.length > 0) {
        const latestEvent = events[events.length - 1];
        console.log("   Latest app registered:", latestEvent.args[0]); // appId
        console.log("   By developer:", latestEvent.args[1]); // developer
      }
      
    } catch (error) {
      console.log("   ❌ Event query failed:", error.message);
    }

    console.log("\n🎉 Testing completed!");
    console.log("\n📋 Test Summary:");
    console.log("=====================================");
    console.log("Contract Address:", CROSSERA_ADDRESS);
    if (mockToken) {
      console.log("Token Address:", XFI_TOKEN_ADDRESS);
    }
    console.log("Network: CrossFi Testnet");
    console.log("Chain ID: 4157");
    console.log("=====================================");

  } catch (error) {
    console.error("❌ Testing failed with error:");
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test script failed:");
    console.error(error);
    process.exit(1);
  });
