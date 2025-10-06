'use client';

import { useEffect } from 'react';

interface PitchDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PitchDeckModal({ isOpen, onClose }: PitchDeckModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl glass-card rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm border-b border-white border-opacity-20 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <h2 className="text-2xl font-bold">CrossEra Pitch Deck</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-8 py-6 max-h-[75vh] overflow-y-auto">
            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
              
              {/* Title */}
              <div className="mb-8 text-center border-b border-white border-opacity-20 pb-6">
                <h1 className="text-4xl font-bold text-white mb-2">CrossEra</h1>
                <p className="text-lg text-gray-400">Retroactive Rewards for CrossFi Applications</p>
              </div>

              {/* The Problem */}
              
              {/* The Problem */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  🎯 The Problem
                </h2>
                <p className="mb-3">Developers on CrossFi blockchain face challenges:</p>
                <ul className="space-y-1 ml-4">
                  <li>• No incentives for building quality applications</li>
                  <li>• Hard to attract users without rewards</li>
                  <li>• Gas fees go to waste instead of creating value</li>
                  <li>• No data on user engagement and activity</li>
                </ul>
              </div>

              {/* The Solution */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  💡 The Solution
                </h2>
                <p className="text-blue-300 mb-3 font-semibold">
                  CrossEra: A retroactive reward system that turns onchain metrics into developer incentives
                </p>
                <ul className="space-y-1 ml-4">
                  <li>✅ Developer rewards (70% based on fees)</li>
                  <li>✅ User engagement incentives (30% based on volume)</li>
                  <li>✅ Real-time analytics and leaderboards</li>
                  <li>✅ Campaign-based growth programs</li>
                </ul>
              </div>

              {/* How It Works */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  ⚙️ How It Works
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="font-bold text-white">1. Register Project</p>
                    <p className="text-sm ml-4">Register your project on CrossEra, get unique App ID, register on-chain</p>
                  </div>
                  <div>
                    <p className="font-bold text-white">2. Join Campaigns</p>
                    <p className="text-sm ml-4">Browse active campaigns, register your app, accumulate metrics automatically</p>
                  </div>
                  <div>
                    <p className="font-bold text-white">3. Earn & Claim Rewards</p>
                    <p className="text-sm ml-4">Users transact → Onchain metrics → Claim proportional rewards</p>
                  </div>
                </div>
              </div>

              {/* Traction */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  📈 Traction
                </h2>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="text-center glass-card p-3">
                    <div className="text-2xl font-bold text-green-400">4</div>
                    <div className="text-xs text-gray-400">Projects</div>
                  </div>
                  <div className="text-center glass-card p-3">
                    <div className="text-2xl font-bold text-blue-400">2</div>
                    <div className="text-xs text-gray-400">Active</div>
                  </div>
                  <div className="text-center glass-card p-3">
                    <div className="text-2xl font-bold text-purple-400">30+</div>
                    <div className="text-xs text-gray-400">Campaigns</div>
                  </div>
                  <div className="text-center glass-card p-3">
                    <div className="text-2xl font-bold text-orange-400">29</div>
                    <div className="text-xs text-gray-400">Transactions</div>
                  </div>
                </div>
                <p className="text-green-400 font-semibold text-center">✅ Live on CrossFi Mainnet</p>
              </div>

              {/* Technology */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  🛠️ Technology Stack
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-bold text-blue-400 mb-1">Smart Contracts</p>
                    <p className="text-sm">Solidity, Role-based access, Reentrancy protection</p>
                  </div>
                  <div>
                    <p className="font-bold text-green-400 mb-1">Platform</p>
                    <p className="text-sm">Next.js 14, TypeScript, Supabase</p>
                  </div>
                  <div>
                    <p className="font-bold text-purple-400 mb-1">SDK</p>
                    <p className="text-sm">TypeScript SDK v1.1.1, Batch processing</p>
                  </div>
                  <div>
                    <p className="font-bold text-orange-400 mb-1">Security</p>
                    <p className="text-sm">Audited contracts, RLS policies, HTTPS</p>
                  </div>
                </div>
              </div>

              {/* Business Model */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  💼 Business Model
                </h2>
                <div className="space-y-2">
                  <p className="text-sm"><strong className="text-white">Campaign Fees (Future):</strong> 5-10% of campaign pools</p>
                  <p className="text-sm"><strong className="text-white">Premium Features:</strong> Advanced analytics, custom branding</p>
                  <p className="text-sm"><strong className="text-white">Transaction Fees:</strong> Small % for infrastructure</p>
                  <p className="text-green-300 font-semibold text-sm mt-3">Current: Free for developers, focus on growth</p>
                </div>
              </div>

              {/* Competitive Advantage */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  🏅 Why CrossEra Wins
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-bold text-blue-400 mb-2">vs Traditional Grants</p>
                    <p className="text-sm">Retroactive, automated, transparent, fair</p>
                  </div>
                  <div>
                    <p className="font-bold text-green-400 mb-2">vs Other Platforms</p>
                    <p className="text-sm">CrossFi native, gas-based, multi-campaign</p>
                  </div>
                </div>
              </div>

              {/* Market & Roadmap */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  🗺️ Roadmap
                </h2>
                <div className="space-y-2">
                  <p className="text-sm"><strong className="text-green-400">Q4 2025 ✅:</strong> Platform launch, SDK release, Batch processing</p>
                  <p className="text-sm"><strong className="text-blue-400">Q1 2026:</strong> Mobile app, Analytics, Partnerships</p>
                  <p className="text-sm"><strong className="text-purple-400">Q2-Q3 2026:</strong> Multi-chain, Governance, Marketplace</p>
                </div>
              </div>

              {/* Funding Ask */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  💰 Funding Ask: $500K Seed
                </h2>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-400">40%</div>
                    <div className="text-xs text-gray-400">Product</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">30%</div>
                    <div className="text-xs text-gray-400">Marketing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-400">20%</div>
                    <div className="text-xs text-gray-400">Team</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-400">10%</div>
                    <div className="text-xs text-gray-400">Ops</div>
                  </div>
                </div>
                <p className="text-center mt-3 text-sm">Runway: 18-24 months</p>
              </div>

              {/* Why Now */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  ⏰ Why Now?
                </h2>
                <ul className="space-y-1 text-sm">
                  <li>✅ CrossFi mainnet live - perfect timing</li>
                  <li>✅ Developer demand for incentives</li>
                  <li>✅ Proven retroactive model (Optimism, Arbitrum)</li>
                  <li>✅ First mover advantage on CrossFi</li>
                  <li>✅ Product-market fit demonstrated</li>
                </ul>
              </div>

              {/* Contact */}
              <div className="mb-6 text-center border-t border-white border-opacity-20 pt-6">
                <h2 className="text-2xl font-bold text-white mb-4">📧 Contact</h2>
                <p className="text-sm mb-2"><strong className="text-white">Platform:</strong> https://crossera.xyz</p>
                <p className="text-sm mb-4"><strong className="text-white">Contract:</strong> 0x64Baa5...EdFC191</p>
                <div className="flex justify-center gap-3">
                  <a href="https://crossera.xyz" target="_blank" rel="noopener" className="glass-button px-4 py-2 rounded-lg text-sm text-white font-semibold hover:bg-white hover:bg-opacity-20 transition-all">
                    Platform
                  </a>
                  <a href="https://github.com/sam-thetutor/crossera" target="_blank" rel="noopener" className="glass-button px-4 py-2 rounded-lg text-sm text-white font-semibold hover:bg-white hover:bg-opacity-20 transition-all">
                    GitHub
                  </a>
                </div>
              </div>

              {/* Thank You */}
              <div className="text-center py-8 border-t border-white border-opacity-20">
                <h1 className="text-3xl font-bold text-white mb-2">Thank You! 🙏</h1>
                <p className="text-lg">Let's revolutionize developer rewards on CrossFi</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

