'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { NETWORK_CONFIGS, DEFAULT_NETWORK, type NetworkType } from '@/lib/contracts';
import { CROSSFI_MAINNET_CHAIN_ID, CROSSFI_TESTNET_CHAIN_ID } from '@/lib/networkUtils';

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  isTestnet: boolean;
  isMainnet: boolean;
  networkConfig: typeof NETWORK_CONFIGS[NetworkType];
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const chainId = useChainId();
  const [network, setNetworkState] = useState<NetworkType>(DEFAULT_NETWORK);

  // Auto-detect network based on actual wallet chain ID
  useEffect(() => {
    if (chainId) {
      if (chainId === CROSSFI_MAINNET_CHAIN_ID) {
        setNetworkState('mainnet');
      } else if (chainId === CROSSFI_TESTNET_CHAIN_ID) {
        setNetworkState('testnet');
      } else {
        // Unknown network, keep current state
        console.warn('Unknown chain ID:', chainId);
      }
    }
  }, [chainId]);

  const setNetwork = (newNetwork: NetworkType) => {
    setNetworkState(newNetwork);
    // Store in localStorage for persistence
    localStorage.setItem('crossera-network', newNetwork);
  };

  // Load initial network preference from localStorage (fallback)
  useEffect(() => {
    if (!chainId) {
      const savedNetwork = localStorage.getItem('crossera-network') as NetworkType;
      if (savedNetwork && NETWORK_CONFIGS[savedNetwork]) {
        setNetworkState(savedNetwork);
      }
    }
  }, [chainId]);

  const networkConfig = NETWORK_CONFIGS[network];
  const isTestnet = network === 'testnet';
  const isMainnet = network === 'mainnet';

  const value: NetworkContextType = {
    network,
    setNetwork,
    isTestnet,
    isMainnet,
    networkConfig,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
