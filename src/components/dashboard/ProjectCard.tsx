'use client';

import Link from 'next/link';
import { Project } from '@/lib/supabase';
import { BlockchainStatusBadge } from '@/components/shared/BlockchainStatusBadge';
import { CategoryBadge } from '@/components/shared/CategoryBadge';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link 
            href={`/projects/${project.app_id}`}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            {project.app_name}
          </Link>
          <p className="text-sm text-gray-500 mt-1">
            ID: {project.app_id}
          </p>
        </div>
        {project.logo_url && (
          <img 
            src={project.logo_url} 
            alt={project.app_name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 mb-4">
        {project.category && <CategoryBadge category={project.category} />}
        <BlockchainStatusBadge status={project.blockchain_status} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Transactions</p>
          <p className="text-lg font-semibold text-gray-900">
            {project.total_transactions}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Rewards</p>
          <p className="text-lg font-semibold text-gray-900">
            {parseFloat(project.total_rewards || '0').toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <p className="text-lg font-semibold text-gray-900">
            {project.is_active ? '✓' : '✗'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Created {formatDate(project.created_at)}
        </div>
        <Link
          href={`/projects/${project.app_id}`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Details →
        </Link>
      </div>

      {/* Links */}
      {(project.website_url || project.github_url || project.twitter_url) && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          {project.website_url && (
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Website"
            >
              🌐
            </a>
          )}
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="GitHub"
            >
              💻
            </a>
          )}
          {project.twitter_url && (
            <a
              href={project.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Twitter"
            >
              🐦
            </a>
          )}
        </div>
      )}
    </div>
  );
}

