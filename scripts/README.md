# CrossEra Scripts

This folder contains deployment scripts, testing utilities, and helper tools.

---

## 🚀 Deployment Scripts

### **Main Deployment**
- `deploy.js` - Deploy CrossEraRewardSystem contract
- `deploy-helloworld.js` - Deploy HelloWorld playground contract
- `test-deployment.js` - Test deployment functionality

---

## 🔐 Role Management Scripts

### **Grant Roles**
- `grant-role-fixed.js` - Grant CAMPAIGN_MANAGER_ROLE
- `grant-campaign-role.js` - Grant campaign-related roles
- `create-verifier-wallet.js` - Create and configure verifier wallet

---

## 🔍 Checking & Debugging Scripts

### **App Registration**
- `check-app-registration.js` - Check if app is registered on-chain
- `manual-register-app.js` - Manually register app to contract

### **Campaign Management**
- `check-campaign.js` - Check campaign status and details
- `check-campaign-role.js` - Verify CAMPAIGN_MANAGER_ROLE
- `debug-campaign-registration.js` - Debug campaign registration issues
- `debug-create-campaign.js` - Debug campaign creation

### **Leaderboard & Metrics**
- `check-leaderboard.js` - View campaign leaderboard data on-chain

### **Transaction Verification**
- `check-transaction.js` - Analyze transaction details
- `check-verifier-role.js` - Verify VERIFIER_ROLE is set

---

## 🧪 Testing Scripts

- `test-comprehensive.js` - Comprehensive test suite
- `test-simple.js` - Simple functionality tests
- `test-supabase.js` - Test Supabase connectivity

---

## 📖 How to Run

All scripts use Hardhat and connect to CrossFi Testnet:

```bash
# General format:
npx hardhat run scripts/SCRIPT_NAME.js --network crossfi_testnet

# Examples:
npx hardhat run scripts/check-leaderboard.js --network crossfi_testnet
npx hardhat run scripts/check-app-registration.js --network crossfi_testnet
npx hardhat run scripts/grant-role-fixed.js --network crossfi_testnet
```

### **With Arguments**

Some scripts accept command-line arguments:

```bash
# Check specific app:
npx hardhat run scripts/check-app-registration.js --network crossfi_testnet YOUR_APP_ID

# Check specific campaign:
npx hardhat run scripts/check-leaderboard.js --network crossfi_testnet 1

# Check specific transaction:
npx hardhat run scripts/check-transaction.js --network crossfi_testnet 0x...
```

---

## 🔧 Utility Scripts by Purpose

### **I want to...**

**...check if my app is registered:**
```bash
npx hardhat run scripts/check-app-registration.js --network crossfi_testnet
```

**...see the leaderboard:**
```bash
npx hardhat run scripts/check-leaderboard.js --network crossfi_testnet
```

**...verify a wallet has the right role:**
```bash
npx hardhat run scripts/check-campaign-role.js --network crossfi_testnet
npx hardhat run scripts/check-verifier-role.js --network crossfi_testnet
```

**...debug a transaction:**
```bash
npx hardhat run scripts/check-transaction.js --network crossfi_testnet 0xYOUR_TX_HASH
```

**...check campaign details:**
```bash
npx hardhat run scripts/check-campaign.js --network crossfi_testnet 1
```

---

## ⚙️ Configuration

All scripts use environment variables from `.env`:

Required variables:
- `PRIVATE_KEY` - Wallet private key (for signing)
- `VERIFIER_PRIVATE_KEY` - Verifier wallet key
- `RPC_URL` - CrossFi RPC endpoint

Network: CrossFi Testnet (Chain ID: 4157)

---

## 🎯 Common Workflows

### **Deploy New Contract**
```bash
npx hardhat run scripts/deploy.js --network crossfi_testnet
npx hardhat run scripts/grant-role-fixed.js --network crossfi_testnet
```

### **Verify Setup**
```bash
npx hardhat run scripts/check-campaign-role.js --network crossfi_testnet
npx hardhat run scripts/check-verifier-role.js --network crossfi_testnet
```

### **Debug Registration**
```bash
npx hardhat run scripts/check-app-registration.js --network crossfi_testnet
npx hardhat run scripts/check-transaction.js --network crossfi_testnet 0x...
```

### **View Leaderboard**
```bash
npx hardhat run scripts/check-leaderboard.js --network crossfi_testnet 1
```

---

## 📝 Script Descriptions

| Script | Purpose | Arguments |
|--------|---------|-----------|
| `deploy.js` | Deploy main contract | None |
| `deploy-helloworld.js` | Deploy playground contract | None |
| `check-app-registration.js` | Check app on-chain status | Optional: app_id |
| `check-campaign.js` | View campaign details | Optional: campaign_id |
| `check-leaderboard.js` | Show campaign leaderboard | Optional: campaign_id |
| `check-transaction.js` | Analyze transaction | Optional: tx_hash |
| `check-campaign-role.js` | Verify campaign manager role | Optional: address |
| `check-verifier-role.js` | Verify verifier role | None |
| `create-verifier-wallet.js` | Generate verifier wallet | None |
| `grant-role-fixed.js` | Grant campaign manager role | None |
| `manual-register-app.js` | Register app manually | Edit script |

---

**All scripts are tested and ready to use!**

