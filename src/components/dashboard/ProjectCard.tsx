'use client';

import Link from 'next/link';
import { Project } from '@/lib/supabase';
import { BlockchainStatusBadge } from '@/components/shared/BlockchainStatusBadge';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { UniqueUsersWidgetCompact } from '@/components/shared/UniqueUsersWidget';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {

  return (
    <Link 
      href={`/projects/${project.app_id}`}
      className="glass-card rounded-lg p-4 hover:bg-opacity-30 transition-all cursor-pointer block"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white truncate flex-1 mr-2">
          {project.app_name}
        </h3>
        {project.logo_url && (
          <img 
            src={project.logo_url} 
            alt={project.app_name}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        {project.category && <CategoryBadge category={project.category} />}
        <BlockchainStatusBadge status={project.blockchain_tx_hash ? 'confirmed' : 'pending'} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-400">Transactions</p>
          <p className="text-sm font-semibold text-white">
            {project.total_transactions}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Rewards</p>
          <p className="text-sm font-semibold text-white">
            {parseFloat(project.total_rewards || '0').toFixed(2)}
          </p>
        </div>
      </div>

      {/* Unique Users */}
      <div className="mb-3">
        <UniqueUsersWidgetCompact appId={project.app_id} />
      </div>

      {/* Links */}
      {(project.website_url || project.github_url || project.twitter_url) && (
        <div className="flex items-center gap-2 pt-2 border-t border-white border-opacity-10">
          {project.website_url && (
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors text-sm"
              title="Website"
              onClick={(e) => e.stopPropagation()}
            >
              🌐
            </a>
          )}
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors text-sm"
              title="GitHub"
              onClick={(e) => e.stopPropagation()}
            >
              💻
            </a>
          )}
          {project.twitter_url && (
            <a
              href={project.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors text-sm"
              title="Twitter"
              onClick={(e) => e.stopPropagation()}
            >
              🐦
            </a>
          )}
        </div>
      )}
    </Link>
  );
}

