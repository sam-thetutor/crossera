'use client';

import { useEffect, useState } from 'react';
import { getCurrentChainId, switchToCrossFiNetwork, CROSSFI_TESTNET_CHAIN_ID } from '@/lib/networkUtils';

export function NetworkWarning() {
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    checkNetwork();
    
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkNetwork);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkNetwork);
      }
    };
  }, []);

  const checkNetwork = async () => {
    try {
      const chainId = await getCurrentChainId();
      setWrongNetwork(chainId !== CROSSFI_TESTNET_CHAIN_ID);
    } catch (error) {
      console.error('Error checking network:', error);
    }
  };

  const handleSwitchNetwork = async () => {
    setSwitching(true);
    try {
      await switchToCrossFiNetwork('testnet');
      setWrongNetwork(false);
    } catch (error) {
      console.error('Error switching network:', error);
      alert('Failed to switch network. Please switch manually in MetaMask.');
    } finally {
      setSwitching(false);
    }
  };

  if (!wrongNetwork) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Wrong Network Detected
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-3">
              You're not connected to CrossFi Testnet. Please switch networks to use this application.
            </p>
            <button
              onClick={handleSwitchNetwork}
              disabled={switching}
              className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              {switching ? 'Switching...' : 'Switch to CrossFi Testnet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

