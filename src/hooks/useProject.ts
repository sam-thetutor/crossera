'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/supabase';

interface UseProjectReturn {
  project: Project | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProject: (updates: Partial<Project>) => Promise<void>;
}

export function useProject(appId: string): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async () => {
    if (!appId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${appId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch project');
      }

      setProject(data.project);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch project';
      setError(message);
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (updates: Partial<Project>) => {
    if (!appId) return;

    try {
      const response = await fetch(`/api/projects/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update project');
      }

      setProject(data.project);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      throw new Error(message);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [appId]);

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
    updateProject
  };
}

