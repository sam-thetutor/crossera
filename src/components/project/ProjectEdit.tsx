'use client';

import { useState } from 'react';
import { Project } from '@/lib/supabase';
import { CATEGORIES } from '@/components/register/types';
import { validators } from '@/lib/formValidation';

interface ProjectEditProps {
  project: Project;
  onSave: (updates: Partial<Project>) => Promise<void>;
  onCancel: () => void;
}

export function ProjectEdit({ project, onSave, onCancel }: ProjectEditProps) {
  const [formData, setFormData] = useState({
    app_name: project.app_name,
    description: project.description || '',
    category: project.category || 'Other',
    website_url: project.website_url || '',
    logo_url: project.logo_url || '',
    github_url: project.github_url || '',
    twitter_url: project.twitter_url || '',
    discord_url: project.discord_url || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: Record<string, string> = {};
    
    const nameError = validators.appName(formData.app_name);
    if (nameError) newErrors.app_name = nameError;

    const urlFields = ['website_url', 'logo_url', 'github_url', 'twitter_url', 'discord_url'];
    urlFields.forEach(field => {
      const error = validators.url(formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      await onSave(formData);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Project</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* App Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            App Name *
          </label>
          <input
            type="text"
            value={formData.app_name}
            onChange={(e) => handleChange('app_name', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.app_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.app_name && (
            <p className="mt-1 text-sm text-red-600">{errors.app_name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length}/1000 characters
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={formData.website_url}
            onChange={(e) => handleChange('website_url', e.target.value)}
            placeholder="https://"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.website_url ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.website_url && (
            <p className="mt-1 text-sm text-red-600">{errors.website_url}</p>
          )}
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo URL
          </label>
          <input
            type="url"
            value={formData.logo_url}
            onChange={(e) => handleChange('logo_url', e.target.value)}
            placeholder="https://"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.logo_url ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.logo_url && (
            <p className="mt-1 text-sm text-red-600">{errors.logo_url}</p>
          )}
        </div>

        {/* GitHub */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub URL
          </label>
          <input
            type="url"
            value={formData.github_url}
            onChange={(e) => handleChange('github_url', e.target.value)}
            placeholder="https://github.com/"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.github_url ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.github_url && (
            <p className="mt-1 text-sm text-red-600">{errors.github_url}</p>
          )}
        </div>

        {/* Twitter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Twitter URL
          </label>
          <input
            type="url"
            value={formData.twitter_url}
            onChange={(e) => handleChange('twitter_url', e.target.value)}
            placeholder="https://twitter.com/"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.twitter_url ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.twitter_url && (
            <p className="mt-1 text-sm text-red-600">{errors.twitter_url}</p>
          )}
        </div>

        {/* Discord */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discord URL
          </label>
          <input
            type="url"
            value={formData.discord_url}
            onChange={(e) => handleChange('discord_url', e.target.value)}
            placeholder="https://discord.gg/"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.discord_url ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.discord_url && (
            <p className="mt-1 text-sm text-red-600">{errors.discord_url}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

