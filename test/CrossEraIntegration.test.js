const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CrossEra Integration Tests", function () {
  // Fixture for full integration setup
  async function deployFullSystemFixture() {
    const [admin, verifier, campaignManager, developer1, developer2, developer3, user1, user2] = await ethers.getSigners();

    // Deploy Mock XFI Token
    const MockXFIToken = await ethers.getContractFactory("MockXFIToken");
    const mockToken = await MockXFIToken.deploy("CrossFi Token", "XFI", ethers.parseEther("10000000"));
    await mockToken.waitForDeployment();

    // Deploy CrossEra Reward System
    const CrossEraRewardSystem = await ethers.getContractFactory("CrossEraRewardSystem");
    const crossEra = await CrossEraRewardSystem.deploy(await mockToken.getAddress(), admin.address);
    await crossEra.waitForDeployment();

    // Grant roles
    const VERIFIER_ROLE = await crossEra.VERIFIER_ROLE();
    const CAMPAIGN_MANAGER_ROLE = await crossEra.CAMPAIGN_MANAGER_ROLE();
    
    await crossEra.grantRole(VERIFIER_ROLE, verifier.address);
    await crossEra.grantRole(CAMPAIGN_MANAGER_ROLE, campaignManager.address);

    // Fund accounts with tokens
    await mockToken.mint(admin.address, ethers.parseEther("100000"));
    await mockToken.mint(campaignManager.address, ethers.parseEther("50000"));
    await mockToken.mint(developer1.address, ethers.parseEther("10000"));
    await mockToken.mint(developer2.address, ethers.parseEther("10000"));
    await mockToken.mint(developer3.address, ethers.parseEther("10000"));

    // Fund contract for reward payouts
    await mockToken.mint(await crossEra.getAddress(), ethers.parseEther("10000"));

    return {
      crossEra,
      mockToken,
      admin,
      verifier,
      campaignManager,
      developer1,
      developer2,
      developer3,
      user1,
      user2,
      VERIFIER_ROLE,
      CAMPAIGN_MANAGER_ROLE
    };
  }

  describe("Complete Workflow Integration", function () {
    it("Should handle full app lifecycle: register -> campaign -> transactions -> rewards", async function () {
      const { crossEra, mockToken, campaignManager, developer1, verifier } = await loadFixture(deployFullSystemFixture);
      
      console.log("🧪 Starting complete workflow integration test...");

      // Step 1: Register multiple apps
      console.log("📱 Step 1: Registering apps...");
      const apps = [
        { id: "defiapp1", name: "DeFi Protocol", dev: developer1 },
        { id: "nftmarket", name: "NFT Marketplace", dev: developer1 },
      ];

      for (const app of apps) {
        await crossEra.connect(app.dev).registerApp(
          app.id, app.name, `${app.name} description`, "DeFi", `https://${app.id}.com`
        );
        console.log(`   ✅ Registered ${app.name} (${app.id})`);
      }

      expect(await crossEra.totalApps()).to.equal(2);
      console.log(`   📊 Total apps registered: ${await crossEra.totalApps()}`);

      // Step 2: Create and activate campaign
      console.log("🎯 Step 2: Creating and activating campaign...");
      const poolAmount = ethers.parseEther("5000");
      const startDate = Math.floor(Date.now() / 1000) + 30;
      const endDate = startDate + (7 * 24 * 3600); // 7 days

      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);
      
      const createCampaignTx = await crossEra.connect(campaignManager).createCampaign(
        "Launch Campaign Q1",
        "Initial campaign to bootstrap the CrossEra ecosystem",
        poolAmount,
        startDate,
        endDate,
        0, // Proportional rewards
        ethers.keccak256(ethers.toUtf8Bytes("ipfs://campaign-rules-hash"))
      );

      const receipt = await createCampaignTx.wait();
      console.log(`   ✅ Campaign created with ${ethers.formatEther(poolAmount)} XFI pool`);
      console.log(`   📋 Campaign ID: 1`);

      // Wait for campaign start and activate
      await ethers.provider.send("evm_increaseTime", [35]);
      await ethers.provider.send("evm_mine");

      await crossEra.connect(campaignManager).activateCampaign(1);
      console.log("   🟢 Campaign activated");

      const campaign = await crossEra.getCampaign(1);
      expect(campaign.active).to.be.true;

      // Step 3: Register apps for campaign
      console.log("📝 Step 3: Registering apps for campaign...");
      for (const app of apps) {
        await crossEra.connect(app.dev).registerAppForCampaign(
          app.id, 1, 0, ethers.keccak256(ethers.toUtf8Bytes(`${app.id}-registration`))
        );
        console.log(`   ✅ ${app.name} registered for campaign`);
      }

      // Step 4: Simulate transaction processing with different patterns
      console.log("⚡ Step 4: Processing transactions...");
      
      const transactions = [
        // DeFi app transactions
        { app: "defiapp1", gasUsed: 150000, gasPrice: ethers.parseUnits("25", "gwei"), value: ethers.parseEther("10"), type: 2 },
        { app: "defiapp1", gasUsed: 200000, gasPrice: ethers.parseUnits("30", "gwei"), value: ethers.parseEther("5"), type: 2 },
        { app: "defiapp1", gasUsed: 120000, gasPrice: ethers.parseUnits("20", "gwei"), value: ethers.parseEther("15"), type: 1 },
        
        // NFT marketplace transactions
        { app: "nftmarket", gasUsed: 80000, gasPrice: ethers.parseUnits("22", "gwei"), value: ethers.parseEther("2"), type: 3 },
        { app: "nftmarket", gasUsed: 95000, gasPrice: ethers.parseUnits("28", "gwei"), value: ethers.parseEther("8"), type: 3 },
      ];

      let totalRewardsGenerated = 0n;
      
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const txHash = ethers.keccak256(ethers.toUtf8Bytes(`transaction-${i}-${tx.app}`));
        
        const processTx = await crossEra.connect(verifier).processTransaction(
          tx.app,
          1, // campaign ID
          txHash,
          tx.gasUsed,
          tx.gasPrice,
          tx.value,
          tx.type,
          ethers.keccak256(ethers.toUtf8Bytes(`additional-data-${i}`))
        );

        const processReceipt = await processTx.wait();
        
        // Calculate expected reward
        const feeGenerated = BigInt(tx.gasUsed) * tx.gasPrice;
        const gasBasedReward = feeGenerated / 10n;
        const valueBasedReward = tx.value / 1000n;
        const minReward = ethers.parseEther("0.1");
        const expectedReward = gasBasedReward + valueBasedReward;
        const actualReward = expectedReward > minReward ? expectedReward : minReward;
        
        totalRewardsGenerated += actualReward;
        
        console.log(`   ⚡ Processed tx for ${tx.app}: ${ethers.formatEther(actualReward)} XFI reward`);
        
        // Verify transaction was processed
        expect(await crossEra.isTransactionProcessed(txHash)).to.be.true;
      }

      console.log(`   📊 Total rewards generated: ${ethers.formatEther(totalRewardsGenerated)} XFI`);

      // Step 5: Check claimable rewards
      console.log("💰 Step 5: Checking claimable rewards...");
      
      const app1Rewards = await crossEra.getClaimableRewards("defiapp1", 1);
      const app2Rewards = await crossEra.getClaimableRewards("nftmarket", 1);
      
      console.log(`   💎 DeFi Protocol claimable: ${ethers.formatEther(app1Rewards)} XFI`);
      console.log(`   💎 NFT Marketplace claimable: ${ethers.formatEther(app2Rewards)} XFI`);
      
      expect(app1Rewards).to.be.gt(0);
      expect(app2Rewards).to.be.gt(0);
      expect(app1Rewards + app2Rewards).to.equal(totalRewardsGenerated);

      // Step 6: Claim rewards
      console.log("🏆 Step 6: Claiming rewards...");
      
      const dev1InitialBalance = await mockToken.balanceOf(developer1.address);
      
      // Claim rewards for both apps (same developer)
      const claimTx1 = await crossEra.connect(developer1).claimRewards("defiapp1", 1);
      await claimTx1.wait();
      
      const claimTx2 = await crossEra.connect(developer1).claimRewards("nftmarket", 1);
      await claimTx2.wait();
      
      const dev1FinalBalance = await mockToken.balanceOf(developer1.address);
      const totalClaimed = dev1FinalBalance - dev1InitialBalance;
      
      console.log(`   🎉 Developer1 claimed: ${ethers.formatEther(totalClaimed)} XFI`);
      
      expect(totalClaimed).to.equal(totalRewardsGenerated);
      expect(await crossEra.getClaimableRewards("defiapp1", 1)).to.equal(0);
      expect(await crossEra.getClaimableRewards("nftmarket", 1)).to.equal(0);

      // Step 7: Verify final state
      console.log("✅ Step 7: Verifying final state...");
      
      const finalCampaign = await crossEra.getCampaign(1);
      console.log(`   📈 Campaign distributed rewards: ${ethers.formatEther(finalCampaign.distributedRewards)} XFI`);
      
      expect(finalCampaign.distributedRewards).to.equal(totalRewardsGenerated);
      
      console.log("🎊 Complete workflow integration test passed!");
    });

    it("Should handle multiple developers and campaigns simultaneously", async function () {
      const { crossEra, mockToken, campaignManager, developer1, developer2, developer3, verifier } = await loadFixture(deployFullSystemFixture);
      
      console.log("🧪 Starting multi-developer, multi-campaign test...");

      // Register apps from different developers
      const appRegistrations = [
        { dev: developer1, id: "gamefi1", name: "GameFi Protocol" },
        { dev: developer2, id: "lending1", name: "Lending Platform" },
        { dev: developer3, id: "exchange1", name: "DEX Platform" },
        { dev: developer1, id: "staking1", name: "Staking Service" }, // Developer1 has 2 apps
      ];

      for (const reg of appRegistrations) {
        await crossEra.connect(reg.dev).registerApp(
          reg.id, reg.name, `${reg.name} description`, "DeFi", `https://${reg.id}.com`
        );
      }

      // Create multiple campaigns
      const campaigns = [
        { name: "Q1 Launch", pool: ethers.parseEther("3000"), duration: 7 * 24 * 3600 },
        { name: "Growth Phase", pool: ethers.parseEther("5000"), duration: 14 * 24 * 3600 },
      ];

      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const startDate = Math.floor(Date.now() / 1000) + 30 + (i * 10);
        const endDate = startDate + campaign.duration;

        await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), campaign.pool);
        
        await crossEra.connect(campaignManager).createCampaign(
          campaign.name,
          `${campaign.name} campaign description`,
          campaign.pool,
          startDate,
          endDate,
          0,
          ethers.keccak256(ethers.toUtf8Bytes(`${campaign.name}-rules`))
        );

        console.log(`   🎯 Created campaign: ${campaign.name} with ${ethers.formatEther(campaign.pool)} XFI`);
      }

      // Activate campaigns
      await ethers.provider.send("evm_increaseTime", [35]);
      await ethers.provider.send("evm_mine");

      for (let i = 1; i <= campaigns.length; i++) {
        await crossEra.connect(campaignManager).activateCampaign(i);
      }

      // Register apps for campaigns (different patterns)
      const registrationPattern = [
        { app: "gamefi1", campaigns: [1, 2] },
        { app: "lending1", campaigns: [1] },
        { app: "exchange1", campaigns: [2] },
        { app: "staking1", campaigns: [1, 2] },
      ];

      for (const pattern of registrationPattern) {
        const appOwner = appRegistrations.find(r => r.id === pattern.app).dev;
        for (const campaignId of pattern.campaigns) {
          await crossEra.connect(appOwner).registerAppForCampaign(
            pattern.app, campaignId, 0, ethers.keccak256(ethers.toUtf8Bytes(`${pattern.app}-c${campaignId}`))
          );
        }
      }

      // Process transactions across different apps and campaigns
      const transactionBatch = [
        { app: "gamefi1", campaign: 1, count: 3 },
        { app: "gamefi1", campaign: 2, count: 2 },
        { app: "lending1", campaign: 1, count: 4 },
        { app: "exchange1", campaign: 2, count: 3 },
        { app: "staking1", campaign: 1, count: 2 },
        { app: "staking1", campaign: 2, count: 3 },
      ];

      let totalProcessed = 0;
      const campaignRewards = new Map();

      for (const batch of transactionBatch) {
        for (let i = 0; i < batch.count; i++) {
          const txHash = ethers.keccak256(ethers.toUtf8Bytes(`${batch.app}-${batch.campaign}-${i}`));
          const gasUsed = 100000 + (i * 10000);
          const gasPrice = ethers.parseUnits("25", "gwei");
          const value = ethers.parseEther((i + 1).toString());

          await crossEra.connect(verifier).processTransaction(
            batch.app,
            batch.campaign,
            txHash,
            gasUsed,
            gasPrice,
            value,
            1, // Contract call
            ethers.keccak256(ethers.toUtf8Bytes(`batch-${totalProcessed}`))
          );

          totalProcessed++;

          // Track rewards per campaign
          const key = `${batch.app}-${batch.campaign}`;
          const currentRewards = await crossEra.getClaimableRewards(batch.app, batch.campaign);
          campaignRewards.set(key, currentRewards);
        }
      }

      console.log(`   ⚡ Processed ${totalProcessed} transactions across multiple apps and campaigns`);

      // Verify rewards distribution
      let totalRewardsAcrossCampaigns = 0n;
      for (const [key, rewards] of campaignRewards) {
        console.log(`   💰 ${key}: ${ethers.formatEther(rewards)} XFI`);
        totalRewardsAcrossCampaigns += rewards;
      }

      console.log(`   📊 Total rewards across all campaigns: ${ethers.formatEther(totalRewardsAcrossCampaigns)} XFI`);

      // Test claiming from multiple campaigns
      const dev1InitialBalance = await mockToken.balanceOf(developer1.address);
      
      // Developer1 claims from both campaigns for both apps
      await crossEra.connect(developer1).claimRewards("gamefi1", 1);
      await crossEra.connect(developer1).claimRewards("gamefi1", 2);
      await crossEra.connect(developer1).claimRewards("staking1", 1);
      await crossEra.connect(developer1).claimRewards("staking1", 2);

      const dev1FinalBalance = await mockToken.balanceOf(developer1.address);
      const dev1TotalClaimed = dev1FinalBalance - dev1InitialBalance;

      console.log(`   🏆 Developer1 total claimed: ${ethers.formatEther(dev1TotalClaimed)} XFI`);

      expect(dev1TotalClaimed).to.be.gt(0);
      
      console.log("🎊 Multi-developer, multi-campaign test passed!");
    });

    it("Should handle edge cases and error conditions gracefully", async function () {
      const { crossEra, mockToken, campaignManager, developer1, verifier } = await loadFixture(deployFullSystemFixture);
      
      console.log("🧪 Starting edge cases and error handling test...");

      // Test 1: App registration edge cases
      console.log("📱 Testing app registration edge cases...");
      
      // Register valid app first
      await crossEra.connect(developer1).registerApp(
        "validapp", "Valid App", "Description", "Category", "https://valid.com"
      );

      // Test duplicate registration
      await expect(
        crossEra.connect(developer1).registerApp(
          "validapp", "Another App", "Description", "Category", "https://another.com"
        )
      ).to.be.revertedWith("CrossEra: App already registered");

      console.log("   ✅ Duplicate registration properly rejected");

      // Test 2: Campaign edge cases
      console.log("🎯 Testing campaign edge cases...");
      
      const poolAmount = ethers.parseEther("1000");
      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);

      // Create campaign with valid parameters
      const startDate = Math.floor(Date.now() / 1000) + 3600;
      const endDate = startDate + (7 * 24 * 3600);
      
      await crossEra.connect(campaignManager).createCampaign(
        "Test Campaign", "Description", poolAmount, startDate, endDate, 0,
        ethers.keccak256(ethers.toUtf8Bytes("rules"))
      );

      // Try to register app for inactive campaign
      await expect(
        crossEra.connect(developer1).registerAppForCampaign(
          "validapp", 1, 0, ethers.keccak256(ethers.toUtf8Bytes("data"))
        )
      ).to.be.revertedWith("CrossEra: Campaign not active");

      console.log("   ✅ Registration for inactive campaign properly rejected");

      // Test 3: Transaction processing edge cases
      console.log("⚡ Testing transaction processing edge cases...");
      
      // Activate campaign first
      await ethers.provider.send("evm_increaseTime", [3605]);
      await ethers.provider.send("evm_mine");
      await crossEra.connect(campaignManager).activateCampaign(1);
      await crossEra.connect(developer1).registerAppForCampaign(
        "validapp", 1, 0, ethers.keccak256(ethers.toUtf8Bytes("data"))
      );

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test-tx"));
      
      // Process transaction successfully
      await crossEra.connect(verifier).processTransaction(
        "validapp", 1, txHash, 100000, ethers.parseUnits("20", "gwei"), 
        ethers.parseEther("1"), 0, ethers.keccak256(ethers.toUtf8Bytes("data"))
      );

      // Try to process same transaction again
      await expect(
        crossEra.connect(verifier).processTransaction(
          "validapp", 1, txHash, 100000, ethers.parseUnits("20", "gwei"), 
          ethers.parseEther("1"), 0, ethers.keccak256(ethers.toUtf8Bytes("data"))
        )
      ).to.be.revertedWith("CrossEra: Transaction already processed");

      console.log("   ✅ Duplicate transaction processing properly rejected");

      // Test 4: Reward claiming edge cases
      console.log("💰 Testing reward claiming edge cases...");
      
      // Try to claim with insufficient rewards
      await crossEra.connect(developer1).claimRewards("validapp", 1); // This should work
      
      // Try to claim again (should fail - no rewards left)
      await expect(
        crossEra.connect(developer1).claimRewards("validapp", 1)
      ).to.be.revertedWith("CrossEra: No rewards to claim");

      console.log("   ✅ Empty reward claiming properly rejected");

      // Test 5: Access control edge cases
      console.log("🔐 Testing access control edge cases...");
      
      // Try admin functions with non-admin
      await expect(
        crossEra.connect(developer1).setMinRewardAmount(ethers.parseEther("0.2"))
      ).to.be.revertedWith("CrossEra: Not admin");

      // Try verifier functions with non-verifier
      await expect(
        crossEra.connect(developer1).processTransaction(
          "validapp", 1, ethers.keccak256(ethers.toUtf8Bytes("new-tx")), 
          100000, ethers.parseUnits("20", "gwei"), ethers.parseEther("1"), 
          0, ethers.keccak256(ethers.toUtf8Bytes("data"))
        )
      ).to.be.revertedWith("CrossEra: Not verifier");

      console.log("   ✅ Access control properly enforced");

      // Test 6: Paused state functionality
      console.log("⏸️ Testing paused state functionality...");
      
      const { admin } = await loadFixture(deployFullSystemFixture);
      
      // Pause contract
      await crossEra.connect(admin).emergencyPause("Testing pause functionality");
      
      // Try to register app while paused
      await expect(
        crossEra.connect(developer1).registerApp(
          "pausedapp", "Paused App", "Description", "Category", "https://paused.com"
        )
      ).to.be.revertedWith("Pausable: paused");

      // Unpause and try again
      await crossEra.connect(admin).emergencyUnpause("Testing unpause");
      
      await crossEra.connect(developer1).registerApp(
        "pausedapp", "Paused App", "Description", "Category", "https://paused.com"
      );

      console.log("   ✅ Pause/unpause functionality working correctly");

      console.log("🎊 Edge cases and error handling test passed!");
    });

    it("Should emit comprehensive events for off-chain indexing", async function () {
      const { crossEra, mockToken, campaignManager, developer1, verifier } = await loadFixture(deployFullSystemFixture);
      
      console.log("🧪 Starting comprehensive event emission test...");

      // Test app registration events
      console.log("📡 Testing app registration events...");
      
      await expect(
        crossEra.connect(developer1).registerApp(
          "eventapp", "Event Test App", "Testing events", "Testing", "https://events.com"
        )
      ).to.emit(crossEra, "AppRegistered")
        .withArgs(
          "eventapp", 
          developer1.address, 
          "Event Test App", 
          "Testing events", 
          "Testing", 
          "https://events.com",
          anyValue, // metadataHash
          anyValue  // timestamp
        );

      console.log("   ✅ AppRegistered event emitted correctly");

      // Test campaign creation events
      console.log("📡 Testing campaign creation events...");
      
      const poolAmount = ethers.parseEther("2000");
      const startDate = Math.floor(Date.now() / 1000) + 3600;
      const endDate = startDate + (7 * 24 * 3600);
      const rulesHash = ethers.keccak256(ethers.toUtf8Bytes("event-test-rules"));

      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);
      
      await expect(
        crossEra.connect(campaignManager).createCampaign(
          "Event Test Campaign",
          "Testing campaign events",
          poolAmount,
          startDate,
          endDate,
          1, // Fixed rewards
          rulesHash
        )
      ).to.emit(crossEra, "CampaignCreated")
        .withArgs(
          1, // campaign ID
          campaignManager.address,
          "Event Test Campaign",
          "Testing campaign events",
          poolAmount,
          startDate,
          endDate,
          1, // reward type
          rulesHash,
          anyValue // timestamp
        );

      console.log("   ✅ CampaignCreated event emitted correctly");

      // Test campaign status change events
      console.log("📡 Testing campaign status change events...");
      
      await ethers.provider.send("evm_increaseTime", [3605]);
      await ethers.provider.send("evm_mine");

      await expect(
        crossEra.connect(campaignManager).activateCampaign(1)
      ).to.emit(crossEra, "CampaignStatusChanged")
        .withArgs(1, 1, 0, campaignManager.address, anyValue); // Active(1), from Pending(0)

      console.log("   ✅ CampaignStatusChanged event emitted correctly");

      // Test app campaign registration events
      console.log("📡 Testing app campaign registration events...");
      
      const registrationData = ethers.keccak256(ethers.toUtf8Bytes("event-registration-data"));
      
      await expect(
        crossEra.connect(developer1).registerAppForCampaign("eventapp", 1, 0, registrationData)
      ).to.emit(crossEra, "AppRegisteredForCampaign")
        .withArgs("eventapp", 1, developer1.address, 0, registrationData, anyValue);

      console.log("   ✅ AppRegisteredForCampaign event emitted correctly");

      // Test transaction processing events
      console.log("📡 Testing transaction processing events...");
      
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("event-test-transaction"));
      const gasUsed = 150000;
      const gasPrice = ethers.parseUnits("25", "gwei");
      const transactionValue = ethers.parseEther("5");
      const additionalData = ethers.keccak256(ethers.toUtf8Bytes("event-additional-data"));

      await expect(
        crossEra.connect(verifier).processTransaction(
          "eventapp",
          1,
          txHash,
          gasUsed,
          gasPrice,
          transactionValue,
          2, // DeFi interaction
          additionalData
        )
      ).to.emit(crossEra, "TransactionProcessed")
        .withArgs(
          "eventapp",
          1,
          txHash,
          developer1.address,
          gasUsed,
          gasPrice,
          transactionValue,
          anyValue, // feeGenerated
          anyValue, // rewardCalculated
          2, // transaction type
          additionalData,
          anyValue // timestamp
        );

      console.log("   ✅ TransactionProcessed event emitted correctly");

      // Test reward claiming events
      console.log("📡 Testing reward claiming events...");
      
      const claimableAmount = await crossEra.getClaimableRewards("eventapp", 1);
      
      await expect(
        crossEra.connect(developer1).claimRewards("eventapp", 1)
      ).to.emit(crossEra, "RewardClaimed")
        .withArgs(
          "eventapp",
          1,
          developer1.address,
          claimableAmount,
          anyValue, // totalClaimedToDate
          anyValue, // claimTxHash
          anyValue  // timestamp
        );

      console.log("   ✅ RewardClaimed event emitted correctly");

      // Test configuration update events
      console.log("📡 Testing configuration update events...");
      
      const { admin } = await loadFixture(deployFullSystemFixture);
      const newMinReward = ethers.parseEther("0.15");
      
      await expect(
        crossEra.connect(admin).setMinRewardAmount(newMinReward)
      ).to.emit(crossEra, "ConfigurationUpdated")
        .withArgs(
          ethers.keccak256(ethers.toUtf8Bytes("MIN_REWARD_AMOUNT")),
          anyValue, // old value
          anyValue, // new value  
          admin.address,
          anyValue  // timestamp
        );

      console.log("   ✅ ConfigurationUpdated event emitted correctly");

      // Test emergency action events
      console.log("📡 Testing emergency action events...");
      
      await expect(
        crossEra.connect(admin).emergencyPause("Event test pause")
      ).to.emit(crossEra, "EmergencyAction")
        .withArgs(0, admin.address, "Event test pause", anyValue, anyValue); // 0 = pause

      console.log("   ✅ EmergencyAction event emitted correctly");

      console.log("🎊 Comprehensive event emission test passed!");
    });
  });

  // Helper function for any value matching in events
  function anyValue() {
    return true;
  }
});
