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
      value: project.total_transactions.toString(),
      icon: '📊',
      color: 'blue'
    },
    {
      label: 'Total Rewards',
      value: `${formatRewards(project.total_rewards)} XFI`,
      icon: '💰',
      color: 'green'
    },
    {
      label: 'Total Volume',
      value: `${formatRewards(project.total_volume)} XFI`,
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
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Project Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <span className={`w-8 h-8 rounded-full ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center text-lg`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Blockchain Info */}
      {project.blockchain_tx_hash && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Blockchain Information</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Network:</span>
              <span className="text-sm font-medium text-gray-900">CrossFi Testnet</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Contract:</span>
              <span className="text-sm font-mono text-gray-900">
                0x2a23...8244
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Registration Tx:</span>
              <a
                href={`https://scan.testnet.crossfi.org/tx/${project.blockchain_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View on Explorer →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

