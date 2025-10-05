'use client';

import { ProjectFormData } from './types';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

interface Step2LinksProps {
  formData: ProjectFormData;
  onChange: (field: keyof ProjectFormData, value: string) => void;
  errors: Record<string, string>;
}

export function Step2Links({ formData, onChange, errors }: Step2LinksProps) {
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${formData.app_id || 'app'}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('project-assets')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      onChange('logo_url', publicUrl);
    } catch (e: any) {
      console.error('Logo upload failed:', e?.message || e);
      onChange('logo_url', '');
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Links & Social Media</h2>
        <p className="text-gray-300">Connect your project's online presence (all optional)</p>
      </div>

      {/* Website URL */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Website URL
        </label>
        <div className="relative">
          <span className="absolute left-4 top-3.5 text-gray-400">🌐</span>
          <input
            type="url"
            value={formData.website_url}
            onChange={(e) => onChange('website_url', e.target.value)}
            placeholder="https://myproject.com"
            className={`w-full pl-12 pr-4 py-3 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 ${
              errors.website_url ? 'border-red-500' : 'border-gray-600'
            }`}
          />
        </div>
        {errors.website_url && (
          <p className="mt-1 text-sm text-red-400">{errors.website_url}</p>
        )}
      </div>

      {/* Logo (Required) */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Logo <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-3.5 text-gray-400">🖼️</span>
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => onChange('logo_url', e.target.value)}
              placeholder="https://... (or upload)"
              className={`w-full pl-12 pr-4 py-3 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 ${
                errors.logo_url ? 'border-red-500' : 'border-gray-600'
              }`}
            />
          </div>
          <label className="inline-flex items-center px-4 py-2 glass-button text-white rounded-md text-sm font-medium hover:bg-white hover:bg-opacity-20 cursor-pointer transition-all">
            {uploading ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }}
              disabled={uploading}
            />
          </label>
        </div>
        {errors.logo_url && (
          <p className="mt-1 text-sm text-red-400">{errors.logo_url}</p>
        )}
      </div>

      {/* GitHub URL */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          GitHub URL
        </label>
        <div className="relative">
          <span className="absolute left-4 top-3.5 text-gray-400">💻</span>
          <input
            type="url"
            value={formData.github_url}
            onChange={(e) => onChange('github_url', e.target.value)}
            placeholder="https://github.com/yourproject"
            className={`w-full pl-12 pr-4 py-3 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 ${
              errors.github_url ? 'border-red-500' : 'border-gray-600'
            }`}
          />
        </div>
        {errors.github_url && (
          <p className="mt-1 text-sm text-red-400">{errors.github_url}</p>
        )}
      </div>

      {/* Twitter URL */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Twitter URL
        </label>
        <div className="relative">
          <span className="absolute left-4 top-3.5 text-gray-400">🐦</span>
          <input
            type="url"
            value={formData.twitter_url}
            onChange={(e) => onChange('twitter_url', e.target.value)}
            placeholder="https://twitter.com/yourproject"
            className={`w-full pl-12 pr-4 py-3 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 ${
              errors.twitter_url ? 'border-red-500' : 'border-gray-600'
            }`}
          />
        </div>
        {errors.twitter_url && (
          <p className="mt-1 text-sm text-red-400">{errors.twitter_url}</p>
        )}
      </div>

      {/* Discord URL */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Discord URL
        </label>
        <div className="relative">
          <span className="absolute left-4 top-3.5 text-gray-400">💬</span>
          <input
            type="url"
            value={formData.discord_url}
            onChange={(e) => onChange('discord_url', e.target.value)}
            placeholder="https://discord.gg/yourserver"
            className={`w-full pl-12 pr-4 py-3 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 ${
              errors.discord_url ? 'border-red-500' : 'border-gray-600'
            }`}
          />
        </div>
        {errors.discord_url && (
          <p className="mt-1 text-sm text-red-400">{errors.discord_url}</p>
        )}
      </div>
    </div>
  );
}

