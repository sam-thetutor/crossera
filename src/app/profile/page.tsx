'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useProjects } from '@/hooks/useProjects';
import { NetworkWarning } from '@/components/shared/NetworkWarning';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import ClaimsHistory from '@/components/profile/ClaimsHistory';

export default function ProfilePage() {
  const { address, isConnected, connect, balance } = useWallet();
  const [userStats, setUserStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalRewards: '0.0000',
    campaignsParticipated: 0
  });

  // Use existing hook with caching
  const { projects: allProjects, loading: loadingProjects } = useProjects({
    owner: address || undefined,
    autoFetch: isConnected
  });

  // Calculate user statistics
  useEffect(() => {
    if (allProjects && allProjects.length > 0) {
      const activeProjects = allProjects.filter((p: any) => p.is_active).length;
      const totalRewards = allProjects.reduce((sum: number, p: any) => {
        return sum + (parseFloat(p.total_rewards_earned || '0'));
      }, 0);

      setUserStats({
        totalProjects: allProjects.length,
        activeProjects,
        totalRewards: totalRewards.toFixed(4),
        campaignsParticipated: allProjects.filter((p: any) => p.campaigns && p.campaigns.length > 0).length
      });
    } else {
      setUserStats({
        totalProjects: 0,
        activeProjects: 0,
        totalRewards: '0.0000',
        campaignsParticipated: 0
      });
    }
  }, [allProjects]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    const num = parseFloat(bal);
    return num.toFixed(4);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen gradient-bg-hero flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="glass-card p-8 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Profile
            </h1>
            <p className="text-gray-300 mb-6">
              Connect your wallet to view your profile and manage your projects
            </p>
            <button
              onClick={connect}
              className="px-6 py-3 glass-button text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-20 transition-all w-full"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-hero pt-24 pb-12">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        {/* Network Warning */}
        <NetworkWarning />

        {/* Profile Header */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {address ? address.slice(2, 4).toUpperCase() : '👤'}
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">Wallet:</span>
                  <code className="text-white bg-gray-800 px-2 py-1 rounded text-sm">
                    {address ? formatAddress(address) : 'Not connected'}
                  </code>
                  <button
                    onClick={() => address && copyToClipboard(address)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Copy full address"
                  >
                    📋
                  </button>
                </div>
              </div>
              
              {/* Balance Display */}
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {balance ? formatBalance(balance) : '0.0000'} XFI
                  </div>
                  <p className="text-gray-400 text-sm">Current Balance</p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 text-sm glass-button text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-all"
                  title="Refresh balance"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/register"
                className="px-4 py-2 glass-button text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-all text-center"
              >
                + New Project
              </Link>
              <Link
                href="/campaigns"
                className="px-4 py-2 glass-button text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-all text-center"
              >
                Join Campaign
              </Link>
            </div>
          </div>
        </div>

        

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {userStats.totalProjects}
            </div>
            <p className="text-gray-400">Total Projects</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {userStats.activeProjects}
            </div>
            <p className="text-gray-400">Active Projects</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {userStats.totalRewards} XFI
            </div>
            <p className="text-gray-400">Total Rewards</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {userStats.campaignsParticipated}
            </div>
            <p className="text-gray-400">Campaigns Joined</p>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">My Projects</h2>
            <Link
              href="/register"
              className="px-4 py-2 glass-button text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-all"
            >
              + Add Project
            </Link>
          </div>
          
          {loadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="glass-card p-6 animate-pulse">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-white bg-opacity-20 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-white bg-opacity-20 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-white bg-opacity-20 rounded-full w-16"></div>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-4 space-y-2">
                    <div className="h-4 bg-white bg-opacity-20 rounded w-full"></div>
                    <div className="h-4 bg-white bg-opacity-20 rounded w-2/3"></div>
                    <div className="h-4 bg-white bg-opacity-20 rounded w-1/2"></div>
                  </div>
                  
                  {/* Project Stats */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-white bg-opacity-20 rounded w-12"></div>
                      <div className="h-3 bg-white bg-opacity-20 rounded w-16"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-white bg-opacity-20 rounded w-14"></div>
                      <div className="h-3 bg-white bg-opacity-20 rounded w-20"></div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="pt-2 border-t border-white border-opacity-10">
                    <div className="h-10 bg-white bg-opacity-20 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : allProjects.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-gray-300 mb-4">No projects found</p>
              <Link
                href="/register"
                className="px-4 py-2 glass-button text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-all"
              >
                Register Your First Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProjects.map((project: any) => (
                <div key={project.app_id} className="glass-card p-6 hover:bg-opacity-20 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-1 truncate group-hover:text-purple-300 transition-colors">
                        {project.app_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-mono">
                          {project.app_id}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium border ${
                      project.is_active 
                        ? 'bg-emerald-500 bg-opacity-20 text-emerald-300 border-emerald-500 border-opacity-30' 
                        : 'bg-gray-500 bg-opacity-20 text-gray-300 border-gray-500 border-opacity-30'
                    }`}>
                      {project.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-4">
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                      {project.description || 'No description available for this project.'}
                    </p>
                  </div>
                  
                  {/* Project Stats */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Status:</span>
                      <span className={`font-medium ${
                        project.blockchain_status === 'registered' 
                          ? 'text-emerald-400' 
                          : 'text-orange-400'
                      }`}>
                        {project.blockchain_status === 'registered' ? 'On-Chain' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Rewards:</span>
                      <span className="text-white font-medium">
                        {project.total_rewards_earned || '0.0000'} XFI
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="pt-2 border-t border-white border-opacity-10">
                    <Link
                      href={`/projects/${project.app_id}`}
                      className="w-full block text-center px-4 py-2 glass-button text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-300 font-medium"
                    >
                      View Project Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Claims History Section */}
        <div className="mt-8">
          <ClaimsHistory />
        </div>

      </div>
    </div>
  );
}
