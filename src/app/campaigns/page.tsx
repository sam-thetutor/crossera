'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { NetworkWarning } from '@/components/shared/NetworkWarning';
import { CampaignCardSkeleton } from '@/components/shared/CampaignCardSkeleton';
import { getCampaignStatus } from '@/lib/dateUtils';

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

  // Format wei values to XFI with decimals
  const formatXFI = (weiValue: string): string => {
    try {
      if (!weiValue || weiValue === '0') return '0.000';
      return parseFloat(ethers.formatEther(weiValue)).toFixed(3);
    } catch (error) {
      return '0.000';
    }
  };

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
    const status = getCampaignStatus(campaign.start_date, campaign.end_date, campaign.is_active);

    switch (status) {
      case 'upcoming':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500 bg-opacity-20 text-yellow-300 border border-yellow-500 border-opacity-30">Upcoming</span>;
      case 'active':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500 bg-opacity-20 text-green-300 border border-green-500 border-opacity-30">Active</span>;
      case 'ended':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-500 bg-opacity-20 text-gray-300 border border-gray-500 border-opacity-30">Ended</span>;
      case 'inactive':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500 bg-opacity-20 text-red-300 border border-red-500 border-opacity-30">Inactive</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-500 bg-opacity-20 text-gray-300 border border-gray-500 border-opacity-30">Unknown</span>;
    }
  };

  // Not connected state
  // if (!isConnected) {
  //   return (
  //     <div className="min-h-screen bg-gray-50">
  //       <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-16">
  //         <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-8 text-center">
  //           <div className="text-6xl mb-4">🔐</div>
  //           <h2 className="text-2xl font-bold text-gray-900 mb-4">
  //             Connect Your Wallet
  //           </h2>
  //           <p className="text-gray-600 mb-6">
  //             Please connect your wallet to view campaigns.
  //           </p>
  //           <button
  //             onClick={connect}
  //             className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
  //           >
  //             Connect Wallet
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen gradient-bg-hero">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pt-24 pb-8">
        {/* Network Warning */}
        <NetworkWarning />

        {/* Header */}
        <div className="glass-card p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Campaigns
              </h1>
              <p className="text-gray-300">
                Browse and join reward campaigns
              </p>
            </div>
            <Link
              href="/campaigns/create"
              className="mt-4 sm:mt-0 px-6 py-3 glass-button text-white font-semibold rounded-lg transition-all inline-flex items-center gap-2"
            >
              <span>+</span>
              Create Campaign
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'glass-button text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'active'
                  ? 'glass-button text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('ended')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'ended'
                  ? 'glass-button text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Ended
            </button>
          </div>
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <CampaignCardSkeleton count={6} />
        ) : campaigns.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No campaigns found
            </h3>
            <p className="text-gray-300 mb-6">
              {filter === 'all' 
                ? 'Be the first to create a campaign!' 
                : `No ${filter} campaigns at the moment`}
            </p>
            <Link
              href="/campaigns/create"
              className="inline-flex items-center gap-2 px-6 py-3 glass-button text-white font-semibold rounded-lg transition-all"
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
                className="glass-card overflow-hidden glass-float"
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
                    <h3 className="text-lg font-bold text-white line-clamp-1">
                      {campaign.name}
                    </h3>
                    {getStatusBadge(campaign)}
                  </div>

                  {campaign.description && (
                    <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Pool</span>
                      <span className="font-semibold text-white">{formatXFI(campaign.total_pool)} XFI</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Distributed</span>
                      <span className="font-semibold text-white">{formatXFI(campaign.distributed_rewards)} XFI</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Registered Apps</span>
                      <span className="font-semibold text-white">{campaign.registered_apps_count}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-gray-400 mb-4">
                    <div>Start: {new Date(campaign.start_date).toLocaleDateString()}</div>
                    <div>End: {new Date(campaign.end_date).toLocaleDateString()}</div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/campaigns/${campaign.campaign_id}`}
                    className="block w-full text-center px-4 py-2 glass-button text-white font-medium rounded-lg transition-all"
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

