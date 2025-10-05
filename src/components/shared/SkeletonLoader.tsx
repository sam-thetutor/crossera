'use client';

interface SkeletonLoaderProps {
  type?: 'stats' | 'project' | 'projects' | 'project-details' | 'profile';
}

export function SkeletonLoader({ type = 'stats' }: SkeletonLoaderProps) {
  // Stats skeleton loader
  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="glass-card rounded-lg p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-white bg-opacity-20 rounded w-20 mb-2"></div>
                <div className="h-8 bg-white bg-opacity-20 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Single project skeleton loader
  if (type === 'project') {
    return (
      <div className="glass-card rounded-lg p-4 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="h-5 bg-white bg-opacity-20 rounded w-3/4 mb-2"></div>
          </div>
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg"></div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 bg-white bg-opacity-20 rounded-full w-16"></div>
          <div className="h-6 bg-white bg-opacity-20 rounded-full w-20"></div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="h-3 bg-white bg-opacity-20 rounded w-20 mb-1"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded w-8"></div>
          </div>
          <div>
            <div className="h-3 bg-white bg-opacity-20 rounded w-16 mb-1"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded w-12"></div>
          </div>
        </div>

        {/* Users */}
        <div className="mb-3">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white bg-opacity-20 rounded mr-2"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded w-16"></div>
          </div>
        </div>

        {/* Links */}
        <div className="flex items-center gap-2 pt-2 border-t border-white border-opacity-10">
          <div className="w-4 h-4 bg-white bg-opacity-20 rounded"></div>
          <div className="w-4 h-4 bg-white bg-opacity-20 rounded"></div>
          <div className="w-4 h-4 bg-white bg-opacity-20 rounded"></div>
        </div>
      </div>
    );
  }

  // Projects grid skeleton loader
  if (type === 'projects') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="glass-card rounded-lg p-4 animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="h-5 bg-white bg-opacity-20 rounded w-3/4 mb-2"></div>
              </div>
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg"></div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 bg-white bg-opacity-20 rounded-full w-16"></div>
              <div className="h-6 bg-white bg-opacity-20 rounded-full w-20"></div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="h-3 bg-white bg-opacity-20 rounded w-20 mb-1"></div>
                <div className="h-4 bg-white bg-opacity-20 rounded w-8"></div>
              </div>
              <div>
                <div className="h-3 bg-white bg-opacity-20 rounded w-16 mb-1"></div>
                <div className="h-4 bg-white bg-opacity-20 rounded w-12"></div>
              </div>
            </div>

            {/* Users */}
            <div className="mb-3">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white bg-opacity-20 rounded mr-2"></div>
                <div className="h-4 bg-white bg-opacity-20 rounded w-16"></div>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-2 pt-2 border-t border-white border-opacity-10">
              <div className="w-4 h-4 bg-white bg-opacity-20 rounded"></div>
              <div className="w-4 h-4 bg-white bg-opacity-20 rounded"></div>
              <div className="w-4 h-4 bg-white bg-opacity-20 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Project details skeleton loader
  if (type === 'project-details') {
    return (
      <div className="min-h-screen gradient-bg-hero pt-24 pb-8">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          {/* Breadcrumb skeleton */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-4 bg-white bg-opacity-20 rounded w-12 animate-pulse"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded w-2 animate-pulse"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded w-2 animate-pulse"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded w-24 animate-pulse"></div>
          </div>

          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div className="flex-1">
              <div className="h-8 bg-white bg-opacity-20 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-5 bg-white bg-opacity-20 rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-10 bg-white bg-opacity-20 rounded w-32 mt-4 sm:mt-0 animate-pulse"></div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Info Card */}
              <div className="glass-card rounded-lg p-6 animate-pulse">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="h-8 bg-white bg-opacity-20 rounded w-48 mb-2"></div>
                    <div className="h-5 bg-white bg-opacity-20 rounded w-64 mb-4"></div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 bg-white bg-opacity-20 rounded-full w-16"></div>
                      <div className="h-6 bg-white bg-opacity-20 rounded-full w-20"></div>
                    </div>
                  </div>
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-lg"></div>
                </div>

                {/* Description */}
                <div className="space-y-2 mb-6">
                  <div className="h-4 bg-white bg-opacity-20 rounded w-full"></div>
                  <div className="h-4 bg-white bg-opacity-20 rounded w-3/4"></div>
                  <div className="h-4 bg-white bg-opacity-20 rounded w-1/2"></div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-white border-opacity-10">
                  <div>
                    <div className="h-3 bg-white bg-opacity-20 rounded w-16 mb-2"></div>
                    <div className="h-6 bg-white bg-opacity-20 rounded w-12"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-white bg-opacity-20 rounded w-12 mb-2"></div>
                    <div className="h-6 bg-white bg-opacity-20 rounded w-16"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-white bg-opacity-20 rounded w-14 mb-2"></div>
                    <div className="h-6 bg-white bg-opacity-20 rounded w-10"></div>
                  </div>
                </div>

                {/* Links */}
                <div className="flex items-center gap-3 pt-4 border-t border-white border-opacity-10">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded"></div>
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded"></div>
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded"></div>
                </div>
              </div>

              {/* Transaction History Card */}
              <div className="glass-card rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-white bg-opacity-20 rounded w-40 mb-4"></div>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-white border-opacity-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-white bg-opacity-20 rounded w-32 mb-1"></div>
                          <div className="h-3 bg-white bg-opacity-20 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-white bg-opacity-20 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-white bg-opacity-20 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Stats & Actions */}
            <div className="space-y-6">
              {/* Project Stats Card */}
              <div className="glass-card rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-white bg-opacity-20 rounded w-32 mb-4"></div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="h-4 bg-white bg-opacity-20 rounded w-20"></div>
                    <div className="h-4 bg-white bg-opacity-20 rounded w-16"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-white bg-opacity-20 rounded w-24"></div>
                    <div className="h-4 bg-white bg-opacity-20 rounded w-12"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-white bg-opacity-20 rounded w-28"></div>
                    <div className="h-4 bg-white bg-opacity-20 rounded w-14"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-white bg-opacity-20 rounded w-18"></div>
                    <div className="h-4 bg-white bg-opacity-20 rounded w-10"></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="glass-card rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-white bg-opacity-20 rounded w-28 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-10 bg-white bg-opacity-20 rounded w-full"></div>
                  <div className="h-10 bg-white bg-opacity-20 rounded w-full"></div>
                  <div className="h-10 bg-white bg-opacity-20 rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile skeleton loader
  if (type === 'profile') {
    return (
      <div className="min-h-screen gradient-bg-hero pt-24 pb-12">
        <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="glass-card p-6 mb-8 animate-pulse">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full"></div>
              
              {/* User Info */}
              <div className="flex-1">
                <div className="h-8 bg-white bg-opacity-20 rounded w-32 mb-2"></div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-white bg-opacity-20 rounded w-12"></div>
                    <div className="h-6 bg-white bg-opacity-20 rounded w-24"></div>
                    <div className="w-6 h-6 bg-white bg-opacity-20 rounded"></div>
                  </div>
                </div>
                
                {/* Balance Display */}
                <div className="flex items-center gap-4">
                  <div>
                    <div className="h-8 bg-white bg-opacity-20 rounded w-32 mb-1"></div>
                    <div className="h-4 bg-white bg-opacity-20 rounded w-24"></div>
                  </div>
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded"></div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="h-10 bg-white bg-opacity-20 rounded w-32"></div>
                <div className="h-10 bg-white bg-opacity-20 rounded w-36"></div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="glass-card p-6 text-center animate-pulse">
                <div className="h-8 bg-white bg-opacity-20 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-white bg-opacity-20 rounded w-20 mx-auto"></div>
              </div>
            ))}
          </div>

          {/* Recent Projects */}
          <div className="glass-card p-6 mb-8 animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-white bg-opacity-20 rounded w-32"></div>
              <div className="h-10 bg-white bg-opacity-20 rounded w-28"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="glass-card p-6">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-white bg-opacity-20 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-white bg-opacity-20 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-white bg-opacity-20 rounded-full w-16"></div>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-4 space-y-2">
                    <div className="h-4 bg-white bg-opacity-20 rounded w-full"></div>
                    <div className="h-4 bg-white bg-opacity-20 rounded w-2/3"></div>
                    <div className="h-4 bg-white bg-opacity-20 rounded w-1/2"></div>
                  </div>
                  
                  {/* Project Stats */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-white bg-opacity-20 rounded w-12"></div>
                      <div className="h-3 bg-white bg-opacity-20 rounded w-16"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-white bg-opacity-20 rounded w-14"></div>
                      <div className="h-3 bg-white bg-opacity-20 rounded w-20"></div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="pt-2 border-t border-white border-opacity-10">
                    <div className="h-10 bg-white bg-opacity-20 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
