'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';

interface LeaderboardEntry {
  rank: number;
  appId: string;
  projectName: string;
  projectLogo?: string;
  totalFees: bigint;
  totalVolume: bigint;
  txCount: bigint;
  estimatedReward: bigint;
  feeShare: number;
  volumeShare: number;
}

interface CampaignTotals {
  totalFees: bigint;
  totalVolume: bigint;
  txCount: bigint;
}

interface LeaderboardTabProps {
  campaignId: number;
}

export function LeaderboardTab({ campaignId }: LeaderboardTabProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totals, setTotals] = useState<CampaignTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [campaignId]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.ms');
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.mainnet,
        CROSS_ERA_REWARD_SYSTEM_ABI,
        provider
      );

      // Get campaign totals
      const campaignTotals = await contract.getCampaignTotals(campaignId);
      setTotals({
        totalFees: campaignTotals.totalFees,
        totalVolume: campaignTotals.totalVolume,
        txCount: campaignTotals.txCount,
      });

      // Get registered apps
      const registeredApps = await contract.getCampaignApps(campaignId);

      if (registeredApps.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Fetch project names from database
      const projectNames: Record<string, { name: string; logo_url?: string }> = {};
      try {
        const namesResponse = await fetch('/api/projects/names', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_ids: registeredApps }),
        });
        const namesData = await namesResponse.json();
        if (namesData.success) {
          Object.assign(projectNames, namesData.projects);
        }
      } catch (err) {
        console.error('Error fetching project names:', err);
        // Continue with app IDs if names fetch fails
      }

      // Fetch metrics for each app
      const leaderboardData: LeaderboardEntry[] = [];

      for (let i = 0; i < registeredApps.length; i++) {
        const appId = registeredApps[i];
        const metrics = await contract.getAppCampaignMetrics(appId, campaignId);

        // Calculate market share
        let feeShare = 0;
        let volumeShare = 0;

        if (campaignTotals.totalFees > BigInt(0)) {
          feeShare = Number((metrics.totalFees * BigInt(10000)) / campaignTotals.totalFees) / 100;
        }
        if (campaignTotals.totalVolume > BigInt(0)) {
          volumeShare = Number((metrics.totalVolume * BigInt(10000)) / campaignTotals.totalVolume) / 100;
        }

        leaderboardData.push({
          rank: 0, // Will be set after sorting
          appId,
          projectName: projectNames[appId]?.name || appId,
          projectLogo: projectNames[appId]?.logo_url,
          totalFees: metrics.totalFees,
          totalVolume: metrics.totalVolume,
          txCount: metrics.txCount,
          estimatedReward: metrics.estimatedReward,
          feeShare,
          volumeShare,
        });
      }

      // Sort by estimated reward (descending)
      leaderboardData.sort((a, b) => {
        if (b.estimatedReward > a.estimatedReward) return 1;
        if (b.estimatedReward < a.estimatedReward) return -1;
        return 0;
      });

      // Assign ranks
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Leaderboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  

  return (
    <div className="space-y-6">
      {/* Campaign Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Fees</p>
              <p className="text-2xl font-bold text-purple-900">
                {totals ? parseFloat(ethers.formatEther(totals.totalFees)).toFixed(3) : '0.000'} XFI
              </p>
            </div>
            <div className="text-3xl">⛽</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Volume</p>
              <p className="text-2xl font-bold text-blue-900">
                {totals ? parseFloat(ethers.formatEther(totals.totalVolume)).toFixed(3) : '0.000'} XFI
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Transactions</p>
              <p className="text-2xl font-bold text-green-900">
                {totals ? totals.txCount.toString() : '0'}
              </p>
            </div>
            <div className="text-3xl">📝</div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            🏆 Top Performers
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Reward
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fees
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Txs
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry, index) => (
                <tr
                  key={entry.appId}
                  className={`hover:bg-gray-50 transition-colors ${
                    index === 0 ? 'bg-yellow-50' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {entry.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                      {entry.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                      {entry.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                      <span className="text-lg font-bold text-gray-900">
                        #{entry.rank}
                      </span>
                    </div>
                  </td>

                  {/* Project */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {entry.projectName}
                    </div>
                  </td>

                  {/* Est. Reward */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-green-600">
                      {ethers.formatEther(entry.estimatedReward)} XFI
                    </div>
                  </td>

                  {/* Fees */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {parseFloat(ethers.formatEther(entry.totalFees)).toFixed(3)} XFI
                    </div>
                  </td>

                  {/* Volume */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {parseFloat(ethers.formatEther(entry.totalVolume)).toFixed(3)} XFI
                    </div>
                  </td>

                  {/* Transactions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{entry.txCount.toString()}</div>
                  </td>

                  {/* Market Share */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-600">
                      <div>⛽ {entry.feeShare.toFixed(1)}%</div>
                      <div>📊 {entry.volumeShare.toFixed(1)}%</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
     

      {/* Refresh Button */}
      {/* <div className="text-center">
        <button
          onClick={fetchLeaderboard}
          className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          🔄 Refresh Leaderboard
        </button>
      </div> */}
    </div>
  );
}

