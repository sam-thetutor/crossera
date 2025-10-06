'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStats } from '@/hooks/useProjectStats';
import { StatsWidget } from '@/components/dashboard/StatsWidget';
import { ProjectList } from '@/components/dashboard/ProjectList';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { NetworkWarning } from '@/components/shared/NetworkWarning';

export default function DashboardPage() {
  const { address, isConnected, connect } = useWallet();
  
  // Fetch projects for connected wallet
  const { projects, loading: projectsLoading, refetch } = useProjects({
    owner: address || undefined,
    autoFetch: isConnected
  });

  // Fetch statistics for connected wallet
  const { stats, loading: statsLoading } = useProjectStats(address || undefined);

  // Refetch when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      refetch();
    }
  }, [isConnected, address]);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen gradient-bg-hero flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="glass-card p-8 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-300 mb-6">
              Please connect your wallet to view your dashboard and manage your projects.
            </p>
            <button
              onClick={connect}
              className="glass-button w-full px-6 py-3 font-semibold rounded-lg"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-hero">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pt-24 pb-8">
        {/* Network Warning */}
        <NetworkWarning />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
               Dashboard
            </h1>
            <p className="text-gray-300">
              Manage your projects and track your rewards
            </p>
          </div>
          <Link
            href="/register"
            className="glass-button mt-4 sm:mt-0 px-4 py-3 font-semibold rounded-lg inline-flex items-center gap-2"
          >
            <span>+</span>
              New Project
          </Link>
        </div>

        {/* Statistics */}
        {statsLoading ? (
          <SkeletonLoader type="stats" />
        ) : (
          (() => {
            // Derive per-user stats from fetched projects to avoid mismatches
            const derivedTotalProjects = projects?.length || 0;
            const derivedActiveProjects = (projects || []).filter(p => (p as any).blockchain_tx_hash).length;
            const derivedTotalRewardsNum = (projects || []).reduce((sum, p: any) => {
              const val = typeof p.total_rewards === 'string' ? parseFloat(p.total_rewards) : Number(p.total_rewards || 0);
              return sum + (isNaN(val) ? 0 : val);
            }, 0);
            const derivedTotalRewards = String(derivedTotalRewardsNum);
            const totalTx = stats?.totalTransactions ?? 0;

            return (
              <StatsWidget
                totalProjects={derivedTotalProjects}
                activeProjects={derivedActiveProjects}
                totalRewards={derivedTotalRewards}
                totalTransactions={totalTx}
              />
            );
          })()
        )}

        {/* Projects List */}
        <div className="glass-card rounded-lg p-6">
          {/* <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Your Projects
            </h2>
            <p className="text-sm text-gray-600">
              Connected wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div> */}

          <ProjectList projects={projects} loading={projectsLoading} />
        </div>
      </div>
    </div>
  );
}

