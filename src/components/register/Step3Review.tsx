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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Information</h2>
        <p className="text-gray-600">Please review all details before submitting</p>
      </div>

      {/* Basic Info Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          <button
            onClick={() => onEdit(0)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">App Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{formData.app_name}</dd>
          </div>
          {formData.description && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.description}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Category</dt>
            <dd className="mt-1">
              <CategoryBadge category={formData.category} />
            </dd>
          </div>
        </dl>
      </div>

      {/* Links Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Links & Social Media</h3>
          <button
            onClick={() => onEdit(1)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <dl className="space-y-3">
          {formData.website_url && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Website</dt>
              <dd className="mt-1">
                <a
                  href={formData.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {formData.website_url}
                </a>
              </dd>
            </div>
          )}
          {formData.logo_url && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Logo</dt>
              <dd className="mt-1">
                <a
                  href={formData.logo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {formData.logo_url}
                </a>
              </dd>
            </div>
          )}
          {formData.github_url && (
            <div>
              <dt className="text-sm font-medium text-gray-500">GitHub</dt>
              <dd className="mt-1">
                <a
                  href={formData.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {formData.github_url}
                </a>
              </dd>
            </div>
          )}
          {formData.twitter_url && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Twitter</dt>
              <dd className="mt-1">
                <a
                  href={formData.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {formData.twitter_url}
                </a>
              </dd>
            </div>
          )}
          {formData.discord_url && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Discord</dt>
              <dd className="mt-1">
                <a
                  href={formData.discord_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {formData.discord_url}
                </a>
              </dd>
            </div>
          )}
        </dl>
        {!formData.website_url && 
         !formData.logo_url && 
         !formData.github_url && 
         !formData.twitter_url && 
         !formData.discord_url && (
          <p className="text-sm text-gray-500 italic">No links provided</p>
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

