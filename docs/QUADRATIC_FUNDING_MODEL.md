# CrossEra Quadratic Funding Model

## Overview

This document outlines the quadratic funding model that combines **fees, unique users, and volume** to distribute campaign rewards more fairly and encourage broader user adoption.

---

## Current Model (Linear)

### Formula:
```
Reward = (70% × fees_share) + (30% × volume_share)

Where:
- fees_share = app_fees / total_campaign_fees
- volume_share = app_volume / total_campaign_volume
```

### Issues:
- ❌ Favors high-fee transactions (whales)
- ❌ Ignores user diversity and engagement
- ❌ Projects with few high-value users win over projects with many users
- ❌ Doesn't incentivize user acquisition

---

## Proposed Model (Quadratic Funding)

### Core Principle:
**Reward projects based on the BREADTH of their user base, not just transaction value**

### Three-Factor Formula:

```
Reward = Pool × [
    (40% × QF_fees) + 
    (30% × QF_volume) + 
    (30% × QF_users)
]

Where:
QF_fees   = sqrt(app_fees) / Σsqrt(all_app_fees)
QF_volume = sqrt(app_volume) / Σsqrt(all_app_volumes)
QF_users  = sqrt(unique_users) / Σsqrt(all_app_users)
```

### Why Square Root?

The square root function reduces the impact of large individual contributors and amplifies the signal from having many small contributors:

```
Linear:    1 user with 100 XFI  = 100 points
           10 users with 10 XFI = 100 points  ← Same!

Quadratic: 1 user with 100 XFI  = √100 = 10 points
           10 users with 10 XFI = 10×√10 = 31.6 points  ← 3x better!
```

---

## Example Calculation

### Scenario:
**Campaign Pool:** 1000 XFI

**Project A (Whale-focused):**
- Fees: 100 XFI
- Volume: 1000 XFI
- Unique Users: 5

**Project B (User-focused):**
- Fees: 50 XFI
- Volume: 500 XFI  
- Unique Users: 50

### Current Model (Linear):

**Project A:**
```
fees_share   = 100 / 150 = 66.7%
volume_share = 1000 / 1500 = 66.7%
reward = 1000 × [(70% × 66.7%) + (30% × 66.7%)] = 667 XFI
```

**Project B:**
```
fees_share   = 50 / 150 = 33.3%
volume_share = 500 / 1500 = 33.3%
reward = 1000 × [(70% × 33.3%) + (30% × 33.3%)] = 333 XFI
```

**Result:** Project A gets 2x rewards despite having 10x fewer users!

### Quadratic Model:

**Project A:**
```
sqrt(fees)   = √100 = 10
sqrt(volume) = √1000 = 31.62
sqrt(users)  = √5 = 2.24

QF_fees   = 10 / (10 + 7.07) = 58.6%
QF_volume = 31.62 / (31.62 + 22.36) = 58.6%
QF_users  = 2.24 / (2.24 + 7.07) = 24.1%

reward = 1000 × [(40% × 58.6%) + (30% × 58.6%) + (30% × 24.1%)]
       = 1000 × [23.4% + 17.6% + 7.2%]
       = 482 XFI
```

**Project B:**
```
sqrt(fees)   = √50 = 7.07
sqrt(volume) = √500 = 22.36
sqrt(users)  = √50 = 7.07

QF_fees   = 7.07 / (10 + 7.07) = 41.4%
QF_volume = 22.36 / (31.62 + 22.36) = 41.4%
QF_users  = 7.07 / (2.24 + 7.07) = 75.9%

reward = 1000 × [(40% × 41.4%) + (30% × 41.4%) + (30% × 75.9%)]
       = 1000 × [16.6% + 12.4% + 22.8%]
       = 518 XFI
```

**Result:** Project B gets MORE rewards (518 vs 482) due to having 10x more users! ✅

---

## Benefits of Quadratic Funding

### 1. **Encourages User Acquisition** 🎯
- Projects focus on getting more users, not just whales
- Broader adoption > high-value transactions

### 2. **Fairer Distribution** ⚖️
- Reduces whale dominance
- Rewards projects serving the community

### 3. **Aligned Incentives** 🤝
- Projects build for mass adoption
- Ecosystem grows faster with more users

### 4. **Sybil Resistance** 🛡️
- Square root makes creating fake users less profitable
- Diminishing returns on manipulation

### 5. **Better Signal** 📊
- User count = stronger product-market fit signal
- Engagement matters more than transaction size

---

## Implementation Options

### Option A: Update Current Contract ⚠️
**Pros:**
- All existing campaigns use new model
- Single codebase

**Cons:**
- Requires contract redeployment
- Existing campaign rewards would change
- Breaking change for current users

### Option B: New Campaign Type (Recommended) ✅
**Pros:**
- Backward compatible
- Sponsors choose funding model
- Gradual migration
- A/B testing

**Cons:**
- Two reward formulas to maintain
- Slightly more complex

---

## Recommended Approach

### **Phase 1: Add Campaign Type Field**

Add to campaigns:
```solidity
enum FundingModel { LINEAR, QUADRATIC }

struct CampaignCore {
    uint256 totalPool;
    uint256 distributedRewards;
    uint64 startDate;
    uint64 endDate;
    bool active;
    FundingModel fundingModel;  // ← NEW
}
```

### **Phase 2: Implement Quadratic Calculation**

```solidity
function calculateQuadraticReward(
    string memory appId,
    uint32 campaignId
) internal view returns (uint256) {
    // Get app metrics
    uint256 appFees = appCampaignFees[appId][campaignId];
    uint256 appVolume = appCampaignVolume[appId][campaignId];
    uint256 appUsers = appCampaignUserCount[appId][campaignId]; // NEW
    
    // Get campaign totals
    uint256 totalFees = campaignTotalFees[campaignId];
    uint256 totalVolume = campaignTotalVolume[campaignId];
    uint256 totalUsers = campaignTotalUsers[campaignId]; // NEW
    
    // Calculate square roots (using Babylonian method)
    uint256 sqrtAppFees = sqrt(appFees);
    uint256 sqrtAppVolume = sqrt(appVolume);
    uint256 sqrtAppUsers = sqrt(appUsers);
    
    // Calculate total square roots for normalization
    uint256 totalSqrtFees = calculateTotalSqrt(campaignId, "fees");
    uint256 totalSqrtVolume = calculateTotalSqrt(campaignId, "volume");
    uint256 totalSqrtUsers = calculateTotalSqrt(campaignId, "users");
    
    // Calculate shares using quadratic formula
    uint256 feesShare = (sqrtAppFees * 1e18) / totalSqrtFees;
    uint256 volumeShare = (sqrtAppVolume * 1e18) / totalSqrtVolume;
    uint256 usersShare = (sqrtAppUsers * 1e18) / totalSqrtUsers;
    
    // Combine with weights: 40% fees, 30% volume, 30% users
    CampaignCore storage campaign = campaigns[campaignId];
    uint256 reward = (
        (campaign.totalPool * 40 / 100 * feesShare / 1e18) +
        (campaign.totalPool * 30 / 100 * volumeShare / 1e18) +
        (campaign.totalPool * 30 / 100 * usersShare / 1e18)
    );
    
    return reward;
}
```

### **Phase 3: Update ClaimRewards Function**

```solidity
function claimRewards(string memory appId, uint32 campaignId) 
    external 
    returns (uint256) 
{
    CampaignCore storage campaign = campaigns[campaignId];
    
    // ... existing validation ...
    
    // Calculate reward based on campaign funding model
    uint256 rewardAmount;
    if (campaign.fundingModel == FundingModel.QUADRATIC) {
        rewardAmount = calculateQuadraticReward(appId, campaignId);
    } else {
        rewardAmount = calculateLinearReward(appId, campaignId);
    }
    
    // ... rest of claim logic ...
}
```

---

## Required Schema Changes

### 1. Track Unique Users Per Campaign

```solidity
// Add to contract state variables
mapping(string => mapping(uint32 => uint256)) public appCampaignUserCount;
mapping(uint32 => uint256) public campaignTotalUsers;
```

### 2. Update processTransaction Function

```solidity
function processTransaction(
    string memory appId,
    bytes32 txHash,
    uint256 gasUsed,
    uint256 gasPrice,
    uint256 transactionValue,
    bool isUniqueUser  // ← NEW parameter
) external onlyVerifier {
    // ... existing logic ...
    
    // Update user count if unique
    if (isUniqueUser) {
        uint32[] memory appCampaigns = appRegisteredCampaigns[appId];
        for (uint256 i = 0; i < appCampaigns.length; i++) {
            uint32 campaignId = appCampaigns[i];
            appCampaignUserCount[appId][campaignId]++;
            campaignTotalUsers[campaignId]++;
        }
    }
    
    // ... rest of logic ...
}
```

---

## Database Changes

### Update project_unique_users table:

```sql
-- Add campaign-specific user tracking
CREATE TABLE IF NOT EXISTS project_campaign_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    app_id VARCHAR(32) NOT NULL,
    campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
    user_address VARCHAR(42) NOT NULL,
    first_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    total_transactions INTEGER DEFAULT 1,
    total_fees VARCHAR(78) DEFAULT '0',
    total_volume VARCHAR(78) DEFAULT '0',
    UNIQUE(app_id, campaign_id, user_address)
);

-- Index for fast lookups
CREATE INDEX idx_project_campaign_users_app_campaign 
ON project_campaign_users(app_id, campaign_id);
```

---

## Migration Path

### Step 1: Deploy New Contract with Quadratic Support
- Add funding model enum
- Implement quadratic calculation
- Add user count tracking
- Keep backward compatibility

### Step 2: Update API & Backend
- Modify `/api/submit` to pass `isUniqueUser` flag
- Update database to track campaign-specific users
- Update reward calculation endpoints

### Step 3: Update Frontend
- Add "Funding Model" selector when creating campaigns
- Show quadratic vs linear badge on campaigns
- Display unique user counts on leaderboards
- Update reward calculations in UI

### Step 4: Gradual Rollout
- Existing campaigns continue with linear model
- New campaigns can choose quadratic
- Monitor and compare performance
- Gather feedback from developers

---

## Weight Distribution Options

### Option 1: Balanced (Recommended)
```
40% Fees
30% Volume
30% Unique Users
```
**Best for:** General use, balances all metrics

### Option 2: User-Centric
```
30% Fees
30% Volume
40% Unique Users
```
**Best for:** User acquisition campaigns

### Option 3: Activity-Focused
```
33.3% Fees
33.3% Volume
33.3% Unique Users
```
**Best for:** Fair equal weighting

---

## Expected Impact

### For Developers:
✅ Incentivized to acquire more users  
✅ Quality user base > whale users  
✅ Sustainable growth strategies  
✅ Better product-market fit  

### For Ecosystem:
✅ More diverse user bases  
✅ Broader adoption  
✅ Healthier competition  
✅ Stronger network effects  

### For Campaign Sponsors:
✅ Better ROI on campaigns  
✅ True ecosystem growth  
✅ More engaged communities  
✅ Measurable user acquisition  

---

## Sqrt Implementation in Solidity

```solidity
/**
 * @notice Calculate integer square root using Babylonian method
 * @param x Number to calculate square root of
 * @return y Square root of x
 */
function sqrt(uint256 x) internal pure returns (uint256 y) {
    if (x == 0) return 0;
    
    uint256 z = (x + 1) / 2;
    y = x;
    
    while (z < y) {
        y = z;
        z = (x / z + z) / 2;
    }
}
```

---

## Next Steps

### Immediate:
1. ✅ Document quadratic funding model (this file)
2. 🔄 Get community feedback on weights
3. 🔄 Decide on implementation approach (new contract vs upgrade)

### Short-term:
4. 🔄 Implement sqrt function in contract
5. 🔄 Add campaign funding model field
6. 🔄 Track unique users per campaign
7. 🔄 Update reward calculation logic

### Long-term:
8. 🔄 Deploy updated contract
9. 🔄 Migrate platform to support both models
10. 🔄 Create UI for choosing funding model
11. 🔄 Monitor and optimize weights

---

## Questions for Discussion

1. **Weight Distribution:** Which option (40/30/30, 30/30/40, or 33/33/33)?
2. **Implementation:** New contract or upgrade existing?
3. **Migration:** All campaigns or opt-in?
4. **Sybil Protection:** Additional measures needed?
5. **User Definition:** Address-based or wallet-based tracking?

---

## Comparison Table

| Metric | Linear Model | Quadratic Model |
|--------|-------------|-----------------|
| **Whale Impact** | High - 100 XFI = 100x reward | Low - 100 XFI = 10x reward |
| **User Acquisition** | Not incentivized | Highly incentivized |
| **Fairness** | Favors big players | Favors broad adoption |
| **Complexity** | Simple | Moderate (sqrt calc) |
| **Gas Cost** | Low | Slightly higher |
| **Manipulation** | Whale attacks | Sybil attacks (mitigated) |

---

## Conclusion

Quadratic funding better aligns incentives with ecosystem health by:
- Rewarding projects that serve more users
- Reducing whale dominance
- Encouraging genuine user acquisition
- Creating fairer competition

**Recommendation:** Implement as new campaign type with opt-in for sponsors.

---

**Status:** Proposal  
**Next:** Community feedback & decision on implementation approach

