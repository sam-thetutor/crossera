'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { useRegisterApp, useRewards, useContractData } from '@/hooks/useRewardContract';

export function DeveloperDashboard() {
  const { isConnected, address } = useWallet();
  const { network } = useNetwork();
  const { registerApp, isRegisteringApp } = useRegisterApp();
  const { claimRewards, isClaimingRewards } = useRewards();
  const { getClaimableRewards } = useContractData();

  const [appForm, setAppForm] = useState({
    appId: '',
    appName: '',
    description: '',
    category: '',
    websiteUrl: ''
  });

  const [selectedApp, setSelectedApp] = useState<string>('');
  const [selectedCampaign, setSelectedCampaign] = useState<number>(1);

  const handleAppRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      await registerApp(appForm);
      alert('App registered successfully!');
      setAppForm({
        appId: '',
        appName: '',
        description: '',
        category: '',
        websiteUrl: ''
      });
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register app');
    }
  };

  const handleClaimRewards = async () => {
    if (!selectedApp || !isConnected) {
      alert('Please select an app and connect your wallet');
      return;
    }

    try {
      await claimRewards(selectedApp, selectedCampaign);
      alert('Rewards claimed successfully!');
    } catch (error) {
      console.error('Claim error:', error);
      alert('Failed to claim rewards');
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Developer Dashboard</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to access the developer dashboard.</p>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Developer Dashboard</h1>
        <p className="text-gray-600">Manage your apps and claim rewards on {network} network</p>
        <div className="mt-2 text-sm text-gray-500">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* App Registration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Register New App</h2>
          <form onSubmit={handleAppRegistration} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App ID *
              </label>
              <input
                type="text"
                required
                value={appForm.appId}
                onChange={(e) => setAppForm({...appForm, appId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="my-app-123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App Name *
              </label>
              <input
                type="text"
                required
                value={appForm.appName}
                onChange={(e) => setAppForm({...appForm, appName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Awesome App"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={appForm.description}
                onChange={(e) => setAppForm({...appForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe your application..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={appForm.category}
                onChange={(e) => setAppForm({...appForm, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                <option value="DeFi">DeFi</option>
                <option value="NFT">NFT</option>
                <option value="Gaming">Gaming</option>
                <option value="Social">Social</option>
                <option value="Tools">Tools</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={appForm.websiteUrl}
                onChange={(e) => setAppForm({...appForm, websiteUrl: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://myapp.com"
              />
            </div>

            <button
              type="submit"
              disabled={isRegisteringApp}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegisteringApp ? 'Registering...' : 'Register App'}
            </button>
          </form>
        </div>

        {/* Reward Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Claim Rewards</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select App
              </label>
              <select
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an app</option>
                <option value="demo-app-1">Demo App 1</option>
                <option value="demo-app-2">Demo App 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign ID
              </label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Campaign 1</option>
                <option value={2}>Campaign 2</option>
              </select>
            </div>

            {selectedApp && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Claimable Rewards</h3>
                <div className="text-sm text-gray-600">
                  <div>App: {selectedApp}</div>
                  <div>Campaign: {selectedCampaign}</div>
                  <div className="text-lg font-semibold text-green-600 mt-2">
                    0.0 XFI available
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleClaimRewards}
              disabled={!selectedApp || isClaimingRewards}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClaimingRewards ? 'Claiming...' : 'Claim Rewards'}
            </button>
          </div>
        </div>
      </div>

      {/* App List */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Apps</h2>
        <div className="text-gray-500 text-center py-8">
          No apps registered yet. Register your first app above to get started!
        </div>
      </div>
    </div>
  );
}

