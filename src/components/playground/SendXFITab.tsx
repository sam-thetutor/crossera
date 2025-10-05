'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useProjects } from '@/hooks/useProjects';
import { ethers } from 'ethers';
import { ensureCrossFiMainnet } from '@/lib/networkUtils';
import { HELLOWORLD_CONTRACT_ADDRESS } from '@/lib/contracts';

interface SendXFITabProps {
  onSuccess: () => void;
}

export function SendXFITab({ onSuccess }: SendXFITabProps) {
  const { address, isConnected, connect, balance } = useWallet();
  
  // Use existing hook with caching
  const { projects: allProjects, loading: loadingProjects } = useProjects({
    owner: address || undefined,
    autoFetch: isConnected
  });
  
  // Filter only on-chain registered projects
  const projects = useMemo(() => {
    return allProjects.filter((p: any) => p.registered_on_chain);
  }, [allProjects]);
  
  const [selectedAppId, setSelectedAppId] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'signing' | 'confirming' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>('');

  // Auto-select first project when loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedAppId) {
      setSelectedAppId(projects[0].app_id);
    }
  }, [projects, selectedAppId]);

  const validateForm = () => {
    if (!selectedAppId) {
      setError('Please select an app');
      return false;
    }
    return true;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSending(true);
      setError(null);
      setStatus('signing');

      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      await ensureCrossFiMainnet();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Encode app_id as raw hex (no function selector)
      const appIdHex = ethers.hexlify(ethers.toUtf8Bytes(selectedAppId));

      // Send to HelloWorld contract with app_id in data field (no XFI required)
      const tx = {
        to: HELLOWORLD_CONTRACT_ADDRESS,
        value: 0,  // No XFI required
        data: appIdHex  // Raw app_id hex - triggers fallback function
      };

      setStatus('confirming');
      const txResponse = await signer.sendTransaction(tx);
      setTxHash(txResponse.hash);

      await txResponse.wait();
      
      setStatus('success');
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onSuccess();
        resetForm();
      }, 2000);

    } catch (err: any) {
      console.error('Send XFI error:', err);
      setError(err.message || 'Failed to send transaction');
      setStatus('idle');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setError(null);
    setTxHash('');
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-bold text-white mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-gray-300 mb-6">
          Please connect your wallet to use the playground
        </p>
        <button
          onClick={connect}
          className="px-6 py-3 glass-button text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-20 transition-all"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (status === 'signing' || status === 'confirming' || status === 'success') {
    return (
      <div className="text-center py-12">
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
                className="text-sm text-purple-400 hover:text-purple-300 hover:underline mt-2 inline-block transition-colors"
              >
                View transaction
              </a>
            )}
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg font-medium text-white">Transaction sent successfully!</p>
            <p className="text-sm text-gray-300 mt-2">
              App ID "{selectedAppId}" attached to transaction
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Use this transaction hash to verify and earn rewards
            </p>
            {txHash && (
              <div className="mt-4 p-3 bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-white border-opacity-20 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Transaction Hash:</p>
                <p className="text-sm font-mono text-white break-all">{txHash}</p>
                <a
                  href={`https://scan.crossfi.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 hover:underline mt-2 inline-block transition-colors"
                >
                  View on Explorer →
                </a>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-2">Send Test Transaction</h3>
        <p className="text-sm text-gray-300">
          Send a test transaction to the HelloWorld contract with your app ID attached. Later, verify it to earn rewards!
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-900 bg-opacity-50 backdrop-blur-sm border border-red-500 rounded-lg">
          <p className="text-sm font-medium text-red-400">{error}</p>
        </div>
      )}

      {loadingProjects ? (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-2">⏳</div>
          <p className="text-sm text-gray-300">Loading your apps...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8 bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-white border-opacity-20 rounded-lg">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-sm font-medium text-white mb-2">No registered apps found</p>
          <p className="text-sm text-gray-300 mb-4">
            You need to register an app first
          </p>
          <a
            href="/register"
            className="inline-block px-4 py-2 glass-button text-white text-sm font-semibold rounded-lg hover:bg-white hover:bg-opacity-20 transition-all"
          >
            Register an App
          </a>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-6">
          {/* Select App */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Select Project <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
            >
              {projects.map((project) => (
                <option key={project.app_id} value={project.app_id} className="bg-gray-800 text-white">
                  {project.app_name} - {project.app_id}
                </option>
              ))}
              {projects.map((project) => (
                <option key={project.app_id} value={project.app_id}>
                  {project.app_name} - {project.app_id}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              This app ID will be attached to the transaction data
            </p>
          </div>

          {/* App ID Preview */}
          {selectedAppId && (
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-4">
              <p className="text-sm font-medium text-white mb-2">
                Transaction Data Preview:
              </p>
              <p className="text-xs font-mono text-gray-300 break-all">
                {ethers.hexlify(ethers.toUtf8Bytes(selectedAppId))}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                ℹ️ App ID "{selectedAppId}" will be encoded in transaction data
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              💡 <strong>How it works:</strong> This sends a transaction to the HelloWorld contract with your app ID encoded in the data field. No XFI is sent - just gas fees. Later, verify the transaction hash to earn rewards!
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Contract: {HELLOWORLD_CONTRACT_ADDRESS.slice(0, 10)}...{HELLOWORLD_CONTRACT_ADDRESS.slice(-8)}
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onSuccess}
              className="px-6 py-3 glass-button text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-20 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-3 glass-button text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send Test Transaction'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

