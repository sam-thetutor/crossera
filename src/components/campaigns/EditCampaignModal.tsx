'use client';

import { useState, useEffect } from 'react';
import { CAMPAIGN_CATEGORIES } from './types';

interface Campaign {
  id: string;
  campaign_id: number;
  name: string;
  description?: string;
  banner_image_url?: string;
  logo_url?: string;
  category?: string;
  eligibility_criteria?: string;
  terms_url?: string;
  website_url?: string;
  twitter_url?: string;
  discord_url?: string;
}

interface EditCampaignModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCampaignModal({ campaign, isOpen, onClose, onSuccess }: EditCampaignModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    banner_image_url: '',
    logo_url: '',
    eligibility_criteria: '',
    terms_url: '',
    website_url: '',
    twitter_url: '',
    discord_url: ''
  });

  useEffect(() => {
    if (isOpen && campaign) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        category: campaign.category || 'General',
        banner_image_url: campaign.banner_image_url || '',
        logo_url: campaign.logo_url || '',
        eligibility_criteria: campaign.eligibility_criteria || '',
        terms_url: campaign.terms_url || '',
        website_url: campaign.website_url || '',
        twitter_url: campaign.twitter_url || '',
        discord_url: campaign.discord_url || ''
      });
      setError(null);
    }
  }, [isOpen, campaign]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/campaigns/${campaign.campaign_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update campaign');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">Edit Campaign</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none transition-colors p-1 hover:bg-white hover:bg-opacity-10 rounded-lg"
            >
              ×
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg">
              <p className="text-sm font-medium text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 resize-none"
                />
                <p className="mt-1 text-sm text-gray-400">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
                >
                  {CAMPAIGN_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-gray-800 text-white">{cat}</option>
                  ))}
                </select>
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                />
              </div>

              {/* Banner URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Banner Image URL
                </label>
                <input
                  type="url"
                  value={formData.banner_image_url}
                  onChange={(e) => handleChange('banner_image_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                />
              </div>

              {/* Eligibility Criteria */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Eligibility Criteria
                </label>
                <textarea
                  value={formData.eligibility_criteria}
                  onChange={(e) => handleChange('eligibility_criteria', e.target.value)}
                  rows={3}
                  placeholder="Who can participate..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 resize-none"
                />
              </div>

              {/* Terms URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Terms & Conditions URL
                </label>
                <input
                  type="url"
                  value={formData.terms_url}
                  onChange={(e) => handleChange('terms_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => handleChange('website_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                />
              </div>

              {/* Twitter URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Twitter URL
                </label>
                <input
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => handleChange('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                />
              </div>

              {/* Discord URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discord URL
                </label>
                <input
                  type="url"
                  value={formData.discord_url}
                  onChange={(e) => handleChange('discord_url', e.target.value)}
                  placeholder="https://discord.gg/..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                />
              </div>

              {/* Note */}
              
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 mt-6 -mx-6 -mb-6 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-300 font-semibold rounded-lg hover:text-white hover:bg-white hover:bg-opacity-10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

