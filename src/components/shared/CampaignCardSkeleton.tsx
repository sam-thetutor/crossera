'use client';

interface CampaignCardSkeletonProps {
  count?: number;
}

export function CampaignCardSkeleton({ count = 6 }: CampaignCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="glass-card animate-pulse"
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          {/* Banner skeleton */}
          {/* <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          </div> */}

          {/* Content skeleton */}
          <div className="p-6">
            {/* Title and status */}
            <div className="flex items-start justify-between mb-3">
              <div className="h-5 bg-gray-600 rounded w-3/4"></div>
              <div className="h-6 bg-gray-600 rounded-full w-16"></div>
            </div>

            {/* Description */}
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-gray-600 rounded w-full"></div>
              <div className="h-3 bg-gray-600 rounded w-2/3"></div>
            </div>

            {/* Stats */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <div className="h-3 bg-gray-600 rounded w-20"></div>
                <div className="h-3 bg-gray-600 rounded w-16"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-600 rounded w-24"></div>
                <div className="h-3 bg-gray-600 rounded w-16"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-600 rounded w-28"></div>
                <div className="h-3 bg-gray-600 rounded w-8"></div>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-1 mb-4">
              <div className="h-3 bg-gray-600 rounded w-32"></div>
              <div className="h-3 bg-gray-600 rounded w-28"></div>
            </div>

            {/* Button */}
            <div className="h-10 bg-gray-600 rounded-lg w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
