'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useProject } from '@/hooks/useProject';
import { ProjectInfo } from '@/components/project/ProjectInfo';
import { ProjectEdit } from '@/components/project/ProjectEdit';
import { ProjectStats } from '@/components/project/ProjectStats';
import { TransactionHistory } from '@/components/project/TransactionHistory';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const appId = params.appId as string;
  
  const { project, loading, error, updateProject } = useProject(appId);
  const [isEditing, setIsEditing] = useState(false);

  // Check if current user is the owner
  const isOwner = project && address ? 
    project.owner_address.toLowerCase() === address.toLowerCase() : 
    false;

  // Handle project update
  const handleSave = async (updates: any) => {
    try {
      await updateProject(updates);
      setIsEditing(false);
    } catch (err) {
      throw err; // Re-throw to be handled by ProjectEdit
    }
  };

  // Loading state
  if (loading) {
    return <SkeletonLoader type="project-details" />;
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen gradient-bg-hero pt-24 pb-12">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="glass-card p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Project Not Found
            </h2>
            <p className="text-gray-300 mb-6">
              {error || 'The project you\'re looking for doesn\'t exist'}
            </p>
            <Link
              href="/dashboard"
              className="glass-button inline-block px-6 py-3 font-semibold rounded-lg"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-hero pt-24 pb-8">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/" className="text-gray-400 hover:text-white">
            Home
          </Link>
          <span className="text-gray-500">/</span>
          {isConnected && (
            <>
              <Link href="/dashboard" className="text-gray-400 hover:text-white">
                Dashboard
              </Link>
              <span className="text-gray-500">/</span>
            </>
          )}
          <span className="text-white font-medium">{project.app_name}</span>
        </nav>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Project Details
            </h1>
            <p className="text-gray-300">
              {isOwner ? 'Manage your project information and track performance' : 'View project information'}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="glass-button mt-4 sm:mt-0 px-4 py-2 font-medium rounded-lg"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info or Edit Form */}
            {isEditing ? (
              <ProjectEdit
                project={project}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <ProjectInfo
                project={project}
                onEdit={() => setIsEditing(true)}
                isOwner={isOwner}
              />
            )}

            {/* Transaction History */}
            <TransactionHistory projectId={project.id} />
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Project Stats */}
            <ProjectStats project={project} />

            {/* Quick Actions */}
            {isOwner && (
              <div className="glass-card rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="glass-button w-full px-4 py-2 font-medium rounded-lg"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Project'}
                  </button>
                  <Link
                    href="/campaigns"
                    className="glass-button block w-full px-4 py-2 text-center font-medium rounded-lg"
                  >
                    Join Campaign
                  </Link>
                  {project.blockchain_tx_hash && (
                    <a
                      href={`https://scan.crossfi.org/tx/${project.blockchain_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button block w-full px-4 py-2 text-center font-medium rounded-lg"
                    >
                      View on Explorer
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Project Info Card */}
            
          </div>
        </div>
      </div>
    </div>
  );
}

