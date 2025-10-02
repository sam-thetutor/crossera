'use client';

import { useState } from 'react';
import { SendXFITab } from './SendXFITab';
import { VerifyTab } from './VerifyTab';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlaygroundModal({ isOpen, onClose }: PlaygroundModalProps) {
  const [activeTab, setActiveTab] = useState<'send' | 'verify'>('send');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎮</span>
              <h2 className="text-2xl font-bold">Test Playground</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab('send')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'send'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              💸 Send XFI
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'verify'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              ✓ Verify
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'send' && <SendXFITab onSuccess={onClose} />}
            {activeTab === 'verify' && <VerifyTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

