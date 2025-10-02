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
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

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
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner message="Loading project..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Project Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'The project you\'re looking for doesn\'t exist'}
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          {isConnected && (
            <>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                Dashboard
              </Link>
              <span className="text-gray-400">/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{project.app_name}</span>
        </nav>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Project Details
            </h1>
            <p className="text-gray-600">
              {isOwner ? 'Manage your project information and track performance' : 'View project information'}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="mt-4 sm:mt-0 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
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
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Project'}
                  </button>
                  <Link
                    href="/campaigns"
                    className="block w-full px-4 py-2 bg-purple-600 text-white text-center font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Join Campaign
                  </Link>
                  {project.blockchain_tx_hash && (
                    <a
                      href={`https://scan.testnet.crossfi.org/tx/${project.blockchain_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-2 bg-gray-600 text-white text-center font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      View on Explorer
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Project Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">About CrossEra</h3>
              <p className="text-sm text-gray-700 mb-4">
                CrossEra rewards developers for building on CrossFi. Track your transactions and earn XFI tokens automatically.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-700">
                  <span className="mr-2">✓</span>
                  Automatic reward calculation
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="mr-2">✓</span>
                  Transparent on-chain tracking
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="mr-2">✓</span>
                  Campaign-based incentives
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

