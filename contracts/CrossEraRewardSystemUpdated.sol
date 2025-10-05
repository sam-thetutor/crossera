// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CrossEra Reward System - Updated with Proper Claim Tracking
 * @notice Event-driven reward system for CrossFi applications with comprehensive claim tracking
 * @dev Uses comprehensive events for data indexing and off-chain analytics
 */
contract CrossEraRewardSystemUpdated is AccessControl, ReentrancyGuard, Pausable {

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

    struct AppCampaignClaimInfo {
        string appId;
        uint256 estimatedReward;
        bool hasClaimed;
        uint256 claimedAmount;
        uint256 feesGenerated;
        uint256 volumeGenerated;
        uint256 txCount;
    }

    struct UserCampaignStatus {
        uint32 campaignId;
        uint256 totalPool;
        uint256 distributedRewards;
        uint64 startDate;
        uint64 endDate;
        bool active;
        AppCampaignClaimInfo[] userApps;
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
        require(campaigns[campaignId].totalPool > 0, "CrossEra: Campaign does not exist");
        _;
    }

    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ==================== UPDATED CLAIM FUNCTION ====================
    
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
        
        // NEW: Check not already claimed using proper tracking
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
        
        // NEW: Mark as claimed using proper tracking
        hasClaimed[appId][campaignId] = true;
        claimedAmounts[appId][campaignId] = rewardAmount;
        
        // Update campaign distributed rewards
        campaign.distributedRewards += rewardAmount;
        
        // Transfer native XFI rewards to developer
        (bool success, ) = payable(msg.sender).call{value: rewardAmount}("");
        require(success, "CrossEra: XFI transfer failed");

        // Emit claim event for tracking
        emit RewardsClaimed(appId, campaignId, msg.sender, rewardAmount);

        return rewardAmount;
    }

    // ==================== NEW COMPREHENSIVE VIEW FUNCTIONS ====================
    
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

    /**
     * @notice Get comprehensive status for a user across all campaigns
     * @param user User address
     * @return Array of UserCampaignStatus structs
     */
    function getUserCampaignStatus(address user) 
        external 
        view 
        returns (UserCampaignStatus[] memory) 
    {
        string[] memory userAppIds = developerApps[user];
        if (userAppIds.length == 0) {
            return new UserCampaignStatus[](0);
        }

        // Count total campaigns the user has apps in
        uint256 totalUserCampaigns = 0;
        for (uint256 i = 0; i < userAppIds.length; i++) {
            string memory appId = userAppIds[i];
            uint32[] memory appCampaigns = appRegisteredCampaigns[appId];
            totalUserCampaigns += appCampaigns.length;
        }

        UserCampaignStatus[] memory result = new UserCampaignStatus[](totalCampaigns);
        uint256 resultIndex = 0;

        // Iterate through all campaigns
        for (uint32 campaignId = 1; campaignId <= totalCampaigns; campaignId++) {
            CampaignCore memory campaign = campaigns[campaignId];
            
            // Count user apps in this campaign
            uint256 userAppsInCampaign = 0;
            for (uint256 i = 0; i < userAppIds.length; i++) {
                string memory appId = userAppIds[i];
                if (appCampaignRegistrations[appId][campaignId]) {
                    userAppsInCampaign++;
                }
            }

            if (userAppsInCampaign > 0) {
                AppCampaignClaimInfo[] memory appInfos = new AppCampaignClaimInfo[](userAppsInCampaign);
                uint256 appIndex = 0;

                // Populate app information for this campaign
                for (uint256 i = 0; i < userAppIds.length; i++) {
                    string memory appId = userAppIds[i];
                    if (appCampaignRegistrations[appId][campaignId]) {
                        uint256 fees = appCampaignFees[appId][campaignId];
                        uint256 volume = appCampaignVolume[appId][campaignId];
                        uint256 txCount = appCampaignTxCount[appId][campaignId];
                        
                        // Calculate estimated reward
                        uint256 estimatedReward = 0;
                        uint256 totalFees = campaignTotalFees[campaignId];
                        uint256 totalVolume = campaignTotalVolume[campaignId];
                        
                        if (totalFees > 0 && fees > 0) {
                            estimatedReward += (campaign.totalPool * 70 / 100) * fees / totalFees;
                        }
                        if (totalVolume > 0 && volume > 0) {
                            estimatedReward += (campaign.totalPool * 30 / 100) * volume / totalVolume;
                        }

                        appInfos[appIndex] = AppCampaignClaimInfo({
                            appId: appId,
                            estimatedReward: estimatedReward,
                            hasClaimed: hasClaimed[appId][campaignId],
                            claimedAmount: claimedAmounts[appId][campaignId],
                            feesGenerated: fees,
                            volumeGenerated: volume,
                            txCount: txCount
                        });
                        appIndex++;
                    }
                }

                result[resultIndex] = UserCampaignStatus({
                    campaignId: campaignId,
                    totalPool: campaign.totalPool,
                    distributedRewards: campaign.distributedRewards,
                    startDate: campaign.startDate,
                    endDate: campaign.endDate,
                    active: campaign.active,
                    userApps: appInfos
                });
                resultIndex++;
            }
        }

        // Resize array to actual length
        UserCampaignStatus[] memory finalResult = new UserCampaignStatus[](resultIndex);
        for (uint256 i = 0; i < resultIndex; i++) {
            finalResult[i] = result[i];
        }

        return finalResult;
    }

    // ==================== EVENTS ====================
    
    event RewardsClaimed(
        string indexed appId,
        uint32 indexed campaignId,
        address indexed claimant,
        uint256 amount
    );

    // Include all other necessary functions from the original contract...
    // (App registration, transaction processing, campaign management, etc.)
}
