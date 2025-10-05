'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';
import { ensureCrossFiMainnet } from '@/lib/networkUtils';

interface Project {
  id: string;
  app_id: string;
  app_name: string;
  category: string;
  registered_on_chain: boolean;
}

interface RegisterAppModalProps {
  campaignId: number;
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userAddress: string;
}

export function RegisterAppModal({ 
  campaignId, 
  campaignName, 
  isOpen, 
  onClose, 
  onSuccess,
  userAddress 
}: RegisterAppModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [status, setStatus] = useState<'idle' | 'signing' | 'confirming' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>('');

  useEffect(() => {
    if (isOpen && userAddress) {
      fetchUserProjects();
    }
  }, [isOpen, userAddress]);

  const fetchUserProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/register?owner=${userAddress}`);
      const data = await response.json();

      if (data.success) {
        // Filter only projects that are registered on-chain
        const registeredProjects = (data.projects || []).filter(
          (p: Project) => p.registered_on_chain
        );
        setProjects(registeredProjects);
        if (registeredProjects.length > 0) {
          setSelectedAppId(registeredProjects[0].app_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load your projects');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAppId) {
      setError('Please select an app');
      return;
    }

    try {
      setRegistering(true);
      setError(null);
      setStatus('signing');

      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      await ensureCrossFiMainnet();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.mainnet,
        CROSS_ERA_REWARD_SYSTEM_ABI,
        signer
      );

      // Register app for campaign (no registration fee, use 0x0 for registrationData)
      setStatus('confirming');
      const tx = await contract.registerAppForCampaign(
        selectedAppId,
        campaignId,
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      );

      setTxHash(tx.hash);
      await tx.wait();

      // Update database
      setStatus('saving');
      const saveResponse = await fetch(`/api/projects/${selectedAppId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          registration_tx_hash: tx.hash
        })
      });

      if (!saveResponse.ok) {
        console.warn('Failed to save registration to database, but on-chain registration succeeded');
      }

      setStatus('idle');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register app for campaign');
      setStatus('idle');
    } finally {
      setRegistering(false);
    }
  };

  const handleClose = () => {
    if (!registering) {
      setSelectedAppId('');
      setError(null);
      setStatus('idle');
      setTxHash('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative glass-card rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="glass-card border-b border-white border-opacity-10 px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-bold text-white">Register App for Campaign</h2>
            <button
              onClick={handleClose}
              disabled={registering}
              className="text-gray-400 hover:text-white text-2xl leading-none disabled:opacity-50"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {status === 'idle' ? (
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <p className="text-sm text-gray-300 mb-4">
                    Register one of your apps for <strong className="text-white">{campaignName}</strong>
                  </p>

                  {error && (
                    <div className="mb-4 p-3 glass-card bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin text-4xl mb-2">⏳</div>
                      <p className="text-sm text-gray-300">Loading your apps...</p>
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📦</div>
                      <p className="text-sm font-medium text-white mb-2">No registered apps found</p>
                      <p className="text-sm text-gray-300 mb-4">
                        You need to register an app first before joining campaigns
                      </p>
                      <a
                        href="/register"
                        className="inline-block px-4 py-2 glass-button text-white text-sm font-semibold rounded-lg hover:bg-white hover:bg-opacity-20 transition-all"
                      >
                        Register an App
                      </a>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Select App <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={selectedAppId}
                          onChange={(e) => setSelectedAppId(e.target.value)}
                          required
                          className="w-full px-4 py-3 glass-button border border-white border-opacity-20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black bg-opacity-20"
                        >
                          {projects.map((project) => (
                            <option key={project.app_id} value={project.app_id} className="bg-gray-800 text-white">
                              {project.app_name} ({project.category})
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-400">
                          {projects.length} app{projects.length !== 1 ? 's' : ''} available
                        </p>
                      </div>

                     

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={registering}
                          className="px-6 py-3 glass-button border border-white border-opacity-20 text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={registering}
                          className="px-6 py-3 glass-button bg-purple-600 bg-opacity-80 text-white font-semibold rounded-lg hover:bg-purple-700 hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Register App
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </form>
            ) : (
              /* Processing States */
              <div className="text-center py-8">
                {status === 'signing' && (
                  <>
                    <div className="text-6xl mb-4 animate-pulse">✍️</div>
                    <p className="text-lg font-medium text-white">Waiting for signature...</p>
                    <p className="text-sm text-gray-300 mt-2">Please confirm in MetaMask</p>
                  </>
                )}
                {status === 'confirming' && (
                  <>
                    <div className="text-6xl mb-4 animate-spin">⏳</div>
                    <p className="text-lg font-medium text-white">Transaction confirming...</p>
                    {txHash && (
                      <a
                        href={`https://scan.crossfi.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 hover:underline mt-2 inline-block"
                      >
                        View transaction
                      </a>
                    )}
                  </>
                )}
                {status === 'saving' && (
                  <>
                    <div className="text-6xl mb-4 animate-pulse">💾</div>
                    <p className="text-lg font-medium text-white">Saving to database...</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

