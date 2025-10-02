# 🚀 Quick Deployment Guide - Phase 1

## ⚡ Deploy in 5 Minutes

### **Prerequisites**
- [ ] Node.js installed
- [ ] CrossFi testnet XFI in your wallet (for gas)
- [ ] Private key ready

---

## **Step 1: Create `.env` File** (30 seconds)

Create a file named `.env` in the project root:

```bash
PRIVATE_KEY=your_private_key_without_0x_prefix
XFI_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
```

**⚠️ IMPORTANT:**
- Replace `your_private_key_without_0x_prefix` with your actual private key
- Do NOT include the `0x` prefix in the private key
- The `0x000...` address will deploy a mock XFI token for testing

---

## **Step 2: Get Testnet XFI** (1 minute)

Get your wallet address:
```bash
# Your deployer address will be shown when you run the deployment
# Or use MetaMask to see your address
```

Get XFI from faucet:
- Visit CrossFi testnet faucet (check CrossFi docs)
- Request at least 1 XFI for gas fees

---

## **Step 3: Deploy Contract** (2 minutes)

Run the deployment command:

```bash
npx hardhat run scripts/deploy.js --network crossfi_testnet
```

---

## **Step 4: Save Output** (1 minute)

The deployment will output something like:

```
✅ CrossEra Reward System deployed to: 0xABCD1234...
🪙 Mock XFI Token deployed to: 0xEFGH5678...
```

**📋 Copy these addresses and save them:**

1. Update `.env.local`:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xABCD1234...
NEXT_PUBLIC_XFI_TOKEN_ADDRESS=0xEFGH5678...
```

2. Update `/src/lib/serverConfig.ts`:
```typescript
export const SERVER_CONFIG = {
  contractAddress: '0xABCD1234...', // ← Update this
  rpcUrl: 'https://rpc.testnet.ms/',
  network: 'testnet',
  minRewardAmount: '100000000000000000'
};
```

---

## **Step 5: Verify Deployment** (30 seconds)

Test the contract:

```bash
# Using Hardhat console
npx hardhat console --network crossfi_testnet
```

```javascript
const contract = await ethers.getContractAt(
  "CrossEraRewardSystem", 
  "0xABCD1234..." // Your contract address
);

// Check total apps (should be 0)
await contract.totalApps(); 

// Check admin address
const [deployer] = await ethers.getSigners();
console.log("Admin:", deployer.address);
```

---

## **✅ Success Checklist**

After successful deployment, you should have:

- [x] CrossEra contract deployed and verified
- [x] Mock XFI token deployed (for testing)
- [x] Contract address saved
- [x] Environment variables updated
- [x] Confirmed deployment on CrossFi explorer

---

## **🔗 Useful Links**

- **CrossFi Testnet Explorer:** https://scan.testnet.crossfi.org
- **RPC URL:** https://rpc.testnet.ms/
- **Chain ID:** 4157

---

## **🧪 Quick Test**

Register your first app:

```bash
npx hardhat console --network crossfi_testnet
```

```javascript
const contract = await ethers.getContractAt(
  "CrossEraRewardSystem", 
  "YOUR_CONTRACT_ADDRESS"
);

// Register an app
const tx = await contract.registerApp("my-first-app");
await tx.wait();

console.log("✅ App registered!");

// Check total apps (should be 1)
const total = await contract.totalApps();
console.log("Total apps:", total.toString());

// Get your apps
const [deployer] = await ethers.getSigners();
const myApps = await contract.getDeveloperApps(deployer.address);
console.log("My apps:", myApps);
```

---

## **❌ Troubleshooting**

### **Error: "insufficient funds"**
→ Get more XFI from testnet faucet

### **Error: "nonce too low"**
→ Clear your wallet cache or wait a few seconds

### **Error: "Contract not found"**
→ Check you're using the correct network: `crossfi_testnet`

### **Error: "App already registered"**
→ Choose a different app_id

---

## **📊 What Changed in Phase 1?**

| Feature | Before | After |
|---------|--------|-------|
| registerApp params | 5 params | 1 param (appId only) |
| Gas cost | ~200k gas | ~80k gas |
| Storage | All metadata on-chain | Only appId + owner |
| Query by address | ❌ Not possible | ✅ getDeveloperApps() |

---

## **🎯 Next: Phase 2 - Supabase Setup**

After deployment, you'll:
1. Setup Supabase database
2. Create `projects` table
3. Build registration API
4. Create dashboard UI

**Phase 1 Complete! 🎉**

