# 🚀 CrossEra Deployment Information

## ✅ Deployment Status: SUCCESS

**Deployed on:** CrossFi Testnet  
**Date:** October 1, 2025  
**Network:** crossfi_testnet  
**Chain ID:** 4157

---

## 📝 Contract Addresses

### **CrossEra Reward System**
```
0x2a2399Eb13Ba518c241596B38D99Bdb4d6968244
```

### **Mock XFI Token (for testing)**
```
0x4e1ddF0808D8c0908568Afd1e76374eEeBf896C1
```

### **Admin/Deployer Address**
```
0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7
```

---

## 🔐 Role Identifiers

### **VERIFIER_ROLE**
```
0x0ce23c3e399818cfee81a7ab0880f714e53d7672b08df0fa62f2843416e1ea09
```

### **CAMPAIGN_MANAGER_ROLE**
```
0x5022544358ee0bece556b72ae8983c7f24341bd5b9483ce8a19bff5efbb2de92
```

---

## 🔗 Explorer Links

- **CrossEra Contract:** https://scan.testnet.crossfi.org/address/0x2a2399Eb13Ba518c241596B38D99Bdb4d6968244
- **Mock XFI Token:** https://scan.testnet.crossfi.org/address/0x4e1ddF0808D8c0908568Afd1e76374eEeBf896C1
- **Admin Address:** https://scan.testnet.crossfi.org/address/0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7

---

## ⚙️ Contract Configuration

- **Min Reward Amount:** 0.1 XFI
- **Total Apps:** 0
- **Total Campaigns:** 0
- **Initial Token Supply:** 1,000,000 XFI (Mock)
- **Tokens Minted to Deployer:** 10,000 XFI

---

## 📋 Update These Files

### **1. Environment Variables (`.env.local`)**

Create or update `.env.local`:

```bash
# Contract Addresses
NEXT_PUBLIC_CONTRACT_ADDRESS=0x2a2399Eb13Ba518c241596B38D99Bdb4d6968244
NEXT_PUBLIC_XFI_TOKEN_ADDRESS=0x4e1ddF0808D8c0908568Afd1e76374eEeBf896C1

# Network Configuration
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_CHAIN_ID=4157
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.ms/

# Admin Configuration
NEXT_PUBLIC_ADMIN_ADDRESS=0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7
```

### **2. Server Configuration (`/src/lib/serverConfig.ts`)**

Update the file with:

```typescript
export const SERVER_CONFIG = {
  contractAddress: '0x2a2399Eb13Ba518c241596B38D99Bdb4d6968244',
  tokenAddress: '0x4e1ddF0808D8c0908568Afd1e76374eEeBf896C1',
  rpcUrl: 'https://rpc.testnet.ms/',
  network: 'testnet',
  chainId: 4157,
  minRewardAmount: '100000000000000000', // 0.1 XFI
  adminAddress: '0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7'
};
```

### **3. Contract Addresses (`/src/lib/contracts.ts`)**

Update with:

```typescript
export const CONTRACT_ADDRESSES = {
  testnet: {
    crossEraRewardSystem: '0x2a2399Eb13Ba518c241596B38D99Bdb4d6968244',
    xfiToken: '0x4e1ddF0808D8c0908568Afd1e76374eEeBf896C1'
  },
  mainnet: {
    crossEraRewardSystem: '', // To be deployed
    xfiToken: '' // To be set
  }
};
```

---

## 🧪 Test the Contract

### **Get Mock XFI Tokens (Faucet)**

```javascript
// Using Hardhat console
npx hardhat console --network crossfi_testnet

const token = await ethers.getContractAt(
  "MockXFIToken",
  "0x4e1ddF0808D8c0908568Afd1e76374eEeBf896C1"
);

// Get free test tokens (100 XFI)
const tx = await token.faucet();
await tx.wait();

// Check balance
const [signer] = await ethers.getSigners();
const balance = await token.balanceOf(signer.address);
console.log("Balance:", ethers.formatEther(balance), "XFI");
```

### **Register Your First App**

```javascript
const crossEra = await ethers.getContractAt(
  "CrossEraRewardSystem",
  "0x2a2399Eb13Ba518c241596B38D99Bdb4d6968244"
);

// Register an app (only appId needed on-chain)
const tx = await crossEra.registerApp("my-first-app");
await tx.wait();
console.log("✅ App registered!");

// Get your apps
const [deployer] = await ethers.getSigners();
const myApps = await crossEra.getDeveloperApps(deployer.address);
console.log("My apps:", myApps);

// Check total apps
const total = await crossEra.totalApps();
console.log("Total apps on platform:", total.toString());
```

### **Create a Campaign (Admin Only)**

```javascript
// Approve token spending first
const token = await ethers.getContractAt(
  "MockXFIToken",
  "0x4e1ddF0808D8c0908568Afd1e76374eEeBf896C1"
);

const crossEra = await ethers.getContractAt(
  "CrossEraRewardSystem",
  "0x2a2399Eb13Ba518c241596B38D99Bdb4d6968244"
);

// Approve 1000 XFI for campaign pool
const approveTx = await token.approve(
  "0x2a2399Eb13Ba518c241596B38D99Bdb4d6968244",
  ethers.parseEther("1000")
);
await approveTx.wait();

// Create campaign
const startDate = Math.floor(Date.now() / 1000) + 3600; // Start in 1 hour
const endDate = startDate + (30 * 24 * 3600); // End in 30 days

const campaignTx = await crossEra.createCampaign(
  "Launch Campaign",
  "Initial reward campaign for early adopters",
  ethers.parseEther("1000"), // 1000 XFI pool
  startDate,
  endDate,
  0, // Proportional rewards
  ethers.ZeroHash // IPFS hash placeholder
);
await campaignTx.wait();

console.log("✅ Campaign created!");
const totalCampaigns = await crossEra.totalCampaigns();
console.log("Total campaigns:", totalCampaigns.toString());
```

---

## 🎯 Next Steps

### **Immediate Actions:**

1. ✅ **Contract Deployed** ← DONE
2. ⏭️ **Update Frontend Configuration** (see above)
3. ⏭️ **Setup Supabase Database** (Phase 2)
4. ⏭️ **Create Project Registration API**
5. ⏭️ **Build Dashboard UI**

### **Phase 2: Supabase Integration**

Now that the contract is deployed, you can:

1. Create Supabase project
2. Setup `projects` table schema
3. Build API routes for registration
4. Create frontend registration form
5. Display projects from Supabase on dashboard

---

## 📊 Deployment Statistics

- **Gas Used:** ~3.2M gas (contract deployment)
- **Deployment Cost:** ~0.016 XFI
- **Contract Size:** Within limits
- **Optimization:** Enabled (200 runs)

---

## 🔒 Security Notes

- ✅ Admin role assigned to deployer
- ✅ ReentrancyGuard enabled
- ✅ Pausable for emergencies
- ✅ Role-based access control active
- ⚠️ Keep private key secure
- ⚠️ This is a testnet deployment (mock token)

---

## 📞 Support & Resources

- **Network:** CrossFi Testnet
- **RPC URL:** https://rpc.testnet.ms/
- **Explorer:** https://scan.testnet.crossfi.org
- **Chain ID:** 4157
- **Docs:** See `PHASE1_COMPLETE.md` and `COMPREHENSIVE_ARCHITECTURE_README.md`

---

## ✨ What Changed from Original

| Feature | Original | New (Phase 1) |
|---------|----------|---------------|
| registerApp params | 5 params | 1 param (appId only) |
| Gas cost | ~200k | ~80k (60% reduction) |
| Storage | All metadata | appId + owner only |
| Developer tracking | ❌ None | ✅ getDeveloperApps() |
| Metadata location | On-chain | Supabase (off-chain) |

---

**Deployment Status: ✅ COMPLETE**  
**Ready for Phase 2: Supabase Integration**

🎉 Congratulations! Your contract is live on CrossFi Testnet!

