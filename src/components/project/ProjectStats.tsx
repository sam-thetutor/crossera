'use client';

import { Project } from '@/lib/supabase';
import { ethers } from 'ethers';

interface ProjectStatsProps {
  project: Project;
}

export function ProjectStats({ project }: ProjectStatsProps) {
  const formatRewards = (rewards: string) => {
    try {
      return ethers.formatEther(rewards || '0');
    } catch {
      return '0.00';
    }
  };

  const stats = [
    {
      label: 'Total Transactions',
      value: (project.total_transactions ?? 0).toString(),
      icon: '📊',
      color: 'blue'
    },
    {
      label: 'Total Rewards',
      value: `${formatRewards(project.total_rewards ?? '0')} XFI`,
      icon: '💰',
      color: 'green'
    },
    {
      label: 'Total Volume',
      value: `${formatRewards(project.total_volume ?? '0')} XFI`,
      icon: '📈',
      color: 'purple'
    },
    {
      label: 'Status',
      value: project.is_active ? 'Active' : 'Inactive',
      icon: project.is_active ? '✓' : '✗',
      color: project.is_active ? 'green' : 'gray'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-500 bg-opacity-20 text-blue-300',
    green: 'bg-green-500 bg-opacity-20 text-green-300',
    purple: 'bg-purple-500 bg-opacity-20 text-purple-300',
    gray: 'bg-gray-500 bg-opacity-20 text-gray-300'
  };

  return (
    <div className="glass-card rounded-lg p-4">
      <h2 className="text-base font-semibold text-white mb-3">Project Statistics</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <div key={index} className="text-center p-3 bg-black bg-opacity-10 rounded-lg border border-white border-opacity-10">
            <div className="flex items-center justify-center mb-1">
              <span className={`w-5 h-5 rounded-full ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center text-xs backdrop-blur-sm`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-xs text-gray-300 mb-1">{stat.label}</p>
            <p className="text-sm font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Blockchain Info */}
      {project.blockchain_tx_hash && (
        <div className="mt-3 pt-3 border-t border-white border-opacity-10">
          <h3 className="text-xs font-medium text-gray-300 mb-2">Blockchain Info</h3>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Network:</span>
              <span className="text-xs text-white">CrossFi Mainnet</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Contract:</span>
              <span className="text-xs font-mono text-white">
                0x7306...AEF0
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Tx:</span>
              <a
                href={`https://scan.crossfi.org/tx/${project.blockchain_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 hover:underline transition-colors"
              >
                View →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

