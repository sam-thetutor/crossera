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
        <div className="relative w-full max-w-6xl glass-card rounded-2xl shadow-2xl">
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
          <div className="px-6 py-8 max-h-[80vh] overflow-y-auto">
            <div className="prose prose-invert prose-sm md:prose-base max-w-none">
              
              {/* Slide 1: Title */}
              <div className="mb-12 text-center">
                <h1 className="text-5xl font-bold text-white mb-4">CrossEra</h1>
                <p className="text-2xl text-gray-300">Retroactive Rewards for CrossFi Applications</p>
              </div>

              {/* Slide 2: The Problem */}
              <div className="glass-card p-8 mb-8">
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                  🎯 The Problem
                </h2>
                <p className="text-xl text-gray-300 mb-4">Developers on CrossFi blockchain face challenges:</p>
                <ul className="text-lg text-gray-300 space-y-2">
                  <li>No incentives for building quality applications</li>
                  <li>Hard to attract users without rewards</li>
                  <li>Gas fees go to waste instead of creating value</li>
                  <li>No data on user engagement and activity</li>
                </ul>
                <p className="text-xl text-red-400 mt-4 font-semibold">Result: Limited ecosystem growth and developer adoption</p>
              </div>

              {/* Slide 3: The Solution */}
              <div className="glass-card p-8 mb-8">
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                  💡 The Solution
                </h2>
                <p className="text-2xl text-blue-300 mb-6 font-semibold">
                  CrossEra: A retroactive reward system that turns onchain metrics into developer incentives
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg text-gray-300">
                  <div className="glass-card p-4">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="font-semibold">Developer rewards (70% based on fees)</p>
                  </div>
                  <div className="glass-card p-4">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="font-semibold">User engagement incentives (30% based on volume)</p>
                  </div>
                  <div className="glass-card p-4">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="font-semibold">Real-time analytics and leaderboards</p>
                  </div>
                  <div className="glass-card p-4">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="font-semibold">Campaign-based growth programs</p>
                  </div>
                </div>
              </div>

              {/* Slide 4: How It Works */}
              <div className="glass-card p-8 mb-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  ⚙️ How It Works
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full glass-button flex items-center justify-center text-2xl font-bold">1</div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Register Project</h3>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Register your project on CrossEra</li>
                        <li>• Get unique App ID for tracking</li>
                        <li>• Register on-chain for verification</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full glass-button flex items-center justify-center text-2xl font-bold">2</div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Join Campaigns</h3>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Browse active reward campaigns</li>
                        <li>• Register app for relevant campaigns</li>
                        <li>• Start accumulating metrics automatically</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full glass-button flex items-center justify-center text-2xl font-bold">3</div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Earn & Claim Rewards</h3>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Users transact with your app</li>
                        <li>• Onchain metrics → automatic rewards</li>
                        <li>• Claim proportional share when campaign ends</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 5: Traction */}
              <div className="glass-card p-8 mb-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  📈 Traction
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400">4</div>
                    <div className="text-sm text-gray-400">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400">2</div>
                    <div className="text-sm text-gray-400">Active Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-400">30+</div>
                    <div className="text-sm text-gray-400">Campaigns</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-400">29</div>
                    <div className="text-sm text-gray-400">Transactions</div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-green-400 font-semibold text-lg">✅ Live on CrossFi Mainnet</p>
                  <p className="text-gray-400 text-sm mt-2">https://crossera.xyz</p>
                </div>
              </div>

              {/* Slide 6: Technology */}
              <div className="glass-card p-8 mb-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  🛠️ Technology
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-blue-400 mb-3">Smart Contracts</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• Role-based access control</li>
                      <li>• Reentrancy protection</li>
                      <li>• Emergency pause functionality</li>
                      <li>• Gas-optimized storage</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-400 mb-3">Platform</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• Next.js 14 + TypeScript</li>
                      <li>• Supabase PostgreSQL</li>
                      <li>• Real-time analytics</li>
                      <li>• Responsive design</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-400 mb-3">SDK</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• TypeScript SDK (v1.1.1)</li>
                      <li>• Batch processing</li>
                      <li>• Network switching</li>
                      <li>• Published on npm</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-orange-400 mb-3">Security</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• Audited smart contracts</li>
                      <li>• RLS database policies</li>
                      <li>• HTTPS encryption</li>
                      <li>• Regular updates</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Slide 7: Business Model */}
              <div className="glass-card p-8 mb-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  💼 Business Model
                </h2>
                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <h3 className="text-lg font-bold text-white mb-2">1. Campaign Creation Fees (Future)</h3>
                    <p className="text-gray-300">Sponsors pay 5-10% platform fee on campaign pools</p>
                  </div>
                  <div className="glass-card p-4">
                    <h3 className="text-lg font-bold text-white mb-2">2. Premium Features (Future)</h3>
                    <p className="text-gray-300">Advanced analytics, custom branding, priority support</p>
                  </div>
                  <div className="glass-card p-4">
                    <h3 className="text-lg font-bold text-white mb-2">3. Transaction Fees (Current)</h3>
                    <p className="text-gray-300">Small % covers infrastructure costs</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-500 bg-opacity-20 rounded-lg border border-green-500 border-opacity-30">
                  <p className="text-green-300 font-semibold">Current: Free for developers, focus on growth & adoption</p>
                </div>
              </div>

              {/* Slide 8: Competitive Advantage */}
              <div className="glass-card p-8 mb-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  🏅 Competitive Advantage
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-blue-400 mb-3">vs Traditional Grants</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>✅ Retroactive - Reward actual usage</li>
                      <li>✅ Automated - No manual applications</li>
                      <li>✅ Transparent - On-chain proof</li>
                      <li>✅ Fair - Proportional to contribution</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-400 mb-3">vs Other Platforms</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>✅ CrossFi Native - Built for CrossFi</li>
                      <li>✅ Gas Fee Based - Unique mechanism</li>
                      <li>✅ Developer SDK - Easy integration</li>
                      <li>✅ Multi-Campaign - Multiple rewards</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Slide 9: Roadmap */}
              <div className="glass-card p-8 mb-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  🗺️ Roadmap
                </h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-300 rounded-full text-sm font-semibold border border-green-500 border-opacity-30">Q4 2025 - Foundation ✅</span>
                    </div>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li>✅ Smart contract deployment</li>
                      <li>✅ Web platform launch</li>
                      <li>✅ SDK v1.0 release</li>
                      <li>✅ Batch processing system</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-300 rounded-full text-sm font-semibold border border-blue-500 border-opacity-30">Q1 2026 - Growth</span>
                    </div>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li>🔄 Mobile app support</li>
                      <li>🔄 Advanced analytics dashboard</li>
                      <li>🔄 Campaign templates</li>
                      <li>🔄 Partner integrations</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-purple-500 bg-opacity-20 text-purple-300 rounded-full text-sm font-semibold border border-purple-500 border-opacity-30">Q2-Q3 2026 - Scale</span>
                    </div>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li>🔄 Multi-chain expansion</li>
                      <li>🔄 Governance token launch</li>
                      <li>🔄 Developer marketplace</li>
                      <li>🔄 Enterprise features</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Slide 10: Market Opportunity */}
              <div className="glass-card p-8 mb-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  🌍 Market Opportunity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center glass-card p-4">
                    <div className="text-3xl font-bold text-blue-400">100+</div>
                    <div className="text-sm text-gray-400">CrossFi Development Teams</div>
                  </div>
                  <div className="text-center glass-card p-4">
                    <div className="text-3xl font-bold text-green-400">$10M+</div>
                    <div className="text-sm text-gray-400">Potential Fees Annually</div>
                  </div>
                  <div className="text-center glass-card p-4">
                    <div className="text-3xl font-bold text-purple-400">Growing</div>
                    <div className="text-sm text-gray-400">CrossFi TVL</div>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-lg text-gray-300"><strong className="text-white">Primary:</strong> CrossFi dApp developers</p>
                  <p className="text-lg text-gray-300"><strong className="text-white">Secondary:</strong> Campaign sponsors (protocols, foundations)</p>
                  <p className="text-lg text-gray-300"><strong className="text-white">Tertiary:</strong> End users benefiting from better apps</p>
                </div>
              </div>

              {/* Slide 11: Funding Ask */}
              <div className="glass-card p-8 mb-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  💰 Funding Ask
                </h2>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-green-400 mb-2">$500K</div>
                  <div className="text-xl text-gray-300">Seed Round</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400">40%</div>
                    <div className="text-sm text-gray-400 mt-2">Product Development</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <div className="text-3xl font-bold text-green-400">30%</div>
                    <div className="text-sm text-gray-400 mt-2">Marketing & Growth</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400">20%</div>
                    <div className="text-sm text-gray-400 mt-2">Team Expansion</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <div className="text-3xl font-bold text-orange-400">10%</div>
                    <div className="text-sm text-gray-400 mt-2">Operations</div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-gray-300 text-lg">Runway: <span className="text-white font-semibold">18-24 months</span></p>
                </div>
              </div>

              {/* Slide 12: Why Now */}
              <div className="glass-card p-8 mb-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  ⏰ Why Now?
                </h2>
                <div className="space-y-4 text-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <p className="text-gray-300"><strong className="text-white">CrossFi mainnet is live</strong> - Perfect timing to build ecosystem</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <p className="text-gray-300"><strong className="text-white">Developer demand</strong> - Teams need incentives to build</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <p className="text-gray-300"><strong className="text-white">Proven model</strong> - Retroactive rewards work (Optimism, Arbitrum)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <p className="text-gray-300"><strong className="text-white">First mover</strong> - No direct competitors on CrossFi</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <p className="text-gray-300"><strong className="text-white">Product-market fit</strong> - Early users showing strong engagement</p>
                  </div>
                </div>
              </div>

              {/* Slide 13: Contact */}
              <div className="glass-card p-8 mb-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">📧 Let's Connect</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xl text-gray-300 mb-2"><strong className="text-white">Platform:</strong> https://crossera.xyz</p>
                    <p className="text-xl text-gray-300 mb-2"><strong className="text-white">Contract:</strong> 0x64Baa5262A0700061728e3A6Bbf7Eb866EdFC191</p>
                  </div>
                  <div className="flex justify-center gap-4 mt-6">
                    <a href="https://crossera.xyz" target="_blank" rel="noopener" className="glass-button px-6 py-3 rounded-lg text-white font-semibold hover:bg-white hover:bg-opacity-20 transition-all">
                      Visit Platform
                    </a>
                    <a href="https://github.com/sam-thetutor/crossera" target="_blank" rel="noopener" className="glass-button px-6 py-3 rounded-lg text-white font-semibold hover:bg-white hover:bg-opacity-20 transition-all">
                      View GitHub
                    </a>
                  </div>
                </div>
              </div>

              {/* Final Slide */}
              <div className="text-center py-12">
                <h1 className="text-5xl font-bold text-white mb-4">Thank You! 🙏</h1>
                <p className="text-2xl text-gray-300 mb-8">Let's revolutionize how developers are rewarded on CrossFi</p>
                <div className="inline-block glass-card px-8 py-4">
                  <p className="text-xl text-white font-semibold">Questions?</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

