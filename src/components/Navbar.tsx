'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useNetwork } from '@/contexts/NetworkContext';

export function Navbar() {
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected, address, balance, connect, disconnect, isLoading, error } = useWallet();
  const { network, setNetwork, isTestnet } = useNetwork();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    const num = parseFloat(bal);
    return num.toFixed(4);
  };

  // Prevent hydration mismatch by not rendering wallet-dependent content until mounted
  if (!isMounted) {
    return (
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  Cross<span className="text-blue-600">Era</span>
                </h1>
              </Link>
            </div>

            {/* Placeholder for wallet section */}
            <div className="flex items-center space-x-4">
              <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">
                Cross<span className="text-blue-600">Era</span>
              </h1>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {isConnected && (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/campaigns" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Campaigns
                </Link>
                <Link href="/register" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Register Project
                </Link>
              </>
            )}
          </div>
  
          {/* Network Selector and Wallet */}
          <div className="flex items-center space-x-4">
            

            {/* Wallet Connection */}
            <div className="flex items-center space-x-3">
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatAddress(address!)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatBalance(balance)} XFI
                    </div>
                  </div>
                  <button
                    onClick={disconnect}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
          </div>
  
          {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Wallet Error
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
