// Import contract addresses
import { CONTRACT_ADDRESSES } from './contracts';

// Server-side configuration for API routes
export const SERVER_CONFIG = {
  rpcUrl: process.env.RPC_URL || 'https://rpc.testnet.ms/',
  contractAddress: process.env.CONTRACT_ADDRESS || CONTRACT_ADDRESSES.testnet,
  verifierSecret: process.env.VERIFIER_SECRET || 'default-secret-key',
  minRewardAmount: process.env.MIN_REWARD_AMOUNT || '100000000000000000', // 0.1 XFI
  network: process.env.NETWORK || 'testnet'
};

// Contract ABI - Import from compiled artifacts
import CrossEraArtifact from './cross-era-abi.json';
export const CROSS_ERA_REWARD_SYSTEM_ABI = CrossEraArtifact.abi;
