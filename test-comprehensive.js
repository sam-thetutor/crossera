const { ethers } = require("ethers");

async function comprehensiveWorkflowTest() {
  console.log("🚀 Starting Comprehensive CrossEra Workflow Test...\n");

  // Setup
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.ms/");
  const CROSSERA_ADDRESS = "0xaA2d1c8cF2B51d30F85C2FF3d146A002F03A8279";
  const MOCK_TOKEN_ADDRESS = "0x51a7F75Af71808D34A7D18FD2fC36BEea7b47Be8";
  const PRIVATE_KEY = "d0e9117cf353f4895f7a0280b5dab7fd88c19202c43e03be8aefca0c89f7c9d5";
  
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Extended ABIs for comprehensive testing
  const crossEraABI = [
    "function totalApps() view returns (uint32)",
    "function totalCampaigns() view returns (uint32)",
    "function totalDevelopers() view returns (uint32)",
    "function minRewardAmount() view returns (uint256)",
    "function registerApp(string appId, string appName, string description, string category, string websiteUrl)",
    "function updateApp(string appId, string newName, string newDescription, string newCategory, string newWebsiteUrl)",
    "function changeAppStatus(string appId, uint8 status, string reason)",
    "function appOwners(string appId) view returns (address)",
    "function registeredApps(string appId) view returns (bool)",
    "function createCampaign(string name, string description, uint256 totalPool, uint64 startDate, uint64 endDate, uint8 rewardType, bytes32 rulesHash) returns (uint32)",
    "function activateCampaign(uint32 campaignId)",
    "function getCampaign(uint32 campaignId) view returns (tuple(bool exists, bool active, uint64 startDate, uint64 endDate, uint256 totalPool, uint256 distributedRewards, uint8 status))",
    "function registerAppForCampaign(string appId, uint32 campaignId, uint256 registrationFee, bytes32 registrationData)",
    "function processTransaction(string appId, uint32 campaignId, bytes32 txHash, uint256 gasUsed, uint256 gasPrice, uint256 transactionValue, uint8 transactionType, bytes32 additionalData)",
    "function getClaimableRewards(string appId, uint32 campaignId) view returns (uint256)",
    "function claimRewards(string appId, uint32 campaignId) returns (uint256)",
    "function setMinRewardAmount(uint256 _minRewardAmount)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function ADMIN_ROLE() view returns (bytes32)",
    "function VERIFIER_ROLE() view returns (bytes32)",
    "function CAMPAIGN_MANAGER_ROLE() view returns (bytes32)",
    "event AppRegistered(string indexed appId, address indexed developer, string appName, string description, string category, string websiteUrl, bytes32 metadataHash, uint256 timestamp)",
    "event AppUpdated(string indexed appId, address indexed developer, string newName, string newDescription, string newCategory, string newWebsiteUrl, uint256 timestamp)",
    "event AppStatusChanged(string indexed appId, address indexed developer, uint8 status, string reason, uint256 timestamp)",
    "event CampaignCreated(uint32 indexed campaignId, address indexed creator, string name, string description, uint256 totalPool, uint64 startDate, uint64 endDate, uint8 rewardType, bytes32 rulesHash, uint256 timestamp)",
    "event CampaignStatusChanged(uint32 indexed campaignId, uint8 indexed newStatus, uint8 oldStatus, address changedBy, uint256 timestamp)",
    "event AppRegisteredForCampaign(string indexed appId, uint32 indexed campaignId, address indexed developer, uint256 registrationFee, bytes32 registrationData, uint256 timestamp)",
    "event TransactionProcessed(string indexed appId, uint32 indexed campaignId, bytes32 indexed txHash, address developer, uint256 gasUsed, uint256 gasPrice, uint256 transactionValue, uint256 feeGenerated, uint256 rewardCalculated, uint8 transactionType, bytes32 additionalData, uint256 timestamp)",
    "event RewardClaimed(string indexed appId, uint32 indexed campaignId, address indexed developer, uint256 amount, uint256 totalClaimedToDate, bytes32 claimTxHash, uint256 timestamp)"
  ];
  
  const tokenABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function mint(address to, uint256 amount)",
    "function faucet()"
  ];

  const crossEra = new ethers.Contract(CROSSERA_ADDRESS, crossEraABI, wallet);
  const mockToken = new ethers.Contract(MOCK_TOKEN_ADDRESS, tokenABI, wallet);

  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(testName, passed, details = "") {
    const status = passed ? "✅" : "❌";
    console.log(`   ${status} ${testName}${details ? ": " + details : ""}`);
    testResults.tests.push({ name: testName, passed, details });
    if (passed) testResults.passed++;
    else testResults.failed++;
  }

  try {
    console.log("🔑 Wallet:", wallet.address);
    console.log("💰 Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "XFI\n");

    // Test Suite 1: App Management
    console.log("📱 Test Suite 1: App Management");
    console.log("================================");
    
    const appId1 = "comprehensive1_" + Date.now();
    const appId2 = "comprehensive2_" + Date.now();
    
    // Test 1.1: Register multiple apps
    try {
      await crossEra.registerApp(appId1, "DeFi Protocol", "Advanced DeFi application", "DeFi", "https://defi.example.com");
      await crossEra.registerApp(appId2, "NFT Marketplace", "NFT trading platform", "NFT", "https://nft.example.com");
      
      const app1Owner = await crossEra.appOwners(appId1);
      const app2Owner = await crossEra.appOwners(appId2);
      const app1Registered = await crossEra.registeredApps(appId1);
      const app2Registered = await crossEra.registeredApps(appId2);
      
      logTest("Multiple app registration", 
        app1Owner === wallet.address && app2Owner === wallet.address && app1Registered && app2Registered);
    } catch (error) {
      logTest("Multiple app registration", false, error.message);
    }

    // Test 1.2: Update app information
    try {
      const updateTx = await crossEra.updateApp(appId1, "Updated DeFi Protocol", "Enhanced DeFi application", "DeFi", "https://newdefi.example.com");
      await updateTx.wait();
      logTest("App update", true);
    } catch (error) {
      logTest("App update", false, error.message);
    }

    // Test 1.3: Change app status
    try {
      const statusTx = await crossEra.changeAppStatus(appId1, 1, "Temporarily pausing for maintenance");
      await statusTx.wait();
      logTest("App status change", true);
    } catch (error) {
      logTest("App status change", false, error.message);
    }

    console.log("");

    // Test Suite 2: Campaign Management
    console.log("🎯 Test Suite 2: Campaign Management");
    console.log("====================================");
    
    // Test 2.1: Create campaign
    let campaignId = 0;
    try {
      const poolAmount = ethers.parseEther("1000");
      const startDate = Math.floor(Date.now() / 1000) + 60; // Start in 1 minute
      const endDate = startDate + (7 * 24 * 3600); // End in 7 days
      const rulesHash = ethers.keccak256(ethers.toUtf8Bytes("comprehensive-test-rules"));
      
      // Approve tokens for campaign creation
      await mockToken.approve(CROSSERA_ADDRESS, poolAmount);
      
      const createTx = await crossEra.createCampaign(
        "Comprehensive Test Campaign",
        "Testing all campaign functionality",
        poolAmount,
        startDate,
        endDate,
        0, // Proportional rewards
        rulesHash
      );
      
      const receipt = await createTx.wait();
      
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
        campaignId = parsedEvent.args[0];
        logTest("Campaign creation", true, `Campaign ID: ${campaignId}`);
      } else {
        logTest("Campaign creation", false, "Could not find CampaignCreated event");
      }
    } catch (error) {
      logTest("Campaign creation", false, error.message);
    }

    // Test 2.2: Activate campaign
    if (campaignId > 0) {
      try {
        // Wait for start time
        await new Promise(resolve => setTimeout(resolve, 65000)); // Wait 65 seconds
        
        const activateTx = await crossEra.activateCampaign(campaignId);
        await activateTx.wait();
        
        const campaign = await crossEra.getCampaign(campaignId);
        logTest("Campaign activation", campaign.active, `Campaign status: ${campaign.status}`);
      } catch (error) {
        logTest("Campaign activation", false, error.message);
      }
    }

    console.log("");

    // Test Suite 3: App-Campaign Registration
    console.log("📝 Test Suite 3: App-Campaign Registration");
    console.log("==========================================");
    
    if (campaignId > 0) {
      // Test 3.1: Register apps for campaign
      try {
        const regData1 = ethers.keccak256(ethers.toUtf8Bytes("registration-data-1"));
        const regData2 = ethers.keccak256(ethers.toUtf8Bytes("registration-data-2"));
        
        await crossEra.registerAppForCampaign(appId1, campaignId, 0, regData1);
        await crossEra.registerAppForCampaign(appId2, campaignId, 0, regData2);
        
        logTest("App campaign registration", true, "Both apps registered for campaign");
      } catch (error) {
        logTest("App campaign registration", false, error.message);
      }
    }

    console.log("");

    // Test Suite 4: Transaction Processing & Rewards
    console.log("⚡ Test Suite 4: Transaction Processing & Rewards");
    console.log("================================================");
    
    if (campaignId > 0) {
      // Test 4.1: Process transactions
      try {
        const transactions = [
          { app: appId1, gasUsed: 150000, gasPrice: ethers.parseUnits("25", "gwei"), value: ethers.parseEther("10") },
          { app: appId1, gasUsed: 200000, gasPrice: ethers.parseUnits("30", "gwei"), value: ethers.parseEther("5") },
          { app: appId2, gasUsed: 120000, gasPrice: ethers.parseUnits("20", "gwei"), value: ethers.parseEther("15") },
          { app: appId2, gasUsed: 180000, gasPrice: ethers.parseUnits("35", "gwei"), value: ethers.parseEther("8") },
        ];
        
        for (let i = 0; i < transactions.length; i++) {
          const tx = transactions[i];
          const txHash = ethers.keccak256(ethers.toUtf8Bytes(`comprehensive-tx-${i}`));
          
          await crossEra.processTransaction(
            tx.app,
            campaignId,
            txHash,
            tx.gasUsed,
            tx.gasPrice,
            tx.value,
            1, // Contract call
            ethers.keccak256(ethers.toUtf8Bytes(`additional-data-${i}`))
          );
        }
        
        logTest("Transaction processing", true, `Processed ${transactions.length} transactions`);
      } catch (error) {
        logTest("Transaction processing", false, error.message);
      }

      // Test 4.2: Check claimable rewards
      try {
        const app1Rewards = await crossEra.getClaimableRewards(appId1, campaignId);
        const app2Rewards = await crossEra.getClaimableRewards(appId2, campaignId);
        
        const hasRewards = app1Rewards > 0 && app2Rewards > 0;
        logTest("Reward calculation", hasRewards, 
          `App1: ${ethers.formatEther(app1Rewards)} XFI, App2: ${ethers.formatEther(app2Rewards)} XFI`);
      } catch (error) {
        logTest("Reward calculation", false, error.message);
      }

      // Test 4.3: Claim rewards
      try {
        const initialBalance = await mockToken.balanceOf(wallet.address);
        
        const claimTx1 = await crossEra.claimRewards(appId1, campaignId);
        await claimTx1.wait();
        
        const claimTx2 = await crossEra.claimRewards(appId2, campaignId);
        await claimTx2.wait();
        
        const finalBalance = await mockToken.balanceOf(wallet.address);
        const totalClaimed = finalBalance - initialBalance;
        
        logTest("Reward claiming", totalClaimed > 0, `Claimed ${ethers.formatEther(totalClaimed)} XFI`);
      } catch (error) {
        logTest("Reward claiming", false, error.message);
      }
    }

    console.log("");

    // Test Suite 5: Admin Functions
    console.log("🔧 Test Suite 5: Admin Functions");
    console.log("=================================");
    
    // Test 5.1: Check admin role
    try {
      const adminRole = await crossEra.ADMIN_ROLE();
      const hasAdminRole = await crossEra.hasRole(adminRole, wallet.address);
      logTest("Admin role verification", hasAdminRole);
    } catch (error) {
      logTest("Admin role verification", false, error.message);
    }

    // Test 5.2: Update minimum reward amount
    try {
      const newMinReward = ethers.parseEther("0.15");
      const updateTx = await crossEra.setMinRewardAmount(newMinReward);
      await updateTx.wait();
      
      const updatedMinReward = await crossEra.minRewardAmount();
      logTest("Min reward update", updatedMinReward === newMinReward, 
        `New min reward: ${ethers.formatEther(updatedMinReward)} XFI`);
    } catch (error) {
      logTest("Min reward update", false, error.message);
    }

    console.log("");

    // Test Suite 6: Event Verification
    console.log("📡 Test Suite 6: Event Verification");
    console.log("===================================");
    
    // Test 6.1: Query recent events
    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(currentBlock - 100, 0);
      
      const appRegisteredFilter = crossEra.filters.AppRegistered();
      const appEvents = await crossEra.queryFilter(appRegisteredFilter, fromBlock);
      
      const campaignCreatedFilter = crossEra.filters.CampaignCreated();
      const campaignEvents = await crossEra.queryFilter(campaignCreatedFilter, fromBlock);
      
      const transactionProcessedFilter = crossEra.filters.TransactionProcessed();
      const txEvents = await crossEra.queryFilter(transactionProcessedFilter, fromBlock);
      
      const rewardClaimedFilter = crossEra.filters.RewardClaimed();
      const rewardEvents = await crossEra.queryFilter(rewardClaimedFilter, fromBlock);
      
      logTest("Event emission verification", 
        appEvents.length > 0 && campaignEvents.length > 0 && txEvents.length > 0 && rewardEvents.length > 0,
        `Apps: ${appEvents.length}, Campaigns: ${campaignEvents.length}, Txs: ${txEvents.length}, Claims: ${rewardEvents.length}`);
    } catch (error) {
      logTest("Event emission verification", false, error.message);
    }

    console.log("");

    // Final Results
    console.log("🎊 Test Results Summary");
    console.log("=======================");
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    console.log("\n📋 Detailed Results:");
    testResults.tests.forEach((test, index) => {
      const status = test.passed ? "✅" : "❌";
      console.log(`${index + 1}. ${status} ${test.name}${test.details ? ": " + test.details : ""}`);
    });

    if (testResults.failed === 0) {
      console.log("\n🎉 All comprehensive tests passed! The CrossEra system is working perfectly!");
    } else {
      console.log(`\n⚠️  ${testResults.failed} test(s) failed. Please review the results above.`);
    }

  } catch (error) {
    console.error("💥 Comprehensive test suite failed with error:");
    console.error(error);
  }
}

// Run the comprehensive test
comprehensiveWorkflowTest()
  .then(() => {
    console.log("\n✨ Comprehensive test suite completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Comprehensive test suite crashed:");
    console.error(error);
    process.exit(1);
  });
