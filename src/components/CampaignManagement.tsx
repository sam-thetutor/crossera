'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCampaigns } from '@/hooks/useRewardContract';

export function CampaignManagement() {
  const { isConnected, address } = useWallet();
  const { network } = useNetwork();
  const { createCampaign, activateCampaign, isCreatingCampaign, isActivatingCampaign } = useCampaigns();

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    totalPool: '',
    startDate: '',
    endDate: '',
    rewardType: 0,
    rulesHash: ''
  });

  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: 'DeFi Innovation Campaign',
      description: 'Supporting DeFi applications on CrossFi',
      creator: '0x1234567890123456789012345678901234567890',
      totalPool: '1000000000000000000000', // 1000 XFI
      startDate: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
      endDate: Math.floor(Date.now() / 1000) + 2592000, // 30 days from now
      status: 'pending',
      registeredAppsCount: 0,
      totalTransactions: 0,
      totalVolume: '0'
    },
    {
      id: 2,
      name: 'NFT Marketplace Campaign',
      description: 'Rewarding NFT marketplace applications',
      creator: '0x2345678901234567890123456789012345678901',
      totalPool: '500000000000000000000', // 500 XFI
      startDate: Math.floor(Date.now() / 1000) + 172800, // 2 days from now
      endDate: Math.floor(Date.now() / 1000) + 3456000, // 40 days from now
      status: 'pending',
      registeredAppsCount: 0,
      totalTransactions: 0,
      totalVolume: '0'
    }
  ]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const startTimestamp = Math.floor(new Date(campaignForm.startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(campaignForm.endDate).getTime() / 1000);

      await createCampaign({
        name: campaignForm.name,
        description: campaignForm.description,
        totalPool: campaignForm.totalPool,
        startDate: startTimestamp,
        endDate: endTimestamp,
        rewardType: campaignForm.rewardType,
        rulesHash: campaignForm.rulesHash || '0x0000000000000000000000000000000000000000000000000000000000000000'
      });

      alert('Campaign created successfully!');
      setCampaignForm({
        name: '',
        description: '',
        totalPool: '',
        startDate: '',
        endDate: '',
        rewardType: 0,
        rulesHash: ''
      });
    } catch (error) {
      console.error('Campaign creation error:', error);
      alert('Failed to create campaign');
    }
  };

  const handleActivateCampaign = async (campaignId: number) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      await activateCampaign(campaignId);
      alert('Campaign activated successfully!');
    } catch (error) {
      console.error('Campaign activation error:', error);
      alert('Failed to activate campaign');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatXFI = (wei: string) => {
    return (parseInt(wei) / 1e18).toFixed(2);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaign Management</h1>
        <p className="text-gray-600">Create and manage reward campaigns for developers</p>
        <div className="mt-2 text-sm text-gray-500">
          Network: {network} | Connected: {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not connected'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Campaign Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Campaign</h2>
          
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                required
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DeFi Innovation Campaign"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({...campaignForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe the campaign goals and requirements..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Pool (XFI) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={campaignForm.totalPool}
                onChange={(e) => setCampaignForm({...campaignForm, totalPool: (parseFloat(e.target.value) * 1e18).toString()})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={campaignForm.startDate}
                  onChange={(e) => setCampaignForm({...campaignForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={campaignForm.endDate}
                  onChange={(e) => setCampaignForm({...campaignForm, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reward Type
              </label>
              <select
                value={campaignForm.rewardType}
                onChange={(e) => setCampaignForm({...campaignForm, rewardType: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Proportional</option>
                <option value={1}>Fixed</option>
                <option value={2}>Tiered</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rules Hash (IPFS)
              </label>
              <input
                type="text"
                value={campaignForm.rulesHash}
                onChange={(e) => setCampaignForm({...campaignForm, rulesHash: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x... (optional)"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingCampaign || !isConnected}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
            </button>
          </form>
        </div>

        {/* Campaign List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Campaigns</h2>
          
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Pool:</span>
                    <span className="font-medium ml-1">{formatXFI(campaign.totalPool)} XFI</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Apps:</span>
                    <span className="font-medium ml-1">{campaign.registeredAppsCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Start:</span>
                    <span className="font-medium ml-1">{formatDate(campaign.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">End:</span>
                    <span className="font-medium ml-1">{formatDate(campaign.endDate)}</span>
                  </div>
                </div>

                {campaign.status === 'pending' && (
                  <button
                    onClick={() => handleActivateCampaign(campaign.id)}
                    disabled={isActivatingCampaign || !isConnected}
                    className="mt-3 w-full bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isActivatingCampaign ? 'Activating...' : 'Activate Campaign'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

