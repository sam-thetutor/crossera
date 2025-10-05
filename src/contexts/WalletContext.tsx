'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { ensureCrossFiMainnet, CROSSFI_MAINNET_CHAIN_ID } from '@/lib/networkUtils';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  refreshBalance: () => void;
  isOnMainnet: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
    chainId: CROSSFI_MAINNET_CHAIN_ID, // Force mainnet chain ID
  });

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await connect({ connector: injected() });
      
      // Automatically switch to mainnet after connecting
      try {
        await ensureCrossFiMainnet();
      } catch (networkErr) {
        console.warn('Failed to switch to mainnet automatically:', networkErr);
        // Don't throw error here, just warn - user can switch manually
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    try {
      disconnect();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  };

  const balance = balanceData ? balanceData.formatted : '0';
  const isOnMainnet = chainId === CROSSFI_MAINNET_CHAIN_ID;

  const refreshBalance = () => {
    refetchBalance();
  };

  // Auto-switch to mainnet when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      // Add a small delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        ensureCrossFiMainnet().then(() => {
          // Refresh balance after switching to mainnet
          setTimeout(() => {
            refetchBalance();
          }, 1000);
        }).catch((err) => {
          console.warn('Failed to switch to mainnet automatically:', err);
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, refetchBalance]);

  // Listen for network changes and auto-switch to mainnet
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && isConnected) {
      const handleChainChanged = () => {
        // Auto-switch back to mainnet when user changes network
        setTimeout(() => {
          ensureCrossFiMainnet().then(() => {
            // Refresh balance after switching to mainnet
            setTimeout(() => {
              refetchBalance();
            }, 1000);
          }).catch((err) => {
            console.warn('Failed to switch to mainnet after chain change:', err);
          });
        }, 500);
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [isConnected]);

  const value: WalletContextType = {
    isConnected,
    address,
    balance,
    isLoading: isLoading || isPending,
    connect: connectWallet,
    disconnect: disconnectWallet,
    error,
    refreshBalance,
    isOnMainnet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
