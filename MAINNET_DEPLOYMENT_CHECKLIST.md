# 🚀 CrossFi Mainnet Deployment Checklist

## ⚠️ CRITICAL: This is a LIVE MAINNET deployment

**Double-check everything before proceeding!**

---

## 📋 Pre-Deployment Checklist

### 1. **Environment Setup** ✅
- [ ] Create `.env` file with your private key
- [ ] Set `PRIVATE_KEY=your_key_without_0x_prefix`
- [ ] Verify CrossFi mainnet RPC URL: `https://rpc.crossfi.org`
- [ ] Confirm Chain ID: `4158`

### 2. **Wallet Requirements** ✅
- [ ] Wallet has at least **0.1 XFI** for gas fees
- [ ] Recommended: **0.5 XFI** total (gas + initial funding)
- [ ] Private key is secure and backed up
- [ ] Deployer address will be the contract admin

### 3. **Contract Verification** ✅
- [ ] Contracts compile successfully: `npx hardhat compile`
- [ ] Test deployment on testnet first
- [ ] Verify all contract logic is correct
- [ ] Review constructor parameters

### 4. **Network Configuration** ✅
- [ ] Hardhat config has correct mainnet settings
- [ ] RPC URL is accessible
- [ ] Gas price settings are appropriate (20 gwei)

---

## 🚀 Deployment Steps

### Step 1: Pre-Deployment Check
```bash
# Check your setup before deployment
npx hardhat run scripts/check-mainnet-setup.js --network crossfi_mainnet
```

**Expected output:**
```
✅ Network: CrossFi Mainnet (4158)
✅ Deployer: 0x...
✅ Balance: X.XX XFI
✅ Contract: Compiled successfully
🎯 Ready for Deployment!
```

### Step 2: Deploy to Mainnet
```bash
# Deploy CrossEra contract to CrossFi mainnet
npx hardhat run scripts/deploy-mainnet.js --network crossfi_mainnet
```

**Expected output:**
```
✅ CrossEra Reward System deployed to: 0x...
📁 Deployment info saved to: deployment-mainnet.json
🎉 MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY!
```

### Step 3: Verify Deployment
- [ ] Check contract on CrossFi Explorer: `https://scan.crossfi.org/address/YOUR_ADDRESS`
- [ ] Verify contract code matches your source
- [ ] Confirm admin role is assigned correctly

### Step 4: Test Contract Functions
```bash
npx hardhat console --network crossfi_mainnet
```

```javascript
// Test basic functions
const contract = await ethers.getContractAt("CrossEraRewardSystem", "YOUR_ADDRESS");
await contract.totalApps(); // Should be 0
await contract.totalCampaigns(); // Should be 0

// Test app registration
const tx = await contract.registerApp("test-app");
await tx.wait();
console.log("✅ App registration works");
```

### Step 5: Update Frontend Configuration
- [ ] Update `.env.local` with contract address
- [ ] Update `src/lib/contracts.ts` with new address
- [ ] Update `src/lib/serverConfig.ts` if needed
- [ ] Test frontend connection to mainnet

---

## 💰 Post-Deployment Setup

### 1. **Initial Funding**
- [ ] Send XFI to contract address for campaign pools
- [ ] Create first campaign with funding
- [ ] Test campaign creation and activation

### 2. **Role Management**
- [ ] Verify admin roles are correct
- [ ] Grant verifier role to service address (if needed)
- [ ] Grant campaign manager role to team members (if needed)

### 3. **Service Setup**
- [ ] Deploy verifier service with VERIFIER_ROLE
- [ ] Set up transaction monitoring
- [ ] Configure reward calculation service

---

## 🔍 Verification Commands

### Check Contract Status
```bash
npx hardhat console --network crossfi_mainnet
```
```javascript
const contract = await ethers.getContractAt("CrossEraRewardSystem", "YOUR_ADDRESS");

// Basic info
await contract.totalApps();
await contract.totalCampaigns();
await contract.minRewardAmount();

// Role verification
const [deployer] = await ethers.getSigners();
const adminRole = await contract.DEFAULT_ADMIN_ROLE();
const isAdmin = await contract.hasRole(adminRole, deployer.address);
console.log("Is Admin:", isAdmin);
```

### Check Contract Balance
```javascript
const balance = await ethers.provider.getBalance("YOUR_CONTRACT_ADDRESS");
console.log("Contract balance:", ethers.formatEther(balance), "XFI");
```

---

## 🚨 Emergency Contacts

**If something goes wrong:**
1. **Pause contract immediately:**
   ```javascript
   await contract.emergencyPause("Emergency - investigation needed");
   ```

2. **Check contract state:**
   ```javascript
   await contract.paused(); // Should return true if paused
   ```

3. **Contact team immediately**

---

## 📊 Success Metrics

After successful deployment, you should have:
- [x] Contract deployed at: `0x...`
- [x] Admin role assigned to: `0x...`
- [x] Contract verified on explorer
- [x] Basic functions tested
- [x] Frontend updated
- [x] Initial funding completed
- [x] Team notified

---

## 🎯 Final Checklist

**Before considering deployment complete:**
- [ ] All tests pass
- [ ] Contract is verified on explorer
- [ ] Frontend connects successfully
- [ ] Team has access to admin functions
- [ ] Emergency procedures are documented
- [ ] Monitoring is set up
- [ ] Documentation is updated

---

## 🎉 Congratulations!

**Your CrossEra Reward System is now live on CrossFi mainnet!**

**Remember:**
- This is a live mainnet deployment
- All transactions cost real XFI
- Changes are permanent
- Monitor the system closely

**Next Steps:**
1. Set up monitoring and alerts
2. Create first campaign
3. Onboard developers
4. Scale the system

---

**Deployment Date:** ___________  
**Contract Address:** ___________  
**Deployer Address:** ___________  
**Team Lead:** ___________  
