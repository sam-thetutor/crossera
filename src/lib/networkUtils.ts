import { NETWORK_CONFIGS } from './contracts';

export const CROSSFI_TESTNET_CHAIN_ID = 4157;
export const CROSSFI_MAINNET_CHAIN_ID = 4158;

/**
 * Add CrossFi network to MetaMask
 */
export async function addCrossFiNetwork(networkType: 'testnet' | 'mainnet' = 'testnet') {
  const config = NETWORK_CONFIGS[networkType];
  
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${config.chainId.toString(16)}`,
        chainName: config.name,
        nativeCurrency: config.nativeCurrency,
        rpcUrls: [config.rpcUrl],
        blockExplorerUrls: [config.explorerUrl]
      }]
    });
    return true;
  } catch (error) {
    console.error('Error adding network:', error);
    throw error;
  }
}

/**
 * Switch to CrossFi network
 */
export async function switchToCrossFiNetwork(networkType: 'testnet' | 'mainnet' = 'testnet') {
  const config = NETWORK_CONFIGS[networkType];
  const chainId = `0x${config.chainId.toString(16)}`;
  
  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
    return true;
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      // Try to add the network
      await addCrossFiNetwork(networkType);
      return true;
    }
    throw error;
  }
}

/**
 * Get current chain ID from MetaMask
 */
export async function getCurrentChainId(): Promise<number> {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }
  
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  return parseInt(chainId as string, 16);
}

/**
 * Check if user is on correct network
 */
export async function isOnCrossFiTestnet(): Promise<boolean> {
  try {
    const chainId = await getCurrentChainId();
    return chainId === CROSSFI_TESTNET_CHAIN_ID;
  } catch {
    return false;
  }
}

/**
 * Ensure user is on CrossFi Testnet, switch if needed
 */
export async function ensureCrossFiTestnet(): Promise<boolean> {
  const isCorrect = await isOnCrossFiTestnet();
  
  if (!isCorrect) {
    await switchToCrossFiNetwork('testnet');
    // Double check after switch
    return await isOnCrossFiTestnet();
  }
  
  return true;
}

