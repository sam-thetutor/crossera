"use client";

import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@/contexts/WalletContext";
import { useProjectStats } from "@/hooks/useProjectStats";

export function Hero() {
  const { isConnected, connect } = useWallet();
  const { stats, loading } = useProjectStats(undefined);

  const totalProjects = stats?.totalProjects ?? 0;
  const activeProjects = stats?.activeProjects ?? 0;
  const totalRewards = stats?.totalRewards ?? "0";

  return (
    <section className="relative overflow-hidden pt-16">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Copy */}
          <div>
            <div className="glass-card inline-flex items-center gap-2 px-4 py-2 text-white text-sm mb-6">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />{" "}
              CrossFi Mainnet
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Launch projects, verify, unlock funds
            </h1>
            <p className="mt-6 text-sm text-gray-300 max-w-2xl leading-relaxed">
              Register projects, verify on-chain activity, and unlock funds the retroactive way
            
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {!isConnected ? (
                <button
                  onClick={connect}
                  className="glass-card inline-flex justify-center items-center px-6 py-3 rounded-lg font-semibold"
                >
                  Connect Wallet
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="glass-card inline-flex justify-center items-center px-6 py-3 rounded-lg text-white font-semibold hover:bg-white hover:bg-opacity-20 transition-all"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/register"
                className="glass-card inline-flex justify-center items-center px-6 py-3 rounded-lg text-white font-semibold hover:bg-white hover:bg-opacity-20 transition-all"
              >
                New Project
              </Link>
            </div>

            {/* Social proof / stats */}
            <div className="mt-10 flex flex-wrap gap-4 text-sm">
              <div className="glass-card inline-flex items-center gap-2 px-4 py-2 text-white">
                <span className="text-yellow-300">★</span> Transparent
              </div>
              <div className="glass-card inline-flex items-center gap-2 px-4 py-2 text-white">
                <span className="text-blue-300">⚙︎</span> Retroactive
              </div>
              <div className="glass-card inline-flex items-center gap-2 px-4 py-2 text-white">
                <span className="text-green-300">⏱</span> Automated
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div className="glass-card relative rounded-2xl p-6 glass-float overflow-hidden">
              {/* Dashboard Preview Image */}
              <div className="relative h-56 sm:h-72">
                <Image
                  src="/az.png"
                  alt="CrossEra Dashboard Preview"
                  width={600}
                  height={288}
                  className="w-full h-full object-cover rounded-xl shadow-2xl"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
              </div>

              {/* Live Stats Overlay */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="glass-button text-white rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-300">Active Projects</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {loading ? "—" : activeProjects}
                  </p>
                </div>
                <div className="glass-button text-white rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-300">Total Projects</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {loading ? "—" : totalProjects}
                  </p>
                </div>
                <div className="glass-button text-white rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-300">Total Rewards</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {loading ? "—" : `${Number(totalRewards).toFixed(2)} XFI`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
