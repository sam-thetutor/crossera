'use client';

import { useEffect, useState } from 'react';
import { getCurrentChainId, switchToCrossFiNetwork, CROSSFI_MAINNET_CHAIN_ID } from '@/lib/networkUtils';

export function NetworkWarning() {
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check localStorage for dismissal preference
    const isDismissed = localStorage.getItem('network-warning-dismissed') === 'true';
    setDismissed(isDismissed);
    
    if (!isDismissed) {
      checkNetwork();
      
      // Listen for network changes
      if (window.ethereum) {
        window.ethereum.on('chainChanged', checkNetwork);
      }
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
      setWrongNetwork(chainId !== CROSSFI_MAINNET_CHAIN_ID);
    } catch (error) {
      console.error('Error checking network:', error);
    }
  };

  const handleSwitchNetwork = async () => {
    setSwitching(true);
    try {
      await switchToCrossFiNetwork('mainnet');
      setWrongNetwork(false);
    } catch (error) {
      console.error('Error switching network:', error);
      alert('Failed to switch network. Please switch manually in MetaMask.');
    } finally {
      setSwitching(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('network-warning-dismissed', 'true');
  };

  // Allow re-showing warning by double-clicking dismiss button (for debugging)
  const handleDoubleClick = () => {
    setDismissed(false);
    localStorage.removeItem('network-warning-dismissed');
  };

  if (!wrongNetwork || dismissed) return null;

  return (
    <div className="relative bg-yellow-500 text-white p-4 text-center flex items-center justify-center">
      <div className="flex-grow">
        <p className="mb-3 font-bold text-lg">
          <span role="img" aria-label="warning">⚠️</span> Wrong Network Detected
        </p>
        <p className="mb-3">
          You're not connected to CrossFi Mainnet. Please switch networks to use this application.
        </p>
        <button
          onClick={handleSwitchNetwork}
          disabled={switching}
          className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          {switching ? 'Switching...' : 'Switch to CrossFi Mainnet'}
        </button>
      </div>
      <button
        onClick={handleDismiss}
        onDoubleClick={handleDoubleClick}
        className="absolute top-2 right-2 text-white hover:text-gray-200 text-xl font-bold"
        aria-label="Dismiss warning (double-click to re-enable)"
        title="Click to dismiss, double-click to re-enable"
      >
        &times;
      </button>
    </div>
  );
}

