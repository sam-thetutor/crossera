'use client';

import { useState } from 'react';
import { PlaygroundModal } from './PlaygroundModal';

export function FloatingPlaygroundButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 glass-button text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center z-40 group"
        aria-label="Open Playground"
      >
        <span className="text-2xl">🎮</span>
        
        {/* Pulse Animation */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping" />
      </button>

      {/* Tooltip */}
      <div className="fixed bottom-6 right-24 bg-gray-900 bg-opacity-90 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-40 hidden group-hover:block">
        Test Playground
      </div>

      {/* Playground Modal */}
      <PlaygroundModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

