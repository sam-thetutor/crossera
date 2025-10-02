'use client';

import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useProjectStats } from '@/hooks/useProjectStats';

export function Hero() {
  const { isConnected, connect } = useWallet();
  const { stats, loading } = useProjectStats(undefined);

  const totalProjects = stats?.totalProjects ?? 0;
  const activeProjects = stats?.activeProjects ?? 0;
  const totalRewards = stats?.totalRewards ?? '0';

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-100 blur-3xl opacity-60" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-100 blur-3xl opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-700 text-xs mb-4">
              <span className="size-2 rounded-full bg-green-500" /> CrossFi Testnet
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
              Launch, track, and reward your CrossFi apps
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-xl">
              Register projects, verify on-chain activity, and earn automated rewards.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {!isConnected ? (
                <button
                  onClick={connect}
                  className="inline-flex justify-center items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Connect Wallet
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex justify-center items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              )}
              <Link
                href="/register"
                className="inline-flex justify-center items-center px-6 py-3 rounded-lg border border-gray-300 text-gray-800 font-semibold bg-white hover:bg-gray-50 transition-colors"
              >
                Register Project
              </Link>
            </div>

            {/* Social proof / stats */}
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-600">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200">
                <span className="text-yellow-600">★</span> Transparent
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200">
                <span className="text-blue-600">⚙︎</span> Retroactive
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200">
                <span className="text-green-600">⏱</span> Automated 
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-xl p-6 backdrop-blur-sm">
              {/* Mock dashboard preview */}
              <div className="h-56 sm:h-72 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-2">📊</div>
                  <p className="text-gray-600">Dashboard preview</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs text-gray-500">Total Projects</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{loading ? '—' : totalProjects}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs text-gray-500">Active Apps</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{loading ? '—' : activeProjects}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs text-gray-500">Rewards</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{loading ? '—' : `${Number(totalRewards).toFixed(2)} XFI`}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


