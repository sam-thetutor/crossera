'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/supabase';

interface UseProjectsOptions {
  owner?: string;
  category?: string;
  search?: string;
  autoFetch?: boolean;
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const { owner, category, search, autoFetch = true } = options;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (owner) params.append('owner', owner);
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const url = `/api/projects/register${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      setProjects(data.projects || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(message);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchProjects();
    }
  }, [owner, category, search, autoFetch]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects
  };
}

