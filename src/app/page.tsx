import { Navbar } from '@/components/Navbar';
import { VideoDemoSection } from '@/components/VideoDemoSection';
import { Hero } from '@/components/Hero';

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg-hero">
      
      {/* New Professional Hero */}
      <Hero />

      {/* Features Section */}
      <section className="relative">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pt-0 pb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-orange-100">
              Simple steps to start earning XFI rewards for your CrossFi applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-card text-center p-6">
              <div className="w-16 h-16 glass-button rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Create Project</h3>
              <p className="text-orange-100">
                Register your CrossFi application and get a unique App ID for tracking and verification.
              </p>
            </div>

            <div className="glass-card text-center p-6">
              <div className="w-16 h-16 glass-button rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Join Campaign</h3>
              <p className="text-orange-100">
                Participate in reward campaigns by registering your app for specific reward pools.
              </p>
            </div>

            <div className="glass-card text-center p-6">
              <div className="w-16 h-16 glass-button rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Integrate SDK</h3>
              <p className="text-orange-100">
                Add our SDK to your app to automatically track transactions and user activity.
              </p>
            </div>

            <div className="glass-card text-center p-6">
              <div className="w-16 h-16 glass-button rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Earn Rewards</h3>
              <p className="text-orange-100">
                Automatically earn XFI rewards based on your app's volume and user engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <VideoDemoSection />

      {/* Stats Section */}
      {/* <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">0</div>
              <div className="text-purple-200">Registered Apps</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">0</div>
              <div className="text-purple-200">Active Campaigns</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">0</div>
              <div className="text-purple-200">Rewards Distributed</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">0</div>
              <div className="text-purple-200">Developers</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      {/* <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              Cross<span className="text-blue-400">Era</span>
            </h3>
            <p className="text-gray-400 mb-6">
              Built with ❤️ for the CrossFi ecosystem
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                GitHub
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Documentation
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  );
}
