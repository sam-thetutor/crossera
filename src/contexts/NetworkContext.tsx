'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NETWORK_CONFIGS, DEFAULT_NETWORK, type NetworkType } from '@/lib/contracts';

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  isTestnet: boolean;
  isMainnet: boolean;
  networkConfig: typeof NETWORK_CONFIGS[NetworkType];
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<NetworkType>(DEFAULT_NETWORK);

  const setNetwork = (newNetwork: NetworkType) => {
    setNetworkState(newNetwork);
    // Store in localStorage for persistence
    localStorage.setItem('crossera-network', newNetwork);
  };

  useEffect(() => {
    // Load network preference from localStorage
    const savedNetwork = localStorage.getItem('crossera-network') as NetworkType;
    if (savedNetwork && NETWORK_CONFIGS[savedNetwork]) {
      setNetworkState(savedNetwork);
    }
  }, []);

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
