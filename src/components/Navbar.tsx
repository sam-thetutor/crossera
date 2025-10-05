'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { ensureCrossFiMainnet } from '@/lib/networkUtils';

export function Navbar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isConnected, address, balance, connect, disconnect, isLoading, error, refreshBalance, isOnMainnet } = useWallet();
  const { network, setNetwork, isTestnet, isMainnet, networkConfig } = useNetwork();
  
  // Use wallet's actual network detection for display
  const actualNetworkConfig = isOnMainnet ? 
    { name: 'CrossFi Mainnet' } : 
    { name: 'CrossFi Testnet' };

  const handleSwitchToMainnet = async () => {
    setIsSwitchingNetwork(true);
    try {
      await ensureCrossFiMainnet();
    } catch (err) {
      console.error('Failed to switch to mainnet:', err);
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

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
      <nav className="glass-navbar fixed top-0 left-0 right-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 min-w-0">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  Cross<span className="text-purple-400">Era</span>
                </h1>
              </Link>
            </div>

            {/* Glowing Purple Arch Element - Hidden on mobile */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-0 h-16 w-96 opacity-60 pointer-events-none">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-purple-400 to-transparent blur-xl"></div>
              </div>

            {/* Placeholder for wallet section */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="w-24 h-8 bg-white bg-opacity-10 rounded animate-pulse"></div>
            </div>
            
            {/* Mobile placeholder */}
            <div className="md:hidden flex items-center space-x-2">
              <div className="w-16 h-6 bg-white bg-opacity-10 rounded animate-pulse"></div>
              <div className="w-6 h-6 bg-white bg-opacity-10 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="glass-navbar fixed top-0 left-0 right-0 z-50">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 min-w-0">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
                Cross<span className="text-blue-400">Era</span>
              </h1>
            </Link>
          </div>

          {/* Glowing Purple Arch Element - Hidden on mobile */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-0 h-16 w-96 opacity-60 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-purple-400 to-transparent blur-xl"></div>
          </div>
  
          {/* Desktop Navigation Links and Wallet Section */}
          <div className="hidden md:flex items-center space-x-4 relative z-10">
            {/* Navigation Links */}
            <div className="flex items-center space-x-6 relative z-20">
              <Link href="/dashboard" className="text-white hover:text-blue-300 font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/campaigns" className="text-white hover:text-blue-300 font-medium transition-colors">
                Campaigns
              </Link>
              <Link href="/profile" className="text-white hover:text-blue-300 font-medium transition-colors">
                Profile
              </Link>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-3">
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    
                  </div>
                  {!isOnMainnet && (
                  <button
                    onClick={handleSwitchToMainnet}
                    disabled={isSwitchingNetwork}
                    className="px-3 py-1 text-xs font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSwitchingNetwork ? 'Switching...' : 'Switch to Mainnet'}
                  </button>
                  )}
                  <button
                    onClick={disconnect}
                    className="glass-button inline-flex justify-center items-center px-6 py-2 rounded-xl font-semibold text-white transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={isLoading}
                  className="glass-button inline-flex justify-center items-center px-6 py-2 rounded-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center flex-shrink-0">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white hover:text-blue-300 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg mt-2 border border-white border-opacity-20">
              {/* Wallet Section */}
              {isConnected ? (
                <div className="px-3 py-2 border-b border-white border-opacity-20 mb-2">
                  <div className="text-xs text-gray-400">
                    {actualNetworkConfig.name}
                    {isOnMainnet ? ' ✅' : ' ❌'}
                  </div>
                </div>
              ) : null}

              {/* Navigation Links */}
              <Link
                href="/dashboard"
                className="block px-3 py-2 text-white hover:text-blue-300 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/campaigns"
                className="block px-3 py-2 text-white hover:text-blue-300 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Campaigns
              </Link>
              <Link
                href="/profile"
                className="block px-3 py-2 text-white hover:text-blue-300 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>

              {/* Wallet Actions */}
              <div className="border-t border-white border-opacity-20 pt-2 mt-2">
                {isConnected ? (
                  <div className="space-y-1">
                    {!isOnMainnet && (
                      <button
                        onClick={() => {
                          handleSwitchToMainnet();
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={isSwitchingNetwork}
                        className="block w-full text-left px-3 py-2 text-xs font-medium text-white bg-orange-600 border border-transparent rounded hover:bg-orange-700 disabled:opacity-50 transition-all"
                      >
                        {isSwitchingNetwork ? 'Switching...' : 'Switch to Mainnet'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        disconnect();
                        setIsMobileMenuOpen(false);
                      }}
                      className="glass-card inline-flex justify-center items-center px-6 py-3 rounded-lg font-semibold text-white transition-all w-full"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      connect();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isLoading}
                    className="glass-card inline-flex justify-center items-center px-6 py-1 rounded-lg font-semibold text-white disabled:opacity-50 transition-all w-full"
                >
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
          </div>
        )}
  
          {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2 mx-4">
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
