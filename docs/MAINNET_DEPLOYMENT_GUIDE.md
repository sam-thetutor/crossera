# 🚀 CrossFi Mainnet Deployment Guide

## ⚠️ IMPORTANT: This is for LIVE MAINNET deployment

**Before proceeding, ensure you have:**
- [ ] Sufficient XFI for deployment (~0.1-0.5 XFI)
- [ ] Tested deployment on testnet first
- [ ] Backed up your private key securely
- [ ] Verified all contract logic

---

## 📋 Pre-Deployment Checklist

### 1. **Environment Setup**
Create a `.env` file in the project root:

```bash
# CrossFi Mainnet Configuration
PRIVATE_KEY=your_private_key_without_0x_prefix
CROSSFI_MAINNET_RPC=https://rpc.crossfi.org
CROSSFI_MAINNET_CHAIN_ID=4158
MAINNET_GAS_PRICE=20000000000
MAINNET_GAS_LIMIT=3000000

# Frontend Configuration (update after deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_XFI_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_RPC_URL=https://rpc.crossfi.org
```

### 2. **Network Configuration**
Verify your `hardhat.config.js` has the correct mainnet settings:

```javascript
crossfi_mainnet: {
  url: "https://rpc.crossfi.org",
  chainId: 4158,
  accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY.replace(/^0x/, '')}`] : [],
  gasPrice: 20000000000, // 20 gwei
},
```

### 3. **Wallet Requirements**
- **Minimum Balance:** 0.1 XFI (for gas fees)
- **Recommended Balance:** 0.5 XFI (for gas + initial funding)
- **Private Key:** Must be the wallet you want as the contract admin

---

## 🚀 Deployment Steps

### Step 1: Test on Testnet First (REQUIRED)
```bash
# Deploy to testnet first to verify everything works
npx hardhat run scripts/deploy.js --network crossfi_testnet
```

### Step 2: Check Your Balance
```bash
# Check your wallet balance
npx hardhat console --network crossfi_mainnet
```
```javascript
const [deployer] = await ethers.getSigners();
const balance = await ethers.provider.getBalance(deployer.address);
console.log("Balance:", ethers.formatEther(balance), "XFI");
```

### Step 3: Deploy to Mainnet
```bash
# Deploy to CrossFi mainnet
npx hardhat run scripts/deploy-mainnet.js --network crossfi_mainnet
```

### Step 4: Verify Deployment
After deployment, you'll get output like:
```
✅ CrossEra Reward System deployed to: 0xABCD1234...
📁 Deployment info saved to: deployment-mainnet.json
```

### Step 5: Update Frontend Configuration
Update your frontend configuration files:

**1. Update `.env.local`:**
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xABCD1234... # Your deployed contract address
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_RPC_URL=https://rpc.crossfi.org
```

**2. Update `src/lib/contracts.ts`:**
```typescript
export const CONTRACT_CONFIG = {
  address: '0xABCD1234...', // Your deployed contract address
  abi: CrossEraRewardSystemABI,
  network: 'mainnet'
};
```

---

## 🔍 Post-Deployment Verification

### 1. **Check Contract on Explorer**
Visit: https://scan.crossfi.org/address/YOUR_CONTRACT_ADDRESS

### 2. **Verify Contract Functions**
```bash
npx hardhat console --network crossfi_mainnet
```
```javascript
const contract = await ethers.getContractAt(
  "CrossEraRewardSystem", 
  "YOUR_CONTRACT_ADDRESS"
);

// Check basic info
await contract.totalApps(); // Should be 0
await contract.totalCampaigns(); // Should be 0
await contract.minRewardAmount(); // Should be 0.1 XFI

// Check admin role
const [deployer] = await ethers.getSigners();
const adminRole = await contract.DEFAULT_ADMIN_ROLE();
const isAdmin = await contract.hasRole(adminRole, deployer.address);
console.log("Is Admin:", isAdmin); // Should be true
```

### 3. **Test App Registration**
```javascript
// Register a test app
const tx = await contract.registerApp("test-app-mainnet");
await tx.wait();
console.log("App registered successfully");

// Verify registration
const totalApps = await contract.totalApps();
console.log("Total apps:", totalApps.toString()); // Should be 1
```

---

## 💰 Initial Contract Funding

After deployment, you need to fund the contract for campaigns:

### Option 1: Direct Transfer
```bash
# Send XFI directly to contract address
# Use MetaMask or any wallet to send XFI to: YOUR_CONTRACT_ADDRESS
```

### Option 2: Programmatic Funding
```javascript
// Create first campaign with funding
const tx = await contract.createCampaign(
  Math.floor(Date.now() / 1000) + 86400, // Start in 24 hours
  Math.floor(Date.now() / 1000) + 86400 * 30, // End in 30 days
  { value: ethers.parseEther("100") } // Send 100 XFI as campaign pool
);
await tx.wait();
console.log("Campaign created with 100 XFI pool");
```

---

## 🔐 Role Management

Your deployer address has all roles by default:
- `DEFAULT_ADMIN_ROLE`: Full control
- `ADMIN_ROLE`: Administrative functions
- `VERIFIER_ROLE`: Transaction verification
- `CAMPAIGN_MANAGER_ROLE`: Campaign management

### Grant Roles to Other Addresses
```javascript
// Grant verifier role to another address
const verifierAddress = "0x..."; // Address to grant role to
const VERIFIER_ROLE = await contract.VERIFIER_ROLE();
await contract.grantRole(VERIFIER_ROLE, verifierAddress);
```

---

## 📊 Contract Monitoring

### 1. **Monitor Contract Balance**
```javascript
const contractBalance = await ethers.provider.getBalance("YOUR_CONTRACT_ADDRESS");
console.log("Contract balance:", ethers.formatEther(contractBalance), "XFI");
```

### 2. **Track Campaigns**
```javascript
const totalCampaigns = await contract.totalCampaigns();
console.log("Total campaigns:", totalCampaigns.toString());

// Get campaign details
const campaign = await contract.getCampaign(1); // Campaign ID 1
console.log("Campaign 1:", {
  totalPool: ethers.formatEther(campaign.totalPool),
  active: campaign.active,
  startDate: new Date(campaign.startDate * 1000),
  endDate: new Date(campaign.endDate * 1000)
});
```

---

## 🚨 Emergency Procedures

### 1. **Pause Contract**
```javascript
await contract.emergencyPause("Emergency maintenance");
```

### 2. **Unpause Contract**
```javascript
await contract.emergencyUnpause("Maintenance complete");
```

### 3. **Emergency Withdraw**
```javascript
// Only if absolutely necessary
await contract.emergencyWithdraw(
  ethers.parseEther("10"), // Amount to withdraw
  "Emergency withdrawal reason"
);
```

---

## 📞 Support & Resources

- **CrossFi Explorer:** https://scan.crossfi.org
- **CrossFi RPC:** https://rpc.crossfi.org
- **Chain ID:** 4158
- **Documentation:** Check CrossFi official docs

---

## ✅ Success Checklist

After successful mainnet deployment:

- [x] Contract deployed to mainnet
- [x] Contract verified on explorer
- [x] Admin roles confirmed
- [x] Test app registration works
- [x] Frontend configuration updated
- [x] Contract funded for campaigns
- [x] Backup deployment info saved
- [x] Team notified of deployment

---

## 🎉 Congratulations!

Your CrossEra Reward System is now live on CrossFi mainnet!

**Next Steps:**
1. Set up verifier service
2. Create first campaign
3. Onboard developers
4. Monitor system performance

**Remember:** This is a live mainnet deployment. All transactions cost real XFI and are permanent.
