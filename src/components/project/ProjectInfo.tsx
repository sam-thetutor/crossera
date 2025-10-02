'use client';

import { Project } from '@/lib/supabase';
import { BlockchainStatusBadge } from '@/components/shared/BlockchainStatusBadge';
import { CategoryBadge } from '@/components/shared/CategoryBadge';

interface ProjectInfoProps {
  project: Project;
  onEdit: () => void;
  isOwner: boolean;
}

export function ProjectInfo({ project, onEdit, isOwner }: ProjectInfoProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{project.app_name}</h1>
            <p className="text-blue-100 font-mono text-sm">
              ID: {project.app_id}
            </p>
          </div>
          {project.logo_url && (
            <img 
              src={project.logo_url} 
              alt={project.app_name}
              className="w-20 h-20 rounded-lg object-cover border-2 border-white shadow-lg"
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Status and Category */}
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-gray-200">
          <CategoryBadge category={project.category || 'Other'} />
          <BlockchainStatusBadge status={project.blockchain_status} />
          {project.is_active ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
              Inactive
            </span>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{project.description}</p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Owner */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Owner Address</h3>
            <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border">
              {project.owner_address}
            </p>
          </div>

          {/* Blockchain Transaction */}
          {project.blockchain_tx_hash && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Transaction Hash</h3>
              <a
                href={`https://scan.testnet.crossfi.org/tx/${project.blockchain_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline font-mono"
              >
                {project.blockchain_tx_hash.slice(0, 10)}...{project.blockchain_tx_hash.slice(-8)}
              </a>
            </div>
          )}

          {/* Created Date */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Created</h3>
            <p className="text-sm text-gray-600">{formatDate(project.created_at)}</p>
          </div>

          {/* Last Updated */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Last Updated</h3>
            <p className="text-sm text-gray-600">{formatDate(project.updated_at)}</p>
          </div>
        </div>

        {/* Links */}
        {(project.website_url || project.github_url || project.twitter_url || project.discord_url) && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Links</h3>
            <div className="flex flex-wrap gap-3">
              {project.website_url && (
                <a
                  href={project.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  🌐 Website
                </a>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  💻 GitHub
                </a>
              )}
              {project.twitter_url && (
                <a
                  href={project.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  🐦 Twitter
                </a>
              )}
              {project.discord_url && (
                <a
                  href={project.discord_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  💬 Discord
                </a>
              )}
            </div>
          </div>
        )}

        {/* Edit Button */}
        {isOwner && (
          <button
            onClick={onEdit}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Project Information
          </button>
        )}
      </div>
    </div>
  );
}

