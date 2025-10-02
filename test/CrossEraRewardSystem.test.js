const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CrossEra Reward System", function () {
  // Fixture for deploying contracts
  async function deployCrossEraFixture() {
    const [admin, verifier, campaignManager, developer1, developer2, user1, user2] = await ethers.getSigners();

    // Deploy Mock XFI Token
    const MockXFIToken = await ethers.getContractFactory("MockXFIToken");
    const mockToken = await MockXFIToken.deploy("CrossFi Token", "XFI", ethers.parseEther("1000000"));
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

    // Fund some accounts with tokens
    await mockToken.mint(admin.address, ethers.parseEther("10000"));
    await mockToken.mint(developer1.address, ethers.parseEther("1000"));
    await mockToken.mint(developer2.address, ethers.parseEther("1000"));

    return {
      crossEra,
      mockToken,
      admin,
      verifier,
      campaignManager,
      developer1,
      developer2,
      user1,
      user2,
      VERIFIER_ROLE,
      CAMPAIGN_MANAGER_ROLE
    };
  }

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const { crossEra, admin } = await loadFixture(deployCrossEraFixture);
      
      const ADMIN_ROLE = await crossEra.ADMIN_ROLE();
      expect(await crossEra.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should set the correct reward token", async function () {
      const { crossEra, mockToken } = await loadFixture(deployCrossEraFixture);
      
      expect(await crossEra.rewardToken()).to.equal(await mockToken.getAddress());
    });

    it("Should initialize with zero counters", async function () {
      const { crossEra } = await loadFixture(deployCrossEraFixture);
      
      expect(await crossEra.totalApps()).to.equal(0);
      expect(await crossEra.totalCampaigns()).to.equal(0);
      expect(await crossEra.totalDevelopers()).to.equal(0);
    });

    it("Should set correct minimum reward amount", async function () {
      const { crossEra } = await loadFixture(deployCrossEraFixture);
      
      expect(await crossEra.minRewardAmount()).to.equal(ethers.parseEther("0.1"));
    });
  });

  describe("App Registration", function () {
    it("Should allow developers to register apps", async function () {
      const { crossEra, developer1 } = await loadFixture(deployCrossEraFixture);
      
      const appId = "testapp123";
      const appName = "Test Application";
      const description = "A test application for CrossEra";
      const category = "Testing";
      const websiteUrl = "https://test.crossera.com";

      await expect(
        crossEra.connect(developer1).registerApp(appId, appName, description, category, websiteUrl)
      ).to.emit(crossEra, "AppRegistered")
        .withArgs(appId, developer1.address, appName, description, category, websiteUrl, anyValue, anyValue);

      // Verify app registration
      expect(await crossEra.appOwners(appId)).to.equal(developer1.address);
      expect(await crossEra.registeredApps(appId)).to.be.true;
      expect(await crossEra.totalApps()).to.equal(1);
    });

    it("Should prevent duplicate app registration", async function () {
      const { crossEra, developer1, developer2 } = await loadFixture(deployCrossEraFixture);
      
      const appId = "testapp123";
      
      // First registration should succeed
      await crossEra.connect(developer1).registerApp(
        appId, "Test App", "Description", "Category", "https://test.com"
      );

      // Second registration with same app ID should fail
      await expect(
        crossEra.connect(developer2).registerApp(
          appId, "Another App", "Description", "Category", "https://test2.com"
        )
      ).to.be.revertedWith("CrossEra: App already registered");
    });

    it("Should reject invalid app ID lengths", async function () {
      const { crossEra, developer1 } = await loadFixture(deployCrossEraFixture);
      
      // Too long app ID (>32 characters)
      const longAppId = "a".repeat(33);
      
      await expect(
        crossEra.connect(developer1).registerApp(
          longAppId, "Test App", "Description", "Category", "https://test.com"
        )
      ).to.be.revertedWith("CrossEra: Invalid app ID length");

      // Empty app ID
      await expect(
        crossEra.connect(developer1).registerApp(
          "", "Test App", "Description", "Category", "https://test.com"
        )
      ).to.be.revertedWith("CrossEra: Invalid app ID length");
    });

    it("Should reject invalid app name lengths", async function () {
      const { crossEra, developer1 } = await loadFixture(deployCrossEraFixture);
      
      // Too long app name (>64 characters)
      const longAppName = "a".repeat(65);
      
      await expect(
        crossEra.connect(developer1).registerApp(
          "testapp", longAppName, "Description", "Category", "https://test.com"
        )
      ).to.be.revertedWith("CrossEra: Invalid app name length");

      // Empty app name
      await expect(
        crossEra.connect(developer1).registerApp(
          "testapp", "", "Description", "Category", "https://test.com"
        )
      ).to.be.revertedWith("CrossEra: Invalid app name length");
    });

    it("Should allow app updates by owner", async function () {
      const { crossEra, developer1 } = await loadFixture(deployCrossEraFixture);
      
      const appId = "testapp123";
      
      // Register app first
      await crossEra.connect(developer1).registerApp(
        appId, "Test App", "Description", "Category", "https://test.com"
      );

      // Update app
      const newName = "Updated App Name";
      const newDescription = "Updated description";
      const newCategory = "Updated Category";
      const newUrl = "https://updated.com";

      await expect(
        crossEra.connect(developer1).updateApp(appId, newName, newDescription, newCategory, newUrl)
      ).to.emit(crossEra, "AppUpdated")
        .withArgs(appId, developer1.address, newName, newDescription, newCategory, newUrl, anyValue);
    });

    it("Should prevent app updates by non-owner", async function () {
      const { crossEra, developer1, developer2 } = await loadFixture(deployCrossEraFixture);
      
      const appId = "testapp123";
      
      // Register app with developer1
      await crossEra.connect(developer1).registerApp(
        appId, "Test App", "Description", "Category", "https://test.com"
      );

      // Try to update with developer2
      await expect(
        crossEra.connect(developer2).updateApp(appId, "New Name", "New Desc", "New Cat", "https://new.com")
      ).to.be.revertedWith("CrossEra: Not app owner");
    });
  });

  describe("Campaign Management", function () {
    it("Should allow campaign managers to create campaigns", async function () {
      const { crossEra, mockToken, campaignManager } = await loadFixture(deployCrossEraFixture);
      
      const poolAmount = ethers.parseEther("1000");
      const startDate = Math.floor(Date.now() / 1000) + 3600; // Start in 1 hour
      const endDate = startDate + (30 * 24 * 3600); // End in 30 days
      
      // Approve tokens for campaign creation
      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);
      await mockToken.mint(campaignManager.address, poolAmount);

      await expect(
        crossEra.connect(campaignManager).createCampaign(
          "Test Campaign",
          "A test campaign",
          poolAmount,
          startDate,
          endDate,
          0, // Proportional rewards
          ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
        )
      ).to.emit(crossEra, "CampaignCreated");

      expect(await crossEra.totalCampaigns()).to.equal(1);
      
      const campaign = await crossEra.getCampaign(1);
      expect(campaign.exists).to.be.true;
      expect(campaign.totalPool).to.equal(poolAmount);
    });

    it("Should prevent non-campaign managers from creating campaigns", async function () {
      const { crossEra, developer1 } = await loadFixture(deployCrossEraFixture);
      
      const startDate = Math.floor(Date.now() / 1000) + 3600;
      const endDate = startDate + (30 * 24 * 3600);
      
      await expect(
        crossEra.connect(developer1).createCampaign(
          "Test Campaign",
          "Description",
          ethers.parseEther("1000"),
          startDate,
          endDate,
          0,
          ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
        )
      ).to.be.revertedWith("CrossEra: Not campaign manager");
    });

    it("Should validate campaign parameters", async function () {
      const { crossEra, mockToken, campaignManager } = await loadFixture(deployCrossEraFixture);
      
      const poolAmount = ethers.parseEther("1000");
      await mockToken.mint(campaignManager.address, poolAmount);
      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);

      // Invalid pool amount
      await expect(
        crossEra.connect(campaignManager).createCampaign(
          "Test Campaign",
          "Description",
          0, // Invalid pool
          Math.floor(Date.now() / 1000) + 3600,
          Math.floor(Date.now() / 1000) + (30 * 24 * 3600),
          0,
          ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
        )
      ).to.be.revertedWith("CrossEra: Invalid pool amount");

      // Start date in past
      await expect(
        crossEra.connect(campaignManager).createCampaign(
          "Test Campaign",
          "Description",
          poolAmount,
          Math.floor(Date.now() / 1000) - 3600, // Past start date
          Math.floor(Date.now() / 1000) + (30 * 24 * 3600),
          0,
          ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
        )
      ).to.be.revertedWith("CrossEra: Start date must be in future");

      // End date before start date
      const startDate = Math.floor(Date.now() / 1000) + 3600;
      await expect(
        crossEra.connect(campaignManager).createCampaign(
          "Test Campaign",
          "Description",
          poolAmount,
          startDate,
          startDate - 1, // End before start
          0,
          ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
        )
      ).to.be.revertedWith("CrossEra: End date must be after start date");
    });

    it("Should allow campaign activation", async function () {
      const { crossEra, mockToken, campaignManager } = await loadFixture(deployCrossEraFixture);
      
      const poolAmount = ethers.parseEther("1000");
      const startDate = Math.floor(Date.now() / 1000) + 10; // Start in 10 seconds
      const endDate = startDate + (30 * 24 * 3600);
      
      await mockToken.mint(campaignManager.address, poolAmount);
      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);

      // Create campaign
      await crossEra.connect(campaignManager).createCampaign(
        "Test Campaign",
        "Description",
        poolAmount,
        startDate,
        endDate,
        0,
        ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
      );

      // Wait for start time
      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine");

      // Activate campaign
      await expect(
        crossEra.connect(campaignManager).activateCampaign(1)
      ).to.emit(crossEra, "CampaignStatusChanged");

      const campaign = await crossEra.getCampaign(1);
      expect(campaign.active).to.be.true;
    });
  });

  describe("App Campaign Registration", function () {
    it("Should allow apps to register for active campaigns", async function () {
      const { crossEra, mockToken, campaignManager, developer1 } = await loadFixture(deployCrossEraFixture);
      
      // Register an app
      const appId = "testapp123";
      await crossEra.connect(developer1).registerApp(
        appId, "Test App", "Description", "Category", "https://test.com"
      );

      // Create and activate campaign
      const poolAmount = ethers.parseEther("1000");
      const startDate = Math.floor(Date.now() / 1000) + 10;
      const endDate = startDate + (30 * 24 * 3600);
      
      await mockToken.mint(campaignManager.address, poolAmount);
      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);
      
      await crossEra.connect(campaignManager).createCampaign(
        "Test Campaign", "Description", poolAmount, startDate, endDate, 0,
        ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
      );

      // Wait and activate
      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine");
      await crossEra.connect(campaignManager).activateCampaign(1);

      // Register app for campaign
      await expect(
        crossEra.connect(developer1).registerAppForCampaign(
          appId, 1, 0, ethers.keccak256(ethers.toUtf8Bytes("registration-data"))
        )
      ).to.emit(crossEra, "AppRegisteredForCampaign");
    });

    it("Should prevent registration for inactive campaigns", async function () {
      const { crossEra, mockToken, campaignManager, developer1 } = await loadFixture(deployCrossEraFixture);
      
      // Register an app
      const appId = "testapp123";
      await crossEra.connect(developer1).registerApp(
        appId, "Test App", "Description", "Category", "https://test.com"
      );

      // Create campaign (but don't activate)
      const poolAmount = ethers.parseEther("1000");
      const startDate = Math.floor(Date.now() / 1000) + 3600;
      const endDate = startDate + (30 * 24 * 3600);
      
      await mockToken.mint(campaignManager.address, poolAmount);
      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);
      
      await crossEra.connect(campaignManager).createCampaign(
        "Test Campaign", "Description", poolAmount, startDate, endDate, 0,
        ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
      );

      // Try to register for inactive campaign
      await expect(
        crossEra.connect(developer1).registerAppForCampaign(
          appId, 1, 0, ethers.keccak256(ethers.toUtf8Bytes("registration-data"))
        )
      ).to.be.revertedWith("CrossEra: Campaign not active");
    });
  });

  describe("Transaction Processing", function () {
    it("Should allow verifiers to process transactions", async function () {
      const { crossEra, mockToken, campaignManager, developer1, verifier } = await loadFixture(deployCrossEraFixture);
      
      // Setup: Register app, create and activate campaign, register app for campaign
      const appId = "testapp123";
      await crossEra.connect(developer1).registerApp(
        appId, "Test App", "Description", "Category", "https://test.com"
      );

      const poolAmount = ethers.parseEther("1000");
      const startDate = Math.floor(Date.now() / 1000) + 10;
      const endDate = startDate + (30 * 24 * 3600);
      
      await mockToken.mint(campaignManager.address, poolAmount);
      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);
      
      await crossEra.connect(campaignManager).createCampaign(
        "Test Campaign", "Description", poolAmount, startDate, endDate, 0,
        ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
      );

      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine");
      await crossEra.connect(campaignManager).activateCampaign(1);
      
      await crossEra.connect(developer1).registerAppForCampaign(
        appId, 1, 0, ethers.keccak256(ethers.toUtf8Bytes("registration-data"))
      );

      // Process transaction
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test-transaction"));
      const gasUsed = 100000;
      const gasPrice = ethers.parseUnits("20", "gwei");
      const transactionValue = ethers.parseEther("1");

      await expect(
        crossEra.connect(verifier).processTransaction(
          appId,
          1, // campaign ID
          txHash,
          gasUsed,
          gasPrice,
          transactionValue,
          0, // TransactionType.Transfer
          ethers.keccak256(ethers.toUtf8Bytes("additional-data"))
        )
      ).to.emit(crossEra, "TransactionProcessed");

      // Verify transaction was marked as processed
      expect(await crossEra.processedTransactions(txHash)).to.be.true;
      
      // Verify claimable rewards were updated
      const claimableRewards = await crossEra.getClaimableRewards(appId, 1);
      expect(claimableRewards).to.be.gt(0);
    });

    it("Should prevent non-verifiers from processing transactions", async function () {
      const { crossEra, developer1 } = await loadFixture(deployCrossEraFixture);
      
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test-transaction"));
      
      await expect(
        crossEra.connect(developer1).processTransaction(
          "testapp", 1, txHash, 100000, ethers.parseUnits("20", "gwei"), 
          ethers.parseEther("1"), 0, ethers.keccak256(ethers.toUtf8Bytes("data"))
        )
      ).to.be.revertedWith("CrossEra: Not verifier");
    });

    it("Should prevent duplicate transaction processing", async function () {
      const { crossEra, mockToken, campaignManager, developer1, verifier } = await loadFixture(deployCrossEraFixture);
      
      // Setup complete workflow
      const appId = "testapp123";
      await crossEra.connect(developer1).registerApp(
        appId, "Test App", "Description", "Category", "https://test.com"
      );

      const poolAmount = ethers.parseEther("1000");
      const startDate = Math.floor(Date.now() / 1000) + 10;
      const endDate = startDate + (30 * 24 * 3600);
      
      await mockToken.mint(campaignManager.address, poolAmount);
      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);
      
      await crossEra.connect(campaignManager).createCampaign(
        "Test Campaign", "Description", poolAmount, startDate, endDate, 0,
        ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
      );

      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine");
      await crossEra.connect(campaignManager).activateCampaign(1);
      
      await crossEra.connect(developer1).registerAppForCampaign(
        appId, 1, 0, ethers.keccak256(ethers.toUtf8Bytes("registration-data"))
      );

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test-transaction"));
      
      // First processing should succeed
      await crossEra.connect(verifier).processTransaction(
        appId, 1, txHash, 100000, ethers.parseUnits("20", "gwei"), 
        ethers.parseEther("1"), 0, ethers.keccak256(ethers.toUtf8Bytes("data"))
      );

      // Second processing should fail
      await expect(
        crossEra.connect(verifier).processTransaction(
          appId, 1, txHash, 100000, ethers.parseUnits("20", "gwei"), 
          ethers.parseEther("1"), 0, ethers.keccak256(ethers.toUtf8Bytes("data"))
        )
      ).to.be.revertedWith("CrossEra: Transaction already processed");
    });
  });

  describe("Reward Claiming", function () {
    it("Should allow app owners to claim rewards", async function () {
      const { crossEra, mockToken, campaignManager, developer1, verifier } = await loadFixture(deployCrossEraFixture);
      
      // Complete setup and process a transaction
      const appId = "testapp123";
      await crossEra.connect(developer1).registerApp(
        appId, "Test App", "Description", "Category", "https://test.com"
      );

      const poolAmount = ethers.parseEther("1000");
      const startDate = Math.floor(Date.now() / 1000) + 10;
      const endDate = startDate + (30 * 24 * 3600);
      
      await mockToken.mint(campaignManager.address, poolAmount);
      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);
      
      await crossEra.connect(campaignManager).createCampaign(
        "Test Campaign", "Description", poolAmount, startDate, endDate, 0,
        ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
      );

      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine");
      await crossEra.connect(campaignManager).activateCampaign(1);
      
      await crossEra.connect(developer1).registerAppForCampaign(
        appId, 1, 0, ethers.keccak256(ethers.toUtf8Bytes("registration-data"))
      );

      // Process transaction to generate rewards
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test-transaction"));
      await crossEra.connect(verifier).processTransaction(
        appId, 1, txHash, 100000, ethers.parseUnits("20", "gwei"), 
        ethers.parseEther("1"), 0, ethers.keccak256(ethers.toUtf8Bytes("data"))
      );

      // Fund contract with tokens for reward payout
      await mockToken.mint(await crossEra.getAddress(), ethers.parseEther("100"));

      // Get initial balance
      const initialBalance = await mockToken.balanceOf(developer1.address);
      const claimableAmount = await crossEra.getClaimableRewards(appId, 1);
      
      // Claim rewards
      await expect(
        crossEra.connect(developer1).claimRewards(appId, 1)
      ).to.emit(crossEra, "RewardClaimed")
        .withArgs(appId, 1, developer1.address, claimableAmount, anyValue, anyValue, anyValue);

      // Verify balance increased
      const finalBalance = await mockToken.balanceOf(developer1.address);
      expect(finalBalance).to.equal(initialBalance + claimableAmount);

      // Verify claimable rewards reset
      expect(await crossEra.getClaimableRewards(appId, 1)).to.equal(0);
    });

    it("Should prevent non-owners from claiming rewards", async function () {
      const { crossEra, developer1, developer2 } = await loadFixture(deployCrossEraFixture);
      
      const appId = "testapp123";
      await crossEra.connect(developer1).registerApp(
        appId, "Test App", "Description", "Category", "https://test.com"
      );

      await expect(
        crossEra.connect(developer2).claimRewards(appId, 1)
      ).to.be.revertedWith("CrossEra: Not app owner");
    });

    it("Should prevent claiming when no rewards available", async function () {
      const { crossEra, developer1 } = await loadFixture(deployCrossEraFixture);
      
      const appId = "testapp123";
      await crossEra.connect(developer1).registerApp(
        appId, "Test App", "Description", "Category", "https://test.com"
      );

      await expect(
        crossEra.connect(developer1).claimRewards(appId, 1)
      ).to.be.revertedWith("CrossEra: No rewards to claim");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update minimum reward amount", async function () {
      const { crossEra, admin } = await loadFixture(deployCrossEraFixture);
      
      const newMinReward = ethers.parseEther("0.2");
      
      await expect(
        crossEra.connect(admin).setMinRewardAmount(newMinReward)
      ).to.emit(crossEra, "ConfigurationUpdated");

      expect(await crossEra.minRewardAmount()).to.equal(newMinReward);
    });

    it("Should allow admin to pause/unpause contract", async function () {
      const { crossEra, admin } = await loadFixture(deployCrossEraFixture);
      
      // Pause
      await expect(
        crossEra.connect(admin).emergencyPause("Testing pause")
      ).to.emit(crossEra, "EmergencyAction");

      // Verify paused
      expect(await crossEra.paused()).to.be.true;

      // Unpause
      await expect(
        crossEra.connect(admin).emergencyUnpause("Testing unpause")
      ).to.emit(crossEra, "EmergencyAction");

      // Verify unpaused
      expect(await crossEra.paused()).to.be.false;
    });

    it("Should allow admin to emergency withdraw", async function () {
      const { crossEra, mockToken, admin } = await loadFixture(deployCrossEraFixture);
      
      // Fund contract
      await mockToken.mint(await crossEra.getAddress(), ethers.parseEther("100"));
      
      const initialBalance = await mockToken.balanceOf(admin.address);
      const withdrawAmount = ethers.parseEther("50");
      
      await expect(
        crossEra.connect(admin).emergencyWithdraw(
          await mockToken.getAddress(),
          withdrawAmount,
          "Emergency withdrawal test"
        )
      ).to.emit(crossEra, "EmergencyAction");

      const finalBalance = await mockToken.balanceOf(admin.address);
      expect(finalBalance).to.equal(initialBalance + withdrawAmount);
    });

    it("Should prevent non-admin from admin functions", async function () {
      const { crossEra, developer1 } = await loadFixture(deployCrossEraFixture);
      
      await expect(
        crossEra.connect(developer1).setMinRewardAmount(ethers.parseEther("0.2"))
      ).to.be.revertedWith("CrossEra: Not admin");

      await expect(
        crossEra.connect(developer1).emergencyPause("Test")
      ).to.be.revertedWith("CrossEra: Not admin");
    });
  });

  describe("View Functions", function () {
    it("Should return correct app and campaign information", async function () {
      const { crossEra, mockToken, campaignManager, developer1 } = await loadFixture(deployCrossEraFixture);
      
      // Register app
      const appId = "testapp123";
      await crossEra.connect(developer1).registerApp(
        appId, "Test App", "Description", "Category", "https://test.com"
      );

      // Create campaign
      const poolAmount = ethers.parseEther("1000");
      const startDate = Math.floor(Date.now() / 1000) + 3600;
      const endDate = startDate + (30 * 24 * 3600);
      
      await mockToken.mint(campaignManager.address, poolAmount);
      await mockToken.connect(campaignManager).approve(await crossEra.getAddress(), poolAmount);
      
      await crossEra.connect(campaignManager).createCampaign(
        "Test Campaign", "Description", poolAmount, startDate, endDate, 0,
        ethers.keccak256(ethers.toUtf8Bytes("test-rules"))
      );

      // Test view functions
      expect(await crossEra.appOwners(appId)).to.equal(developer1.address);
      expect(await crossEra.registeredApps(appId)).to.be.true;
      
      const campaign = await crossEra.getCampaign(1);
      expect(campaign.exists).to.be.true;
      expect(campaign.totalPool).to.equal(poolAmount);
      
      expect(await crossEra.totalApps()).to.equal(1);
      expect(await crossEra.totalCampaigns()).to.equal(1);
    });

    it("Should return correct transaction processing status", async function () {
      const { crossEra } = await loadFixture(deployCrossEraFixture);
      
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test-transaction"));
      
      // Initially not processed
      expect(await crossEra.isTransactionProcessed(txHash)).to.be.false;
      
      // After processing (would need full setup, but testing the view function)
      expect(await crossEra.processedTransactions(txHash)).to.be.false;
    });
  });

  // Helper function for any value matching in events
  function anyValue() {
    return true;
  }
});
