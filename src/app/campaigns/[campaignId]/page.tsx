'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';
import { ensureCrossFiMainnet } from '@/lib/networkUtils';
import { CampaignDetailsSkeleton } from '@/components/shared/CampaignDetailsSkeleton';
import { NetworkWarning } from '@/components/shared/NetworkWarning';
import { EditCampaignModal } from '@/components/campaigns/EditCampaignModal';
import { RegisterAppModal } from '@/components/campaigns/RegisterAppModal';
import { LeaderboardTab } from '@/components/campaigns/LeaderboardTab';
import CampaignClaimsSection from '@/components/campaigns/CampaignClaimsSection';
import { 
  getCampaignStatus, 
  formatLocalDate, 
  getDaysRemaining,
  isCampaignActive,
  hasCampaignStarted,
  hasCampaignEnded
} from '@/lib/dateUtils';

interface Campaign {
  id: string;
  campaign_id: number;
  name: string;
  description?: string;
  banner_image_url?: string;
  logo_url?: string;
  category?: string;
  total_pool: string;
  distributed_rewards: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: string;
  registered_apps_count: number;
  total_transactions: number;
  eligibility_criteria?: string;
  terms_url?: string;
  website_url?: string;
  twitter_url?: string;
  discord_url?: string;
  tags?: string[];
  created_by: string;
  blockchain_tx_hash?: string;
  created_at: string;
}

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'leaderboard' | 'claims'>('details');

  const campaignId = params.campaignId as string;

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Campaign not found');
      }

      setCampaign(data.campaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!campaign) return null;

    const status = getCampaignStatus(campaign.start_date, campaign.end_date, campaign.is_active);

    switch (status) {
      case 'upcoming':
        return <span className="px-4 py-2 text-sm font-semibold rounded-full bg-yellow-500 bg-opacity-20 text-yellow-300 border border-yellow-500 border-opacity-30">🟡 Upcoming</span>;
      case 'active':
        return <span className="px-4 py-2 text-sm font-semibold rounded-full bg-green-500 bg-opacity-20 text-green-300 border border-green-500 border-opacity-30">🟢 Active</span>;
      case 'ended':
        return <span className="px-4 py-2 text-sm font-semibold rounded-full bg-gray-500 bg-opacity-20 text-gray-300 border border-gray-500 border-opacity-30">⚫ Ended</span>;
      case 'inactive':
        return <span className="px-4 py-2 text-sm font-semibold rounded-full bg-red-500 bg-opacity-20 text-red-300 border border-red-500 border-opacity-30">🔴 Inactive</span>;
      default:
        return <span className="px-4 py-2 text-sm font-semibold rounded-full bg-gray-500 bg-opacity-20 text-gray-300 border border-gray-500 border-opacity-30">⚫ Unknown</span>;
    }
  };

  // Format wei values to XFI with proper decimals
  const formatPoolValue = (weiValue: string, decimals: number = 3): string => {
    try {
      if (!weiValue || weiValue === '0' || weiValue === '') {
        return '0.000';
      }
      return parseFloat(ethers.formatEther(weiValue)).toFixed(decimals);
    } catch (e) {
      return '0.000';
    }
  };

  const calculateRemainingPool = () => {
    if (!campaign) return '0.000';
    try {
      const totalWei = BigInt(campaign.total_pool);
      const distributedWei = BigInt(campaign.distributed_rewards);
      const remainingWei = totalWei - distributedWei;
      return parseFloat(ethers.formatEther(remainingWei)).toFixed(3);
    } catch (e) {
      return '0.000';
    }
  };

  const calculateDistributionPercentage = () => {
    if (!campaign) return '0.0';
    try {
      const totalWei = BigInt(campaign.total_pool);
      const distributedWei = BigInt(campaign.distributed_rewards);
      if (totalWei === BigInt(0)) return '0.0';
      return (Number(distributedWei * BigInt(1000) / totalWei) / 10).toFixed(1);
    } catch (e) {
      return '0.0';
    }
  };

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString);
  };

  const getDaysRemainingLocal = () => {
    if (!campaign) return 0;
    return getDaysRemaining(campaign.end_date);
  };

  const handleActivateCampaign = async () => {
    try {
      setIsProcessing(true);
      setActionMessage(null);

      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      await ensureCrossFiMainnet();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.mainnet,
        CROSS_ERA_REWARD_SYSTEM_ABI,
        signer
      );

      const tx = await contract.activateCampaign(campaign!.campaign_id);
      await tx.wait();

      // Sync campaign status from smart contract to database
      await fetch(`/api/campaigns/${campaign!.campaign_id}/sync`, {
        method: 'POST'
      });

      setActionMessage({ type: 'success', text: 'Campaign activated successfully!' });
      fetchCampaign(); // Refresh campaign data
    } catch (err: any) {
      setActionMessage({ 
        type: 'error', 
        text: err.message || 'Failed to activate campaign' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivateCampaign = async () => {
    try {
      setIsProcessing(true);
      setActionMessage(null);

      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      await ensureCrossFiMainnet();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.mainnet,
        CROSS_ERA_REWARD_SYSTEM_ABI,
        signer
      );

      const tx = await contract.deactivateCampaign(campaign!.campaign_id);
      await tx.wait();

      // Sync campaign status from smart contract to database
      await fetch(`/api/campaigns/${campaign!.campaign_id}/sync`, {
        method: 'POST'
      });

      setActionMessage({ type: 'success', text: 'Campaign deactivated successfully!' });
      fetchCampaign(); // Refresh campaign data
    } catch (err: any) {
      setActionMessage({ 
        type: 'error', 
        text: err.message || 'Failed to deactivate campaign' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <CampaignDetailsSkeleton />;
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen gradient-bg-hero flex items-center justify-center pt-24">
        <div className="max-w-md glass-card p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Campaign Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'The campaign you are looking for does not exist.'}
          </p>
          <Link
            href="/campaigns"
            className="inline-block px-6 py-3 glass-button text-white font-semibold rounded-lg transition-all"
          >
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-hero">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pt-24 pb-8">
        <NetworkWarning />

        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/campaigns"
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
          >
            ← Back to Campaigns
          </Link>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            actionMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm font-medium ${
              actionMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {actionMessage.text}
            </p>
          </div>
        )}

        {/* Banner */}
        {/* {campaign.banner_image_url ? (
          <div className="h-64 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mb-8 overflow-hidden">
            <img
              src={campaign.banner_image_url}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-64 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mb-8 flex items-center justify-center">
            <span className="text-white text-6xl">🎯</span>
          </div>
        )} */}

        {/* Header */}
        <div className="glass-card p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {campaign.logo_url && (
                <img
                  src={campaign.logo_url}
                  alt={campaign.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {campaign.name}
                </h1>
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                  {campaign.category && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500 bg-opacity-20 text-blue-300 border border-blue-500 border-opacity-30">
                      {campaign.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {campaign.description && (
            <p className="text-gray-300 text-lg mb-6">
              {campaign.description}
            </p>
          )}

          {/* Social Links */}
          {(campaign.website_url || campaign.twitter_url || campaign.discord_url) && (
            <div className="flex gap-3 mb-6">
              {campaign.website_url && (
                <a
                  href={campaign.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 glass-button text-sm font-medium text-white hover:bg-white hover:bg-opacity-20 transition-all"
                >
                  🌐 Website
                </a>
              )}
              {campaign.twitter_url && (
                <a
                  href={campaign.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 glass-button text-sm font-medium text-white hover:bg-white hover:bg-opacity-20 transition-all"
                >
                  🐦 Twitter
                </a>
              )}
              {campaign.discord_url && (
                <a
                  href={campaign.discord_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 glass-button text-sm font-medium text-white hover:bg-white hover:bg-opacity-20 transition-all"
                >
                  💬 Discord
                </a>
              )}
            </div>
          )}

          {/* Tags */}
          {campaign.tags && campaign.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {campaign.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-white bg-opacity-10 text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-400">Total Pool</span>
                  <span className="text-xl">💰</span>
                </div>
                <p className="text-xl font-bold text-white">{formatPoolValue(campaign.total_pool)} XFI</p>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-400">Distributed</span>
                  <span className="text-xl">📊</span>
                </div>
                <p className="text-xl font-bold text-green-600">{formatPoolValue(campaign.distributed_rewards)} XFI</p>
                <p className="text-xs text-gray-400 mt-1">{calculateDistributionPercentage()}%</p>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-400">Remaining</span>
                  <span className="text-xl">🎁</span>
                </div>
                <p className="text-xl font-bold text-blue-600">{calculateRemainingPool()} XFI</p>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-400">Apps</span>
                  <span className="text-xl">👥</span>
                </div>
                <p className="text-xl font-bold text-white">{campaign.registered_apps_count}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="glass-card overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-white border-opacity-20">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                    activeTab === 'details'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500 bg-opacity-10'
                      : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  📋 Details
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                    activeTab === 'leaderboard'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500 bg-opacity-10'
                      : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  🏆 Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab('claims')}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                    activeTab === 'claims'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500 bg-opacity-10'
                      : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  💰 Claims
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Timeline */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Campaign Timeline</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-400">Start Date</span>
                            <span className="text-sm font-semibold text-white">{formatDate(campaign.start_date)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-400">End Date</span>
                            <span className="text-sm font-semibold text-white">{formatDate(campaign.end_date)}</span>
                          </div>
                        </div>
                        {new Date(campaign.end_date) > new Date() && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                              ⏱️ <strong>{getDaysRemainingLocal()}</strong> days remaining
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Eligibility */}
                    {campaign.eligibility_criteria && (
                      <div>
                        <h3 className="text-lg font-bold text-white mb-4">Eligibility</h3>
                        <p className="text-gray-700">{campaign.eligibility_criteria}</p>
                      </div>
                    )}

                    {/* Pool Distribution Progress */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Pool Distribution</h3>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Distributed</span>
                          <span className="font-semibold text-white">{calculateDistributionPercentage()}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-green-600 h-3 rounded-full transition-all"
                            style={{ width: `${calculateDistributionPercentage()}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-400">Total Pool</p>
                          <p className="text-lg font-bold text-white">{formatPoolValue(campaign.total_pool)} XFI</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Distributed</p>
                          <p className="text-lg font-bold text-green-600">{formatPoolValue(campaign.distributed_rewards)} XFI</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Remaining</p>
                          <p className="text-lg font-bold text-blue-600">{calculateRemainingPool()} XFI</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'leaderboard' && campaign && (
                  <LeaderboardTab campaignId={campaign.campaign_id} />
                )}

                {activeTab === 'claims' && campaign && isConnected && (
                  <CampaignClaimsSection campaignId={campaign.campaign_id} />
                )}

                {activeTab === 'claims' && !isConnected && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-lg mb-2">🔐 Wallet Required</div>
                    <p className="text-gray-500">
                      Please connect your wallet to view and claim rewards.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
           

            {/* Action Buttons */}
            {isConnected && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Actions</h3>
                <div className="space-y-3">
                  {campaign.created_by.toLowerCase() === address?.toLowerCase() ? (
                    /* Owner Actions */
                    <>
                      {!campaign.is_active && new Date() < new Date(campaign.end_date) && (
                        <button
                          onClick={handleActivateCampaign}
                          disabled={isProcessing}
                          className="w-full px-4 py-3 glass-button text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? 'Processing...' : '✓ Activate Campaign'}
                        </button>
                      )}
                      {campaign.is_active && (
                        <button
                          onClick={handleDeactivateCampaign}
                          disabled={isProcessing}
                          className="w-full px-4 py-3 glass-button text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? 'Processing...' : '✕ Deactivate Campaign'}
                        </button>
                      )}
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-full px-4 py-3 text-gray-300 font-semibold rounded-lg hover:bg-opacity-10 transition-all"
                      >
                        ✎ Edit Campaign
                      </button>
                    </>
                  ) : (
                    /* User Actions */
                    <button
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="w-full px-4 py-3 glass-button text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!campaign.is_active || new Date() > new Date(campaign.end_date)}
                    >
                      Register Your App
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Creator Info */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Campaign Creator</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  {campaign.created_by.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-mono text-white">
                    {campaign.created_by.slice(0, 6)}...{campaign.created_by.slice(-4)}
                  </p>
                  {campaign.created_by.toLowerCase() === address?.toLowerCase() && (
                    <p className="text-xs text-blue-600">You</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Resources */}
            {campaign.terms_url && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Resources</h3>
                <a
                  href={campaign.terms_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                >
                  📄 Terms & Conditions
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Edit Campaign Modal */}
        {campaign && (
          <EditCampaignModal
            campaign={campaign}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={() => {
              setActionMessage({ type: 'success', text: 'Campaign updated successfully!' });
              fetchCampaign();
            }}
          />
        )}

        {/* Register App Modal */}
        {campaign && address && (
          <RegisterAppModal
            campaignId={campaign.campaign_id}
            campaignName={campaign.name}
            isOpen={isRegisterModalOpen}
            onClose={() => setIsRegisterModalOpen(false)}
            onSuccess={() => {
              setActionMessage({ type: 'success', text: 'App registered successfully!' });
              fetchCampaign();
            }}
            userAddress={address}
          />
        )}
      </div>
    </div>
  );
}

