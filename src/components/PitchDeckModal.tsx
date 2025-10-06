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

          {/* Content */}
          <div className="px-8 py-6 max-h-[75vh] overflow-y-auto">
            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
              
              {/* Title */}
              <div className="mb-8 text-center border-b border-white border-opacity-20 pb-6">
                <h1 className="text-4xl font-bold text-white mb-2">Pitch Deck</h1>
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
                  <li>• Little to no support for small projects</li>
                  <li>• No data on user engagement and activity</li>
                </ul>
              </div>

              {/* The Solution */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  💡 The Solution
                </h2>
                <p className="text-blue-300 mb-3 font-semibold">
                  CrossEra: A fair retroactive reward system using quadratic funding to incentivize broad user adoption
                </p>
                <ul className="space-y-1 ml-4">
                  <li>✅ Quadratic funding model (rewards user acquisition over whales)</li>
                  <li>✅ Three-factor rewards: 20% fees + 30% volume + 50% unique users</li>
                  <li>✅ Real-time analytics and leaderboards</li>
                  <li>✅ Campaign-based growth programs</li>
                  <li>✅ Fairer distribution for developers</li>
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
                {/* <p className="text-green-400 font-semibold text-center">✅ Live on CrossFi Mainnet</p> */}
              </div>

              {/* Technology */}
              {/* <div className="mb-6">
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
              </div> */}

              {/* Business Model */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  💼 Business Model
                </h2>
                <div className="space-y-2">
                  <p className="text-sm"><strong className="text-white">Campaign Fees (Future):</strong> 3% of campaign pools</p>
                  <p className="text-sm"><strong className="text-white"> Project Fees:</strong> Small fee for registering projects</p>
                  <p className="text-green-300 font-semibold text-sm mt-3">Current: Free for developers, focus on growth</p>
                </div>
              </div>

              {/* Quadratic Funding Model */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  🔮 Quadratic Funding Innovation
                </h2>
                <p className="mb-3 text-blue-300 font-semibold">
                  Reward projects based on BREADTH of user base, not just transaction value
                </p>
                
                <div className="glass-card p-4 mb-3">
                  <p className="font-bold text-white mb-2">Complete Formula:</p>
                  <div className="bg-black bg-opacity-40 p-3 rounded-lg mb-3 font-mono text-xs text-green-400">
                    <p>Reward = Pool × [</p>
                    <p className="ml-4">(20% × QF_fees) +</p>
                    <p className="ml-4">(30% × QF_volume) +</p>
                    <p className="ml-4">(50% × QF_users)</p>
                    <p>]</p>
                    <p className="mt-2 text-gray-400">Where:</p>
                    <p className="ml-2 text-blue-300">QF_fees = √(app_fees) / Σ√(all_app_fees)</p>
                    <p className="ml-2 text-purple-300">QF_volume = √(app_volume) / Σ√(all_app_volumes)</p>
                    <p className="ml-2 text-orange-300">QF_users = √(unique_users) / Σ√(all_app_users)</p>
                  </div>
                  <p className="text-xs text-gray-400 italic">√ = square root function reduces whale impact</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="glass-card p-3">
                    <p className="font-bold text-green-400 mb-1 text-sm">Quadratic Model ✅</p>
                    <p className="text-xs">1 whale = 100 XFI = 10 points</p>
                    <p className="text-xs">10 users = 100 XFI = 31.6 points (3x better!)</p>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <p className="font-bold text-white">Benefits:</p>
                  <ul className="space-y-1 ml-4">
                    <li>✅ Encourages user acquisition over whale hunting</li>
                    <li>✅ Fairer distribution across projects</li>
                    <li>✅ Reduces whale dominance</li>
                    <li>✅ Incentivizes community building</li>
                    <li>✅ Better product-market fit signal</li>
                  </ul>
                </div>
              </div>

              {/* Competitive Advantage */}
              {/* <div className="mb-6">
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
              </div> */}

              {/* Market & Roadmap */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  🗺️ Roadmap
                </h2>
                <div className="space-y-2">
                  <p className="text-sm"><strong className="text-green-400">Q4 2025 ✅:</strong> Platform launch, SDK release, Batch processing</p>
                  <p className="text-sm"><strong className="text-blue-400">Q4 2025:</strong> Onchain Voting, Governance, Campaign Templates</p>
                </div>
              </div>

              {/* Funding Ask */}
              {/* <div className="mb-6">
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
              </div> */}

              {/* Why Now */}
              {/* <div className="mb-6">
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
              </div> */}

              {/* Contact */}
              {/* <div className="mb-6 text-center border-t border-white border-opacity-20 pt-6">
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
              </div> */}

              {/* Thank You */}
              <div className="text-center py-8 border-t border-white border-opacity-20">
                <h1 className="text-3xl font-bold text-white mb-2">Thank You! 🙏</h1>
                <p className="text-lg">Let's revolutionize retroactive funding on CrossFi</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

