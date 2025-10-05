// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CrossEra Reward System
 * @notice Event-driven reward system for CrossFi applications with minimal on-chain storage
 * @dev Uses comprehensive events for data indexing and off-chain analytics
 */
contract CrossEraRewardSystem is AccessControl, ReentrancyGuard, Pausable {

    // ==================== ROLES ====================
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant CAMPAIGN_MANAGER_ROLE = keccak256("CAMPAIGN_MANAGER_ROLE");

    // ==================== STRUCTS ====================
    struct CampaignCore {
        uint256 totalPool;
        uint256 distributedRewards;
        uint64 startDate;
        uint64 endDate;
        bool active;
    }

    // ==================== STATE VARIABLES ====================
    
    // Critical on-chain storage only
    mapping(string => address) public appOwners;              // app_id -> developer address
    mapping(string => bool) public registeredApps;            // app_id -> registration status
    mapping(address => string[]) public developerApps;        // developer -> array of app_ids
    mapping(bytes32 => bool) public processedTransactions;    // tx_hash -> processed status
    mapping(uint32 => CampaignCore) public campaigns;         // campaign_id -> campaign core data
    mapping(string => mapping(uint32 => uint256)) public claimableRewards; // app_id -> campaign_id -> claimable amount
    mapping(string => mapping(uint32 => bool)) public appCampaignRegistrations; // app_id -> campaign_id -> registered status
    mapping(uint32 => string[]) public campaignApps;          // campaign_id -> array of registered app_ids
    mapping(string => uint32[]) public appRegisteredCampaigns; // app_id -> array of campaign_ids
    
    // NEW: Proper claim tracking
    mapping(string => mapping(uint32 => bool)) public hasClaimed; // app_id -> campaign_id -> claimed status
    mapping(string => mapping(uint32 => uint256)) public claimedAmounts; // app_id -> campaign_id -> claimed amount
    
    // Cumulative metrics tracking per app per campaign
    mapping(string => mapping(uint32 => uint256)) public appCampaignFees;    // app → campaign → cumulative fees
    mapping(string => mapping(uint32 => uint256)) public appCampaignVolume;  // app → campaign → cumulative volume
    mapping(string => mapping(uint32 => uint256)) public appCampaignTxCount; // app → campaign → tx count
    
    // Campaign-wide totals for proportional reward calculation
    mapping(uint32 => uint256) public campaignTotalFees;     // campaign → total fees from all apps
    mapping(uint32 => uint256) public campaignTotalVolume;   // campaign → total volume from all apps
    mapping(uint32 => uint256) public campaignTotalTxCount;  // campaign → total tx count from all apps
    
    // Counters for validation and indexing
    uint32 public totalCampaigns;
    uint32 public totalApps;
    uint32 public totalDevelopers;
    
    // Reward configuration
    uint256 public minRewardAmount = 0.1 ether; // 0.1 XFI minimum reward

    // ==================== MODIFIERS ====================
    
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "CrossEra: Not admin");
        _;
    }

    modifier onlyVerifier() {
        require(hasRole(VERIFIER_ROLE, msg.sender), "CrossEra: Not verifier");
        _;
    }

    modifier onlyCampaignManager() {
        require(hasRole(CAMPAIGN_MANAGER_ROLE, msg.sender), "CrossEra: Not campaign manager");
        _;
    }

    modifier appExists(string memory appId) {
        require(registeredApps[appId], "CrossEra: App not registered");
        _;
    }

    modifier appOwnerOnly(string memory appId) {
        require(appOwners[appId] == msg.sender, "CrossEra: Not app owner");
        _;
    }

    modifier campaignExists(uint32 campaignId) {
        require(campaigns[campaignId].totalPool > 0, "CrossEra: Campaign not found");
        _;
    }

    // ==================== CONSTRUCTOR ====================
    
    constructor(address _admin) {
        require(_admin != address(0), "CrossEra: Invalid admin address");
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(VERIFIER_ROLE, _admin); // Admin can also verify initially
        _grantRole(CAMPAIGN_MANAGER_ROLE, _admin);
    }

    // ==================== APP MANAGEMENT FUNCTIONS ====================
    
    /**
     * @notice Register a new application (Minimal on-chain storage)
     * @param appId Unique application identifier
     * @dev All metadata (name, description, etc.) stored off-chain in Supabase
     */
    function registerApp(string memory appId) external whenNotPaused {
        require(bytes(appId).length > 0 && bytes(appId).length <= 32, "CrossEra: Invalid app ID length");
        require(!registeredApps[appId], "CrossEra: App already registered");
        require(appOwners[appId] == address(0), "CrossEra: App ID taken");

        // Check if this is developer's first app
        bool isNewDeveloper = developerApps[msg.sender].length == 0;
        
        // Minimal on-chain storage
        appOwners[appId] = msg.sender;
        registeredApps[appId] = true;
        developerApps[msg.sender].push(appId);
        totalApps++;

        if (isNewDeveloper) {
            totalDevelopers++;
        }
    }

    /**
     * @notice Update application information
     * @param appId Application identifier
     * @param newName New application name
     * @param newDescription New application description
     * @param newCategory New application category
     * @param newWebsiteUrl New application website URL
     */
    function updateApp(
        string memory appId,
        string memory newName,
        string memory newDescription,
        string memory newCategory,
        string memory newWebsiteUrl
    ) external appExists(appId) appOwnerOnly(appId) whenNotPaused {
        require(bytes(newName).length > 0 && bytes(newName).length <= 64, "CrossEra: Invalid app name length");
        // All app updates handled off-chain in database
    }

    /**
     * @notice Change application status
     * @param appId Application identifier
     * @param status New status (0=active, 1=paused, 2=deprecated)
     * @param reason Reason for status change
     */
    function changeAppStatus(
        string memory appId,
        uint8 status,
        string memory reason
    ) external appExists(appId) appOwnerOnly(appId) whenNotPaused {
        require(status <= 2, "CrossEra: Invalid status");
        // All status changes handled off-chain in database
    }

    // ==================== CAMPAIGN MANAGEMENT FUNCTIONS ====================
    
    /**
     * @notice Create a new campaign with minimal on-chain data
     * @param startDate Campaign start timestamp
     * @param endDate Campaign end timestamp
     * @dev Send native XFI with this transaction as the campaign pool
     */
    function createCampaign(
        uint64 startDate,
        uint64 endDate
    ) external payable onlyCampaignManager whenNotPaused returns (uint32) {
        require(msg.value > 0, "CrossEra: Invalid pool amount");
        require(startDate > block.timestamp, "CrossEra: Start date must be in future");
        require(endDate > startDate, "CrossEra: End date must be after start date");

        totalCampaigns++;
        uint32 campaignId = totalCampaigns;

        // Minimal on-chain storage
        campaigns[campaignId] = CampaignCore({
            totalPool: msg.value,
            distributedRewards: 0,
            startDate: startDate,
            endDate: endDate,
            active: false
        });

        return campaignId;
    }

    /**
     * @notice Activate a campaign
     * @param campaignId Campaign identifier
     */
    function activateCampaign(uint32 campaignId) 
        external 
        onlyCampaignManager 
        campaignExists(campaignId) 
        whenNotPaused 
    {
        CampaignCore storage campaign = campaigns[campaignId];
        require(!campaign.active, "CrossEra: Campaign already active");
        require(block.timestamp >= campaign.startDate, "CrossEra: Campaign not ready to start");
        require(block.timestamp <= campaign.endDate, "CrossEra: Campaign expired");

        campaign.active = true;
    }
    
    /**
     * @notice Deactivate a campaign
     * @param campaignId Campaign identifier
     */
    function deactivateCampaign(uint32 campaignId) 
        external 
        onlyCampaignManager 
        campaignExists(campaignId) 
        whenNotPaused 
    {
        CampaignCore storage campaign = campaigns[campaignId];
        require(campaign.active, "CrossEra: Campaign already inactive");

        campaign.active = false;
    }

    /**
     * @notice Register app for a campaign
     * @param appId Application identifier
     * @param campaignId Campaign identifier
     * @param registrationData Additional registration data
     * @dev Send native XFI with this transaction if registration fee required
     */
    function registerAppForCampaign(
        string memory appId,
        uint32 campaignId,
        bytes32 registrationData
    ) external payable appExists(appId) appOwnerOnly(appId) campaignExists(campaignId) whenNotPaused {
        CampaignCore storage campaign = campaigns[campaignId];
        require(campaign.active, "CrossEra: Campaign not active");
        require(block.timestamp >= campaign.startDate, "CrossEra: Campaign not started");
        require(block.timestamp <= campaign.endDate, "CrossEra: Campaign ended");
        
        // Prevent duplicate registration
        require(!appCampaignRegistrations[appId][campaignId], "CrossEra: App already registered for this campaign");
        
        // Mark as registered
        appCampaignRegistrations[appId][campaignId] = true;
        campaignApps[campaignId].push(appId);
        appRegisteredCampaigns[appId].push(campaignId);
        
        // msg.value is the registration fee (can be 0)
    }

    // ==================== TRANSACTION PROCESSING FUNCTIONS ====================
    
    /**
     * @notice Process a verified transaction and accumulate metrics for all registered campaigns
     * @param appId Application identifier
     * @param txHash Transaction hash
     * @param gasUsed Gas consumed by transaction
     * @param gasPrice Gas price used
     * @param transactionValue Transaction value
     */
    function processTransaction(
        string memory appId,
        bytes32 txHash,
        uint256 gasUsed,
        uint256 gasPrice,
        uint256 transactionValue
    ) external onlyVerifier appExists(appId) whenNotPaused {
        require(!processedTransactions[txHash], "CrossEra: Transaction already processed");
        require(txHash != bytes32(0), "CrossEra: Invalid transaction hash");

        // Mark transaction as processed
        processedTransactions[txHash] = true;

        // Calculate transaction fee
        uint256 feeGenerated = gasUsed * gasPrice;
        
        // Get all campaigns this app is registered for
        uint32[] memory registeredCampaigns = appRegisteredCampaigns[appId];
        
        // Update metrics for each active campaign the app is registered for
        for (uint256 i = 0; i < registeredCampaigns.length; i++) {
            uint32 campaignId = registeredCampaigns[i];
            CampaignCore storage campaign = campaigns[campaignId];
            
            // Only accumulate if campaign is active and within dates
            if (campaign.active && 
                block.timestamp >= campaign.startDate && 
                block.timestamp <= campaign.endDate) {
                
                // Update app's cumulative metrics for this campaign
                appCampaignFees[appId][campaignId] += feeGenerated;
                appCampaignVolume[appId][campaignId] += transactionValue;
                appCampaignTxCount[appId][campaignId] += 1;
                
                // Update campaign-wide totals
                campaignTotalFees[campaignId] += feeGenerated;
                campaignTotalVolume[campaignId] += transactionValue;
                campaignTotalTxCount[campaignId] += 1;
            }
        }
    }

    // ==================== REWARD CLAIMING FUNCTIONS ====================
    
    /**
     * @notice Claim proportional rewards for an app in a specific campaign
     * @param appId Application identifier
     * @param campaignId Campaign identifier
     * @dev Calculates proportional reward based on app's contribution to campaign
     */
    function claimRewards(string memory appId, uint32 campaignId) 
        external 
        appExists(appId) 
        appOwnerOnly(appId) 
        campaignExists(campaignId) 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        CampaignCore storage campaign = campaigns[campaignId];
        
        // Campaign must have ended to claim final rewards
        require(block.timestamp > campaign.endDate, "CrossEra: Campaign not ended yet");
        
        // Check app has contributions
        uint256 appFees = appCampaignFees[appId][campaignId];
        uint256 appVolume = appCampaignVolume[appId][campaignId];
        require(appFees > 0 || appVolume > 0, "CrossEra: No contributions to claim");
        
        // Check not already claimed using proper tracking
        require(!hasClaimed[appId][campaignId], "CrossEra: Already claimed");
        
        // Get campaign totals
        uint256 totalFees = campaignTotalFees[campaignId];
        uint256 totalVolume = campaignTotalVolume[campaignId];
        
        // Calculate proportional reward
        uint256 rewardAmount = 0;
        
        // 70% of pool distributed based on fees contribution
        if (totalFees > 0 && appFees > 0) {
            rewardAmount += (campaign.totalPool * 70 / 100) * appFees / totalFees;
        }
        
        // 30% of pool distributed based on volume contribution
        if (totalVolume > 0 && appVolume > 0) {
            rewardAmount += (campaign.totalPool * 30 / 100) * appVolume / totalVolume;
        }
        
        require(rewardAmount > 0, "CrossEra: No rewards calculated");
        
        // Mark as claimed using proper tracking
        hasClaimed[appId][campaignId] = true;
        claimedAmounts[appId][campaignId] = rewardAmount;
        
        // Update campaign distributed rewards
        campaign.distributedRewards += rewardAmount;
        
        // Transfer native XFI rewards to developer
        (bool success, ) = payable(msg.sender).call{value: rewardAmount}("");
        require(success, "CrossEra: XFI transfer failed");

        return rewardAmount;
    }

    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @notice Get claimable reward amount for an app in a campaign
     * @param appId Application identifier
     * @param campaignId Campaign identifier
     * @return Claimable reward amount
     */
    function getClaimableRewards(string memory appId, uint32 campaignId) 
        external 
        view 
        returns (uint256) 
    {
        return claimableRewards[appId][campaignId];
    }

    /**
     * @notice Check if a user has claimed rewards for a specific app and campaign
     * @param appId Application identifier
     * @param campaignId Campaign identifier
     * @return Whether the user has claimed rewards
     */
    function hasUserClaimed(string memory appId, uint32 campaignId) 
        external 
        view 
        returns (bool) 
    {
        return hasClaimed[appId][campaignId];
    }

    /**
     * @notice Get claimed amount for a specific app and campaign
     * @param appId Application identifier
     * @param campaignId Campaign identifier
     * @return Amount claimed
     */
    function getClaimedAmount(string memory appId, uint32 campaignId) 
        external 
        view 
        returns (uint256) 
    {
        return claimedAmounts[appId][campaignId];
    }

    // ==================== COMPREHENSIVE USER STATUS FUNCTIONS ====================
    
    /**
     * @notice Get comprehensive campaign status for a user across all campaigns
     * @param user User address
     * @return campaignIds Array of campaign IDs the user has apps in
     * @return appIds Array of app IDs owned by the user
     * @return estimatedRewards Array of estimated rewards for each app-campaign combination
     * @return hasClaimedFlags Array of claimed status for each app-campaign combination
     * @return userClaimedAmounts Array of claimed amounts for each app-campaign combination
     * @return feesGenerated Array of fees generated for each app-campaign combination
     * @return volumeGenerated Array of volume generated for each app-campaign combination
     */
    function getUserCampaignStatus(address user) 
        external 
        view 
        returns (
            uint32[] memory campaignIds,
            string[] memory appIds,
            uint256[] memory estimatedRewards,
            bool[] memory hasClaimedFlags,
            uint256[] memory userClaimedAmounts,
            uint256[] memory feesGenerated,
            uint256[] memory volumeGenerated
        ) 
    {
        string[] memory userAppIds = developerApps[user];
        
        if (userAppIds.length == 0) {
            // Return empty arrays if user has no apps
            return (
                new uint32[](0),
                new string[](0),
                new uint256[](0),
                new bool[](0),
                new uint256[](0),
                new uint256[](0),
                new uint256[](0)
            );
        }

        // Count total app-campaign combinations
        uint256 totalCombinations = 0;
        for (uint256 i = 0; i < userAppIds.length; i++) {
            string memory appId = userAppIds[i];
            uint32[] memory appCampaigns = appRegisteredCampaigns[appId];
            totalCombinations += appCampaigns.length;
        }

        // Initialize arrays
        campaignIds = new uint32[](totalCombinations);
        appIds = new string[](totalCombinations);
        estimatedRewards = new uint256[](totalCombinations);
        hasClaimedFlags = new bool[](totalCombinations);
        userClaimedAmounts = new uint256[](totalCombinations);
        feesGenerated = new uint256[](totalCombinations);
        volumeGenerated = new uint256[](totalCombinations);

        uint256 index = 0;

        // Populate arrays with data for each app-campaign combination
        for (uint256 i = 0; i < userAppIds.length; i++) {
            string memory appId = userAppIds[i];
            uint32[] memory appCampaigns = appRegisteredCampaigns[appId];
            
            for (uint256 j = 0; j < appCampaigns.length; j++) {
                uint32 campaignId = appCampaigns[j];
                CampaignCore memory campaign = campaigns[campaignId];
                
                // Get app metrics for this campaign
                uint256 appFees = appCampaignFees[appId][campaignId];
                uint256 appVolume = appCampaignVolume[appId][campaignId];
                
                // Calculate estimated reward (70% fees + 30% volume)
                uint256 estimatedReward = 0;
                uint256 totalFees = campaignTotalFees[campaignId];
                uint256 totalVolume = campaignTotalVolume[campaignId];
                
                if (totalFees > 0 && appFees > 0) {
                    estimatedReward += (campaign.totalPool * 70 / 100) * appFees / totalFees;
                }
                if (totalVolume > 0 && appVolume > 0) {
                    estimatedReward += (campaign.totalPool * 30 / 100) * appVolume / totalVolume;
                }
                
                // Populate arrays
                campaignIds[index] = campaignId;
                appIds[index] = appId;
                estimatedRewards[index] = estimatedReward;
                hasClaimedFlags[index] = hasClaimed[appId][campaignId];
                userClaimedAmounts[index] = claimedAmounts[appId][campaignId];
                feesGenerated[index] = appFees;
                volumeGenerated[index] = appVolume;
                
                index++;
            }
        }
    }

    /**
     * @notice Check if a transaction has been processed
     * @param txHash Transaction hash
     * @return Whether transaction is processed
     */
    function isTransactionProcessed(bytes32 txHash) external view returns (bool) {
        return processedTransactions[txHash];
    }

    /**
     * @notice Get campaign core information
     * @param campaignId Campaign identifier
     * @return Campaign core data
     */
    function getCampaign(uint32 campaignId) external view returns (CampaignCore memory) {
        return campaigns[campaignId];
    }

    /**
     * @notice Get all app IDs owned by a developer
     * @param developer Developer address
     * @return Array of app IDs owned by the developer
     */
    function getDeveloperApps(address developer) external view returns (string[] memory) {
        return developerApps[developer];
    }

    /**
     * @notice Get total number of apps owned by a developer
     * @param developer Developer address
     * @return Number of apps owned by the developer
     */
    function getDeveloperAppCount(address developer) external view returns (uint256) {
        return developerApps[developer].length;
    }

    /**
     * @notice Check if a developer owns an app
     * @param developer Developer address
     * @param appId Application identifier
     * @return Whether the developer owns the app
     */
    function isDeveloperAppOwner(address developer, string memory appId) external view returns (bool) {
        return appOwners[appId] == developer;
    }

    /**
     * @notice Get all apps registered for a campaign
     * @param campaignId Campaign identifier
     * @return Array of app IDs registered for the campaign
     */
    function getCampaignApps(uint32 campaignId) external view returns (string[] memory) {
        return campaignApps[campaignId];
    }

    /**
     * @notice Get number of apps registered for a campaign
     * @param campaignId Campaign identifier
     * @return Number of registered apps
     */
    function getCampaignAppCount(uint32 campaignId) external view returns (uint256) {
        return campaignApps[campaignId].length;
    }

    /**
     * @notice Check if an app is registered for a campaign
     * @param appId Application identifier
     * @param campaignId Campaign identifier
     * @return Whether the app is registered for the campaign
     */
    function isAppRegisteredForCampaign(string memory appId, uint32 campaignId) external view returns (bool) {
        return appCampaignRegistrations[appId][campaignId];
    }

    /**
     * @notice Get all campaigns an app is registered for
     * @param appId Application identifier
     * @return Array of campaign IDs
     */
    function getAppRegisteredCampaigns(string memory appId) external view returns (uint32[] memory) {
        return appRegisteredCampaigns[appId];
    }

    /**
     * @notice Get app's cumulative metrics for a campaign
     * @param appId Application identifier
     * @param campaignId Campaign identifier
     * @return totalFees Total fees generated
     * @return totalVolume Total transaction volume
     * @return txCount Number of transactions
     * @return estimatedReward Estimated reward based on current metrics
     */
    function getAppCampaignMetrics(string memory appId, uint32 campaignId) 
        external 
        view 
        returns (
            uint256 totalFees,
            uint256 totalVolume,
            uint256 txCount,
            uint256 estimatedReward
        ) 
    {
        totalFees = appCampaignFees[appId][campaignId];
        totalVolume = appCampaignVolume[appId][campaignId];
        txCount = appCampaignTxCount[appId][campaignId];
        
        // Calculate estimated proportional reward
        CampaignCore storage campaign = campaigns[campaignId];
        uint256 campTotalFees = campaignTotalFees[campaignId];
        uint256 campTotalVolume = campaignTotalVolume[campaignId];
        
        estimatedReward = 0;
        
        // 70% based on fees contribution
        if (campTotalFees > 0 && totalFees > 0) {
            estimatedReward += (campaign.totalPool * 70 / 100) * totalFees / campTotalFees;
        }
        
        // 30% based on volume contribution
        if (campTotalVolume > 0 && totalVolume > 0) {
            estimatedReward += (campaign.totalPool * 30 / 100) * totalVolume / campTotalVolume;
        }
    }

    /**
     * @notice Get campaign-wide totals
     * @param campaignId Campaign identifier
     * @return totalFees Total fees from all apps
     * @return totalVolume Total volume from all apps
     * @return txCount Total transaction count
     */
    function getCampaignTotals(uint32 campaignId) 
        external 
        view 
        returns (
            uint256 totalFees,
            uint256 totalVolume,
            uint256 txCount
        ) 
    {
        return (
            campaignTotalFees[campaignId],
            campaignTotalVolume[campaignId],
            campaignTotalTxCount[campaignId]
        );
    }

    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @notice Set minimum reward amount
     * @param _minRewardAmount New minimum reward amount
     */
    function setMinRewardAmount(uint256 _minRewardAmount) external onlyAdmin {
        minRewardAmount = _minRewardAmount;
    }

    /**
     * @notice Emergency pause the contract
     * @param reason Reason for pausing
     */
    function emergencyPause(string memory reason) external onlyAdmin {
        _pause();
    }

    /**
     * @notice Unpause the contract
     * @param reason Reason for unpausing
     */
    function emergencyUnpause(string memory reason) external onlyAdmin {
        _unpause();
    }

    /**
     * @notice Emergency withdraw native XFI (admin only)
     * @param amount Amount to withdraw
     * @param reason Reason for withdrawal
     */
    function emergencyWithdraw(
        uint256 amount,
        string memory reason
    ) external onlyAdmin {
        require(amount <= address(this).balance, "CrossEra: Insufficient balance");
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "CrossEra: XFI transfer failed");
    }

}
