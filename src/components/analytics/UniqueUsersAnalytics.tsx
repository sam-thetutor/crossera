import React, { useState, useEffect } from 'react';

interface UniqueUsersAnalyticsProps {
  appId: string;
}

interface UserAnalytics {
  project: {
    id: string;
    appId: string;
    appName: string;
    createdAt: string;
  };
  userStats: {
    uniqueUsersCount: number;
    totalUsersTransactions: number;
    totalUsersVolume: string;
    totalUsersFees: string;
    totalUsersRewards: string;
    avgTransactionsPerUser: number;
    lastUpdated: string | null;
  };
  growthMetrics: {
    avgDailyGrowth: number;
    totalDaysActive: number;
    dailyGrowthData: Record<string, number>;
  };
}

interface UniqueUser {
  id: string;
  user_address: string;
  first_transaction_at: string;
  last_transaction_at: string;
  total_transactions: number;
  total_volume: string;
  total_fees: string;
  total_rewards: string;
}

export function UniqueUsersAnalytics({ appId }: UniqueUsersAnalyticsProps) {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [users, setUsers] = useState<UniqueUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'growth'>('overview');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch analytics and users in parallel
        const [analyticsRes, usersRes] = await Promise.all([
          fetch(`/api/projects/${appId}/user-tracking/user-stats`),
          fetch(`/api/projects/${appId}/user-tracking/users?limit=50`)
        ]);

        const [analyticsResult, usersResult] = await Promise.all([
          analyticsRes.json(),
          usersRes.json()
        ]);

        if (analyticsResult.success) {
          setAnalytics(analyticsResult.data);
        } else {
          setError(analyticsResult.error || 'Failed to fetch analytics');
        }

        if (usersResult.success) {
          setUsers(usersResult.data.users);
        }
      } catch (err) {
        setError('Network error while fetching data');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (appId) {
      fetchAnalytics();
    }
  }, [appId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="mr-2">⚠️</span>
          <div className="text-red-800">
            <div className="font-medium">Error loading analytics</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <span className="text-4xl mb-4 block">👥</span>
        <div className="text-gray-600">No analytics data available</div>
      </div>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value: string, decimals: number = 18) => {
    const num = parseFloat(value) / Math.pow(10, decimals);
    return num.toFixed(4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Analytics</h2>
          <p className="text-gray-600">{analytics.project.appName} ({analytics.project.appId})</p>
        </div>
        <div className="text-sm text-gray-500">
          Active for {analytics.growthMetrics.totalDaysActive} days
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'users', label: 'Top Users', icon: '👥' },
            { id: 'growth', label: 'Growth', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <span className="text-3xl mr-3">👥</span>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.userStats.uniqueUsersCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Unique Users</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <span className="text-3xl mr-3">📊</span>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.userStats.totalUsersTransactions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">User Transactions</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <span className="text-3xl mr-3">📈</span>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.userStats.avgTransactionsPerUser.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Avg per User</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <span className="text-3xl mr-3">📅</span>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.growthMetrics.avgDailyGrowth.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Daily Growth</div>
                </div>
              </div>
            </div>
          </div>

          {/* Volume & Rewards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Volume & Fees</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Volume:</span>
                  <span className="font-medium">{formatValue(analytics.userStats.totalUsersVolume)} XFI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Fees:</span>
                  <span className="font-medium">{formatValue(analytics.userStats.totalUsersFees)} XFI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Rewards:</span>
                  <span className="font-medium">{formatValue(analytics.userStats.totalUsersRewards)} XFI</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Active:</span>
                  <span className="font-medium">{analytics.growthMetrics.totalDaysActive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Daily Growth:</span>
                  <span className="font-medium">{analytics.growthMetrics.avgDailyGrowth.toFixed(2)} users</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Project Age:</span>
                  <span className="font-medium">{Math.ceil((Date.now() - new Date(analytics.project.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Transactions/User:</span>
                  <span className="font-medium">{analytics.userStats.avgTransactionsPerUser.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {analytics.userStats.lastUpdated 
                      ? new Date(analytics.userStats.lastUpdated).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Users by Activity</h3>
            <p className="text-sm text-gray-600">Users ranked by total transactions</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {formatAddress(user.user_address)}
                        </div>
                        <span className="ml-2">↗️</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.total_transactions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatValue(user.total_volume)} XFI
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.first_transaction_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.last_transaction_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">👥</span>
              <div className="text-gray-500">No users found</div>
            </div>
          )}
        </div>
      )}

      {/* Growth Tab */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily User Growth (Last 30 Days)</h3>
            
            {Object.keys(analytics.growthMetrics.dailyGrowthData).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(analytics.growthMetrics.dailyGrowthData)
                  .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                  .slice(-14) // Show last 14 days
                  .map(([date, count]) => (
                    <div key={date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm text-gray-600">{new Date(date).toLocaleDateString()}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((count / Math.max(...Object.values(analytics.growthMetrics.dailyGrowthData))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">📅</span>
                <div className="text-gray-500">No growth data available</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
