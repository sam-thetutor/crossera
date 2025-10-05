import React, { useState, useEffect } from 'react';

interface UniqueUsersWidgetProps {
  appId: string;
  className?: string;
}

interface UserStats {
  uniqueUsersCount: number;
  totalUsersTransactions: number;
  avgTransactionsPerUser: number;
  avgDailyGrowth: number;
  lastUpdated: string | null;
}

export function UniqueUsersWidget({ appId, className = '' }: UniqueUsersWidgetProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${appId}/user-tracking/user-stats`);
        const result = await response.json();

        if (result.success) {
          setStats(result.data.userStats);
        } else {
          setError(result.error || 'Failed to fetch user stats');
        }
      } catch (err) {
        setError('Network error while fetching user stats');
        console.error('Error fetching user stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (appId) {
      fetchUserStats();
    }
  }, [appId]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="text-red-600 text-sm">
          <span className="mr-2">⚠️</span>
          Error loading user stats: {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-gray-500 text-sm">No user data available</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-2">👥</span>
          <h3 className="text-lg font-semibold text-gray-900">Unique Users</h3>
        </div>
        {stats.lastUpdated && (
          <span className="text-xs text-gray-500">
            Updated {new Date(stats.lastUpdated).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Unique Users Count */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.uniqueUsersCount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total unique users</div>
          </div>
          {stats.avgDailyGrowth > 0 && (
            <div className="flex items-center text-green-600">
              <span className="mr-1">📈</span>
              <span className="text-sm font-medium">
                +{stats.avgDailyGrowth.toFixed(1)}/day
              </span>
            </div>
          )}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.totalUsersTransactions.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">User transactions</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.avgTransactionsPerUser.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Avg per user</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for dashboard cards
export function UniqueUsersWidgetCompact({ appId }: { appId: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(`/api/projects/${appId}/user-tracking/user-stats`);
        const result = await response.json();

        if (result.success) {
          setCount(result.data.userStats.uniqueUsersCount);
        }
      } catch (err) {
        console.error('Error fetching user count:', err);
      } finally {
        setLoading(false);
      }
    };

    if (appId) {
      fetchCount();
    }
  }, [appId]);

  if (loading) {
    return (
    <div className="flex items-center">
      <span className="mr-2">👥</span>
      <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
    </div>
    );
  }

  return (
    <div className="flex items-center">
      <span className="mr-2">👥</span>
      <span className="text-sm font-medium text-gray-900">
        {count?.toLocaleString() || '0'} users
      </span>
    </div>
  );
}
