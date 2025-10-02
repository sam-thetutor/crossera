// Contract addresses and configuration for CrossFi networks
export const CONTRACT_ADDRESSES = {
  testnet: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || "0x6342e9382A422697D8B4DB77A1c3cc0ACE7327F7",
  mainnet: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET || "0x0000000000000000000000000000000000000000"
};

// Mock XFI Token address for testing
export const MOCK_XFI_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_XFI_TOKEN_ADDRESS || "0x4e1ddF0808D8c0908568Afd1e76374eEeBf896C1";

// HelloWorld contract for playground testing
export const HELLOWORLD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HELLOWORLD_ADDRESS || "0x41D1eC3f323AF3eC84c194F780fF2a6B89ae5BaB";

export const NETWORK_CONFIGS = {
  testnet: {
    chainId: 4157,
    name: 'CrossFi Testnet',
    rpcUrl: 'https://rpc.testnet.ms/',
    explorerUrl: 'https://scan.testnet.crossfi.org',
    nativeCurrency: {
      name: 'XFI',
      symbol: 'XFI',
      decimals: 18
    }
  },
  mainnet: {
    chainId: 4158,
    name: 'CrossFi Mainnet',
    rpcUrl: 'https://rpc.crossfi.org',
    explorerUrl: 'https://scan.crossfi.org',
    nativeCurrency: {
      name: 'XFI',
      symbol: 'XFI',
      decimals: 18
    }
  }
};

export const DEFAULT_NETWORK = 'testnet' as const;
export type NetworkType = keyof typeof NETWORK_CONFIGS;
