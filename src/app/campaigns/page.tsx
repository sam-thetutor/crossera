'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { NetworkWarning } from '@/components/shared/NetworkWarning';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface Campaign {
  id: string;
  campaign_id: number;
  name: string;
  description?: string;
  category?: string;
  total_pool: string;
  distributed_rewards: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: string;
  registered_apps_count: number;
  logo_url?: string;
  banner_image_url?: string;
}

export default function CampaignsPage() {
  const { isConnected, connect } = useWallet();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');

  useEffect(() => {
    fetchCampaigns();
  }, [filter]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/campaigns'
        : filter === 'active'
        ? '/api/campaigns?active=true'
        : '/api/campaigns?status=ended';
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (campaign: Campaign) => {
    const now = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);

    if (now < start) {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Upcoming</span>;
    } else if (now >= start && now <= end && campaign.is_active) {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
    } else if (now > end) {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Ended</span>;
    } else {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>;
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to view campaigns.
            </p>
            <button
              onClick={connect}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Network Warning */}
        <NetworkWarning />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Campaigns
            </h1>
            <p className="text-gray-600">
              Browse and join reward campaigns
            </p>
          </div>
          <Link
            href="/campaigns/create"
            className="mt-4 sm:mt-0 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <span>+</span>
            Create Campaign
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('ended')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'ended'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Ended
          </button>
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <LoadingSpinner message="Loading campaigns..." />
        ) : campaigns.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No campaigns found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Be the first to create a campaign!' 
                : `No ${filter} campaigns at the moment`}
            </p>
            <Link
              href="/campaigns/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>+</span>
              Create Campaign
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Banner */}
                {/* {campaign.banner_image_url ? (
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-500 relative">
                    <img
                      src={campaign.banner_image_url}
                      alt={campaign.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-white text-4xl">🎯</span>
                  </div>
                )} */}

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                      {campaign.name}
                    </h3>
                    {getStatusBadge(campaign)}
                  </div>

                  {campaign.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Pool</span>
                      <span className="font-semibold text-gray-900">{campaign.total_pool} XFI</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Distributed</span>
                      <span className="font-semibold text-gray-900">{campaign.distributed_rewards} XFI</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Registered Apps</span>
                      <span className="font-semibold text-gray-900">{campaign.registered_apps_count}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-gray-500 mb-4">
                    <div>Start: {new Date(campaign.start_date).toLocaleDateString()}</div>
                    <div>End: {new Date(campaign.end_date).toLocaleDateString()}</div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/campaigns/${campaign.campaign_id}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

