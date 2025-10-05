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
    <div className="glass-card rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border-b border-white border-opacity-20 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{project.app_name}</h1>
            <p className="text-gray-300 font-mono text-sm">
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
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-white border-opacity-10">
          <CategoryBadge category={project.category || 'Other'} />
          <BlockchainStatusBadge status={project.blockchain_tx_hash ? 'confirmed' : 'pending'} />
        </div>

        {/* Description */}
        {project.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
            <p className="text-gray-400 leading-relaxed">{project.description}</p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Owner */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Owner Address</h3>
            <p className="text-sm text-white font-mono bg-black bg-opacity-20 px-3 py-2 rounded border border-white border-opacity-10 backdrop-blur-sm">
              {project.owner_address}
            </p>
          </div>

          {/* Blockchain Transaction */}
          {project.blockchain_tx_hash && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Transaction Hash</h3>
              <a
                href={`https://scan.crossfi.org/tx/${project.blockchain_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline font-mono"
              >
                {project.blockchain_tx_hash.slice(0, 10)}...{project.blockchain_tx_hash.slice(-8)}
              </a>
            </div>
          )}

          {/* Created Date */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Created</h3>
            <p className="text-sm text-gray-400">{formatDate(project.created_at)}</p>
          </div>

          {/* Last Updated */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Last Updated</h3>
            <p className="text-sm text-gray-400">{formatDate(project.updated_at)}</p>
          </div>
        </div>

        {/* Links */}
        {(project.website_url || project.github_url || project.twitter_url || project.discord_url) && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Links</h3>
            <div className="flex flex-wrap gap-3">
              {project.website_url && (
                <a
                  href={project.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  🌐 Website
                </a>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  💻 GitHub
                </a>
              )}
              {project.twitter_url && (
                <a
                  href={project.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  🐦 Twitter
                </a>
              )}
              {project.discord_url && (
                <a
                  href={project.discord_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
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
            className="glass-button w-full px-4 py-3 font-semibold rounded-lg"
          >
            Edit Project Information
          </button>
        )}
      </div>
    </div>
  );
}

