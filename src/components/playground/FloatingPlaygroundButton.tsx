'use client';

import { useState } from 'react';
import { PlaygroundModal } from './PlaygroundModal';
import { PitchDeckModal } from '../PitchDeckModal';

export function FloatingPlaygroundButton() {
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [isPitchDeckOpen, setIsPitchDeckOpen] = useState(false);

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        {/* Pitch Deck Button */}
        <button
          onClick={() => setIsPitchDeckOpen(true)}
          className="w-16 h-16 glass-button text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center group"
          aria-label="View Pitch Deck"
        >
          <span className="text-2xl">📊</span>
          
          {/* Tooltip */}
          <div className="absolute right-20 bg-gray-900 bg-opacity-90 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Pitch Deck
          </div>
        </button>

        {/* Playground Button */}
        <button
          onClick={() => setIsPlaygroundOpen(true)}
          className="w-16 h-16 glass-button text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center group"
          aria-label="Open Playground"
        >
          <span className="text-2xl">🎮</span>
          
          {/* Pulse Animation */}
          <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping" />
          
          {/* Tooltip */}
          <div className="absolute right-20 bg-gray-900 bg-opacity-90 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Test Playground
          </div>
        </button>
      </div>

      {/* Modals */}
      <PlaygroundModal
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
      />
      <PitchDeckModal
        isOpen={isPitchDeckOpen}
        onClose={() => setIsPitchDeckOpen(false)}
      />
    </>
  );
}

