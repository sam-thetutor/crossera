'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useUserCampaignStatus } from '@/hooks/useUserCampaignStatus';
import { UserClaimsSummary } from '@/types/contract';
import { ethers } from 'ethers';

// Helper function to safely format wei values
const formatWeiValue = (value: string, decimals: number = 4): string => {
  try {
    if (!value || value === '0') return '0.0000';
    
    // Convert to number and back to string to remove any decimal points
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.0000';
    
    // If the value is very large, it's likely already in wei format
    if (numValue > 1e15) {
      return parseFloat(ethers.formatEther(Math.floor(numValue).toString())).toFixed(decimals);
    } else {
      // If it's smaller, it might already be in XFI format
      return numValue.toFixed(decimals);
    }
  } catch (error) {
    console.error('Error formatting wei value:', error);
    return '0.0000';
  }
};

// Legacy interface for backward compatibility
interface LegacyClaimsHistoryData {
  summary: {
    totalRewards: string;
    totalClaims: number;
    totalFeesGenerated: string;
    totalVolumeGenerated: string;
    averageClaimAmount: string;
  };
  claimsHistory: Array<{
    id: string;
    app_id: string;
    app_name: string;
    campaign_id: number;
    campaign_name: string;
    claim_amount: string;
    claim_tx_hash: string;
    claimed_at: string;
    total_claims: number;
  }>;
  analytics: {
    monthlyRewards: Array<{
      month: string;
      amount: string;
    }>;
    topApps: Array<{
      appId: string;
      appName: string;
      totalRewards: string;
    }>;
    claimsByCampaign: Record<number, {
      campaignId: number;
      campaignName: string;
      totalClaims: number;
      totalAmount: number;
    }>;
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

interface ClaimsHistoryProps {
  className?: string;
}

export default function ClaimsHistory({ className = '' }: ClaimsHistoryProps) {
  const { address } = useAccount();
  const { 
    processedData, 
    userSummary, 
    loading: contractLoading, 
    error: contractError,
    refresh 
  } = useUserCampaignStatus();
  
  // Legacy API data for detailed claims history
  const [legacyClaimsData, setLegacyClaimsData] = useState<LegacyClaimsHistoryData | null>(null);
  const [legacyLoading, setLegacyLoading] = useState(true);
  const [legacyError, setLegacyError] = useState<string | null>(null);

  // Fetch detailed claims history from API (for transaction hashes, timestamps, etc.)
  const fetchLegacyClaimsHistory = async () => {
    if (!address) return;
    
    try {
      setLegacyLoading(true);
      const response = await fetch(
        `/api/profile/claims?userAddress=${address}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch claims history');
      }
      
      const data = await response.json();
      setLegacyClaimsData(data.data);
      setLegacyError(null);
    } catch (err) {
      console.error('Error fetching legacy claims history:', err);
      setLegacyError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLegacyLoading(false);
    }
  };

  useEffect(() => {
    fetchLegacyClaimsHistory();
  }, [address]);

  // Combined loading and error states
  const loading = contractLoading || legacyLoading;
  const error = contractError || legacyError;

  if (loading) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold mb-2">⚠️ Error Loading Claims History</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!userSummary && !legacyClaimsData) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="text-gray-500 text-center">
          <p>No claims history available</p>
        </div>
      </div>
    );
  }

  // Use new contract data for summary, fallback to legacy for detailed history
  const summary = userSummary;
  const claimsHistory = legacyClaimsData?.claimsHistory || [];
  const analytics = legacyClaimsData?.analytics;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Section */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          💰 Claims Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {summary?.totalRewards || '0.0000'} XFI
            </div>
            <div className="text-sm text-gray-400">Total Rewards</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {summary?.totalClaims || 0}
            </div>
            <div className="text-sm text-gray-400">Total Claims</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {summary?.totalFeesGenerated || '0.0000'} XFI
            </div>
            <div className="text-sm text-gray-400">Fees Generated</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {summary?.totalVolumeGenerated || '0.0000'} XFI
            </div>
            <div className="text-sm text-gray-400">Volume Generated</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              {summary?.averageClaimAmount || '0.0000'} XFI
            </div>
            <div className="text-sm text-gray-400">Avg. Claim</div>
          </div>
        </div>
      </div>

      {/* Real-time Campaign Status */}
      {processedData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📊 Real-time Campaign Status
          </h3>
          
          <div className="space-y-4">
            {Object.entries(
              processedData.reduce((acc, app) => {
                if (!acc[app.campaignId]) {
                  acc[app.campaignId] = [];
                }
                acc[app.campaignId].push(app);
                return acc;
              }, {} as Record<number, typeof processedData>)
            ).map(([campaignId, apps]) => (
              <div key={campaignId} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white">Campaign {campaignId}</h4>
                  <div className="text-sm text-gray-400">
                    {apps.filter(app => app.hasClaimed).length} / {apps.length} claimed
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">
                      {apps.reduce((sum, app) => sum + parseFloat(app.estimatedReward), 0).toFixed(4)} XFI
                    </div>
                    <div className="text-sm text-gray-400">Estimated Rewards</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">
                      {apps.reduce((sum, app) => sum + parseFloat(app.claimedAmount), 0).toFixed(4)} XFI
                    </div>
                    <div className="text-sm text-gray-400">Claimed Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">
                      {apps.reduce((sum, app) => sum + parseFloat(app.feesGenerated), 0).toFixed(4)} XFI
                    </div>
                    <div className="text-sm text-gray-400">Fees Generated</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Claims */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          📋 Recent Claims
        </h3>

        {claimsHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">🎯 No Claims Yet</div>
            <p className="text-gray-500">
              Start participating in campaigns to earn rewards!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400">Campaign</th>
                  <th className="text-left py-3 px-4 text-gray-400">App</th>
                  <th className="text-right py-3 px-4 text-gray-400">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {claimsHistory.map((claim) => (
                  <tr key={claim.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{claim.campaign_name}</div>
                      <div className="text-sm text-gray-400">ID: {claim.campaign_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{claim.app_name}</div>
                      <div className="text-sm text-gray-400">{claim.app_id}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-green-400">
                        {formatWeiValue(claim.claim_amount || '0', 4)} XFI
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white">
                        {new Date(claim.claimed_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(claim.claimed_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {claim.claim_tx_hash ? (
                        <a
                          href={`https://scan.crossfi.org/tx/${claim.claim_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline text-sm"
                        >
                          View on Explorer
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analytics Section */}
      {analytics.topApps.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📊 Top Performing Apps
          </h3>
          
          <div className="space-y-3">
            {analytics.topApps.map((app, index) => (
              <div key={app.appId} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">{app.appName}</div>
                    <div className="text-sm text-gray-400">{app.appId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-400">
                    {formatWeiValue(app.totalRewards || '0', 4)} XFI
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Rewards Chart */}
      {analytics.monthlyRewards.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📈 Monthly Rewards
          </h3>
          
          <div className="space-y-2">
            {analytics.monthlyRewards.slice(0, 6).map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-gray-300">
                  {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="font-semibold text-green-400">
                  {formatWeiValue(month.amount || '0', 2)} XFI
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
