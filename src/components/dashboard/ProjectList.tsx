'use client';

import { useState } from 'react';
import { Project } from '@/lib/supabase';
import { ProjectCard } from './ProjectCard';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
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
    return <SkeletonLoader type="projects" />;
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
            className="glass-button px-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black bg-opacity-20 border border-white border-opacity-20"
          >
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-gray-800 text-white">
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="glass-button px-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black bg-opacity-20 border border-white border-opacity-20"
          >
            <option value="all" className="bg-gray-800 text-white">All Status</option>
            <option value="pending" className="bg-gray-800 text-white">Pending</option>
            <option value="confirmed" className="bg-gray-800 text-white">Confirmed</option>
            <option value="failed" className="bg-gray-800 text-white">Failed</option>
          </select>

          {/* Results Count */}
          {/* <span className="text-sm text-gray-600">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
          </span> */}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 glass-card rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-white bg-opacity-20 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white bg-opacity-20 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
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

