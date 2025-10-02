'use client';

import { useState } from 'react';
import { Project } from '@/lib/supabase';
import { ProjectCard } from './ProjectCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

interface ProjectListProps {
  projects: Project[];
  loading?: boolean;
}

export function ProjectList({ projects, loading }: ProjectListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Get unique categories
  const categories = ['all', ...new Set(projects.map(p => p.category).filter(Boolean))];

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const categoryMatch = filterCategory === 'all' || project.category === filterCategory;
    const statusMatch = filterStatus === 'all' || project.blockchain_status === filterStatus;
    return categoryMatch && statusMatch;
  });

  if (loading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  return (
    <div>
      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border text-black border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="failed">Failed</option>
          </select>

          {/* Results Count */}
          {/* <span className="text-sm text-gray-600">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
          </span> */}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={
            filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by registering your first project'
          }
          actionLabel={filterCategory === 'all' && filterStatus === 'all' ? 'Register Project' : undefined}
          actionHref={filterCategory === 'all' && filterStatus === 'all' ? '/register' : undefined}
        />
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

