'use client';

import { useState, useEffect } from 'react';

interface PlatformStats {
  totalProjects: number;
  activeProjects: number;
  activeCampaigns: number;
  totalRewards: string;
  totalTransactions: number;
  categoriesDistribution: Record<string, number>;
}

interface UseProjectStatsReturn {
  stats: PlatformStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProjectStats(owner?: string): UseProjectStatsReturn {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = owner 
        ? `/api/projects/stats?owner=${owner}`
        : '/api/projects/stats';
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      setStats(data.platformStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(message);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [owner]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}

