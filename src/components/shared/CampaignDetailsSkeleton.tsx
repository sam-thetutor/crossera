'use client';

export function CampaignDetailsSkeleton() {
  return (
    <div className="min-h-screen gradient-bg-hero">
      <style jsx>{`
        .skeleton-pulse {
          animation: skeleton-pulse 2s ease-in-out infinite;
        }
        
        @keyframes skeleton-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pt-24 pb-8">
        {/* Back Button */}
        <div className="mb-6">
          <div className="h-4 bg-gray-600 rounded w-32 skeleton-pulse"></div>
        </div>

        {/* Header Card */}
        <div className="glass-card p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Logo skeleton */}
              <div className="w-16 h-16 bg-gray-600 rounded-lg skeleton-pulse"></div>
              <div>
                {/* Title skeleton */}
                <div className="h-8 bg-gray-600 rounded w-64 mb-2 skeleton-pulse"></div>
                {/* Status and category badges skeleton */}
                <div className="flex items-center gap-3">
                  <div className="h-6 bg-gray-600 rounded-full w-20 skeleton-pulse"></div>
                  <div className="h-6 bg-gray-600 rounded-full w-16 skeleton-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Description skeleton */}
          <div className="space-y-2 mb-6">
            <div className="h-4 bg-gray-600 rounded w-full skeleton-pulse"></div>
            <div className="h-4 bg-gray-600 rounded w-3/4 skeleton-pulse"></div>
          </div>

          {/* Social Links skeleton */}
          <div className="flex gap-3 mb-6">
            <div className="h-10 bg-gray-600 rounded-lg w-20 skeleton-pulse"></div>
            <div className="h-10 bg-gray-600 rounded-lg w-20 skeleton-pulse"></div>
            <div className="h-10 bg-gray-600 rounded-lg w-20 skeleton-pulse"></div>
          </div>

          {/* Tags skeleton */}
          <div className="flex flex-wrap gap-2">
            <div className="h-6 bg-gray-600 rounded-full w-16 skeleton-pulse"></div>
            <div className="h-6 bg-gray-600 rounded-full w-20 skeleton-pulse"></div>
            <div className="h-6 bg-gray-600 rounded-full w-14 skeleton-pulse"></div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="h-3 bg-gray-600 rounded w-16 skeleton-pulse"></div>
                    <div className="w-6 h-6 bg-gray-600 rounded skeleton-pulse"></div>
                  </div>
                  <div className="h-6 bg-gray-600 rounded w-20 mb-1 skeleton-pulse"></div>
                  <div className="h-3 bg-gray-600 rounded w-12 skeleton-pulse"></div>
                </div>
              ))}
            </div>

            {/* Tabs Card */}
            <div className="glass-card overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-white border-opacity-20">
                <div className="flex-1 px-6 py-4">
                  <div className="h-4 bg-gray-600 rounded w-16 skeleton-pulse"></div>
                </div>
                <div className="flex-1 px-6 py-4">
                  <div className="h-4 bg-gray-600 rounded w-20 skeleton-pulse"></div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 space-y-6">
                {/* Timeline skeleton */}
                <div>
                  <div className="h-6 bg-gray-600 rounded w-32 mb-4 skeleton-pulse"></div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-600 rounded w-20 skeleton-pulse"></div>
                      <div className="h-4 bg-gray-600 rounded w-32 skeleton-pulse"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-600 rounded w-16 skeleton-pulse"></div>
                      <div className="h-4 bg-gray-600 rounded w-32 skeleton-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Eligibility skeleton */}
                <div>
                  <div className="h-6 bg-gray-600 rounded w-24 mb-4 skeleton-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-600 rounded w-full skeleton-pulse"></div>
                    <div className="h-4 bg-gray-600 rounded w-3/4 skeleton-pulse"></div>
                  </div>
                </div>

                {/* Pool Distribution skeleton */}
                <div>
                  <div className="h-6 bg-gray-600 rounded w-32 mb-4 skeleton-pulse"></div>
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-gray-600 rounded w-20 skeleton-pulse"></div>
                      <div className="h-4 bg-gray-600 rounded w-16 skeleton-pulse"></div>
                    </div>
                    <div className="h-3 bg-gray-600 rounded-full w-full skeleton-pulse"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="h-3 bg-gray-600 rounded w-16 mx-auto mb-1 skeleton-pulse"></div>
                      <div className="h-5 bg-gray-600 rounded w-20 mx-auto skeleton-pulse"></div>
                    </div>
                    <div>
                      <div className="h-3 bg-gray-600 rounded w-20 mx-auto mb-1 skeleton-pulse"></div>
                      <div className="h-5 bg-gray-600 rounded w-16 mx-auto skeleton-pulse"></div>
                    </div>
                    <div>
                      <div className="h-3 bg-gray-600 rounded w-16 mx-auto mb-1 skeleton-pulse"></div>
                      <div className="h-5 bg-gray-600 rounded w-18 mx-auto skeleton-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Stats */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="glass-card p-6">
              <div className="h-6 bg-gray-600 rounded w-16 mb-4 skeleton-pulse"></div>
              <div className="space-y-3">
                <div className="h-12 bg-gray-600 rounded-lg w-full skeleton-pulse"></div>
                <div className="h-12 bg-gray-600 rounded-lg w-full skeleton-pulse"></div>
              </div>
            </div>

            {/* Creator Info */}
            <div className="glass-card p-6">
              <div className="h-6 bg-gray-600 rounded w-32 mb-4 skeleton-pulse"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full skeleton-pulse"></div>
                <div>
                  <div className="h-4 bg-gray-600 rounded w-24 mb-1 skeleton-pulse"></div>
                  <div className="h-3 bg-gray-600 rounded w-12 skeleton-pulse"></div>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="glass-card p-6">
              <div className="h-6 bg-gray-600 rounded w-20 mb-4 skeleton-pulse"></div>
              <div className="h-4 bg-gray-600 rounded w-32 skeleton-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
