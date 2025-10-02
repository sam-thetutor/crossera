'use client';

import { ProjectFormData, CATEGORIES } from './types';

interface Step1BasicInfoProps {
  formData: ProjectFormData;
  onChange: (field: keyof ProjectFormData, value: string) => void;
  errors: Record<string, string>;
}

export function Step1BasicInfo({ formData, onChange, errors }: Step1BasicInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">Let's start with the essentials for your project</p>
      </div>

      {/* App Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          App Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.app_name}
          onChange={(e) => onChange('app_name', e.target.value)}
          placeholder="My Awesome DApp"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${
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
          onChange={(e) => onChange('description', e.target.value)}
          rows={4}
          placeholder="Brief description of your project..."
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <p className="mt-1 text-sm text-gray-500">
          {formData.description.length}/1000 characters
        </p>
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.category}
          onChange={(e) => onChange('category', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${
            errors.category ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category}</p>
        )}
      </div>
    </div>
  );
}

