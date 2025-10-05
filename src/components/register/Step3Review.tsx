'use client';

import { ProjectFormData } from './types';
import { CategoryBadge } from '@/components/shared/CategoryBadge';

interface Step3ReviewProps {
  formData: ProjectFormData;
  onEdit: (step: number) => void;
}

export function Step3Review({ formData, onEdit }: Step3ReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Review Your Information</h2>
        <p className="text-gray-300">Please review all details before submitting</p>
      </div>

      {/* Basic Info Section */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Basic Information</h3>
          <button
            onClick={() => onEdit(0)}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
          >
            Edit
          </button>
        </div>
        <div className="flex gap-6">
          {/* Left side - Basic info */}
          <div className="flex-1">
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-400">App Name</dt>
                <dd className="mt-1 text-sm text-white">{formData.app_name}</dd>
              </div>
              {formData.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-400">Description</dt>
                  <dd className="mt-1 text-sm text-white">{formData.description}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-400">Category</dt>
                <dd className="mt-1">
                  <CategoryBadge category={formData.category} />
                </dd>
              </div>
            </dl>
          </div>
          
          {/* Right side - Logo */}
          {formData.logo_url && (
            <div className="flex-shrink-0">
              <dt className="text-sm font-medium text-gray-400 mb-2">Logo</dt>
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-700 border border-gray-600">
                <img
                  src={formData.logo_url}
                  alt={`${formData.app_name} logo`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Links Section */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Links & Social Media</h3>
          <button
            onClick={() => onEdit(1)}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
          >
            Edit
          </button>
        </div>
        <dl className="space-y-3">
          {formData.website_url && (
            <div>
              <dt className="text-sm font-medium text-gray-400">Website</dt>
              <dd className="mt-1">
                <a
                  href={formData.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                >
                  {formData.website_url}
                </a>
              </dd>
            </div>
          )}
          {formData.github_url && (
            <div>
              <dt className="text-sm font-medium text-gray-400">GitHub</dt>
              <dd className="mt-1">
                <a
                  href={formData.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                >
                  {formData.github_url}
                </a>
              </dd>
            </div>
          )}
          {formData.twitter_url && (
            <div>
              <dt className="text-sm font-medium text-gray-400">Twitter</dt>
              <dd className="mt-1">
                <a
                  href={formData.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                >
                  {formData.twitter_url}
                </a>
              </dd>
            </div>
          )}
          {formData.discord_url && (
            <div>
              <dt className="text-sm font-medium text-gray-400">Discord</dt>
              <dd className="mt-1">
                <a
                  href={formData.discord_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                >
                  {formData.discord_url}
                </a>
              </dd>
            </div>
          )}
        </dl>
        {!formData.website_url && 
         !formData.github_url && 
         !formData.twitter_url && 
         !formData.discord_url && (
          <p className="text-sm text-gray-400 italic">No links provided</p>
        )}
      </div>

      {/* Next Steps Info
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Next Steps</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Your project will be saved to the database</li>
          <li>You'll be prompted to sign a blockchain transaction</li>
          <li>Your project will be registered on-chain</li>
          <li>You can start earning rewards!</li>
        </ol>
      </div> */}
    </div>
  );
}

