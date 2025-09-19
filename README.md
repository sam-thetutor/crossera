# 🌟 CrossEra Reward System

> **A complete blockchain-based reward system for CrossFi applications**

Developers can register apps, send transactions with tracking, verify transactions, and earn XFI rewards automatically through smart contracts.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-crossera.vercel.app-blue?style=for-the-badge)](https://crossera.vercel.app/)
[![NPM Package](https://img.shields.io/badge/NPM-crossera--verifier--sdk-red?style=for-the-badge)](https://www.npmjs.com/package/crossera-verifier-sdk)
[![CrossFi Network](https://img.shields.io/badge/Network-CrossFi%20Testnet-purple?style=for-the-badge)](https://crossfi.org/)

## 🎯 Overview

The CrossEra Reward System is a comprehensive blockchain solution that incentivizes developers to build on CrossFi by providing automatic XFI rewards for verified transactions.

### 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart         │    │   NPM SDK       │
│   (Next.js)     │◄──►│   Contract      │◄──►│   (TypeScript)  │
│                 │    │   (Solidity)    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   Verifier API  │◄─────────────┘
                        │   (Next.js API) │
                        └─────────────────┘
```

## ✨ Features

### 🚀 **For Developers**
- **App Registration**: Get unique App IDs for transaction tracking
- **Automatic Rewards**: Earn 0.1+ XFI for verified transactions
- **Real-time Verification**: Submit transaction hashes for instant rewards
- **Wallet Integration**: Seamless MetaMask/Web3 wallet connection
- **Reward Claiming**: Withdraw accumulated XFI directly to wallet

### 📊 **For Users**
- **Transaction Tracking**: Monitor all reward-eligible transactions
- **Leaderboard**: View top developers and apps by rewards earned
- **Balance Management**: Track and claim accumulated rewards
- **Historical Data**: View complete transaction verification history

### 🛠️ **For Integrators**
- **NPM SDK**: Easy integration with `crossera-verifier-sdk`
- **REST API**: Direct HTTP endpoints for verification
- **TypeScript Support**: Full type safety and autocompletion
- **React Hooks**: Ready-to-use React components and hooks

## 🏁 Quick Start

### 1. **Try the Live Demo**

Visit **[crossera.vercel.app](https://crossera.vercel.app/)** to:
- Connect your CrossFi wallet (MetaMask)
- Register an app and get an App ID
- Send test transactions with rewards
- Verify transactions and claim XFI

### 2. **Integrate with NPM SDK**

```bash
npm install crossera-verifier-sdk
```

```typescript
import { CrossEraVerifier } from 'crossera-verifier-sdk';

const verifier = new CrossEraVerifier({ network: 'testnet' });

// Generate App ID
const appId = verifier.generateAppId();

// Verify transaction and earn rewards
const result = await verifier.verifyTransaction({
  transactionHash: 'YOUR_TX_HASH',
  appId: 'YOUR_APP_ID'
});
```

### 3. **Use Direct API**

```bash
curl -X POST https://crossera.vercel.app/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_hash": "YOUR_TX_HASH",
    "app_id": "YOUR_APP_ID"
  }'
```

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: Version 18+ required
- **Hardhat**: For smart contract development
- **CrossFi Wallet**: MetaMask configured for CrossFi network
- **Git**: For version control

### 1. Clone & Install

```bash
git clone https://github.com/sam-thetutor/crossera.git
cd crossera

# Install dependencies
npm install
```

### 2. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🎯 Reward System

### How Rewards Work

1. **Transaction Requirements**:
   - Must be a valid CrossFi transaction
   - Must include registered App ID in transaction data or logs
   - Must pay transaction fees

2. **Reward Calculation**:
   ```typescript
   // Minimum reward: 0.1 XFI (100000000000000000 wei)
   // Gas-based reward: max(0.1 XFI, gas_used * gas_price * 0.1)
   const reward = Math.max(100000000000000000n, (gasUsed * gasPrice) / 10n);
   ```

3. **Verification Process**:
   - Fetch transaction from CrossFi RPC
   - Validate transaction includes registered App ID
   - Check transaction hasn't been processed before
   - Submit reward to smart contract
   - Update app balance for claiming

## 🔧 Configuration

### Network Configuration

**CrossFi Testnet (Default):**
- RPC URL: `https://rpc.testnet.crossfi.org`
- Chain ID: `4157`
- Currency Symbol: `XFI`
- Block Explorer: `https://scan.testnet.crossfi.org`

**CrossFi Mainnet:**
- RPC URL: `https://rpc.crossfi.org`
- Chain ID: `4158`
- Currency Symbol: `XFI`
- Block Explorer: `https://scan.crossfi.org`

## 🎯 Roadmap

### Phase 1: Core System 🚧
- [ ] Smart contract development (Solidity)
- [ ] Frontend application adaptation
- [ ] Verifier API for CrossFi
- [ ] NPM SDK package

### Phase 2: Enhanced Features 📋
- [ ] Leaderboard system
- [ ] App name management
- [ ] Dynamic data fetching
- [ ] Testnet deployment

### Phase 3: Advanced Features 📋
- [ ] Mainnet deployment
- [ ] Advanced reward algorithms
- [ ] Multi-token support (ERC-20)
- [ ] Developer analytics dashboard

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CrossFi Foundation**: For the innovative EVM-compatible blockchain platform
- **Ethereum Community**: For the robust smart contract standards
- **Community**: For feedback and contributions
- **Developers**: For building the CrossFi ecosystem

---

<div align="center">

**Built with ❤️ for the CrossFi ecosystem**

[🌟 Star on GitHub](https://github.com/sam-thetutor/crossera) • [🚀 Try Live Demo](https://crossera.vercel.app/) • [📦 Use NPM SDK](https://www.npmjs.com/package/crossera-verifier-sdk)

</div>
