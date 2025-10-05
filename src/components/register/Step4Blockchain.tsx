'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface Step4BlockchainProps {
  status: 'idle' | 'saving' | 'signing' | 'confirming' | 'confirmed' | 'error';
  txHash?: string;
  error?: string;
}

export function Step4Blockchain({ status, txHash, error }: Step4BlockchainProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Blockchain Registration</h2>
        <p className="text-gray-300">Registering your project on CrossFi blockchain</p>
      </div>

      {/* Status Display */}
      <div className="glass-card p-8">
        {/* Idle */}
        {status === 'idle' && (
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <p className="text-gray-300">Ready to register on blockchain</p>
          </div>
        )}

        {/* Saving to Database */}
        {status === 'saving' && (
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
            <p className="text-lg font-medium text-white">Saving to database...</p>
            <p className="text-sm text-gray-300 mt-2">Step 1 of 3</p>
          </div>
        )}

        {/* Waiting for Signature */}
        {status === 'signing' && (
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">✍️</div>
            <p className="text-lg font-medium text-white">Waiting for signature...</p>
            <p className="text-sm text-gray-300 mt-2">
              Please confirm the transaction in your wallet
            </p>
            <div className="glass-card bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded-lg p-4 mt-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-300">
                ⚠️ Make sure you're on <strong>CrossFi Mainnet</strong>
              </p>
              <p className="text-xs text-yellow-200 mt-1">
                If prompted, approve the network switch in MetaMask
              </p>
            </div>
            <p className="text-sm text-gray-300 mt-4">Step 2 of 3</p>
          </div>
        )}

        {/* Confirming Transaction */}
        {status === 'confirming' && txHash && (
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
            <p className="text-lg font-medium text-white">Confirming transaction...</p>
            <p className="text-sm text-gray-300 mt-2">
              This may take a few moments
            </p>
            <p className="text-sm text-gray-300 mb-4">Step 3 of 3</p>
            <a
              href={`https://scan.crossfi.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              View on Explorer →
            </a>
          </div>
        )}

        {/* Confirmed */}
        {status === 'confirmed' && txHash && (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg font-medium text-green-400">Transaction Confirmed!</p>
            <p className="text-sm text-gray-300 mt-2 mb-4">
              Your project is now registered on the blockchain
            </p>
            <a
              href={`https://scan.crossfi.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              View Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-lg font-medium text-red-400">Registration Failed</p>
            <p className="text-sm text-gray-300 mt-2">{error || 'An error occurred'}</p>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      {(status === 'saving' || status === 'signing' || status === 'confirming') && (
        <div className="glass-card p-6">
          <div className="space-y-3">
            <div className={`flex items-center ${status !== 'saving' ? 'text-green-400' : 'text-white'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                status !== 'saving' ? 'bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30' : 'bg-purple-500 bg-opacity-20 border border-purple-500 border-opacity-30'
              }`}>
                {status !== 'saving' ? '✓' : '1'}
              </div>
              <span className="text-sm font-medium">Save project to database</span>
            </div>
            <div className={`flex items-center ${
              status === 'confirming' || status === 'confirmed' ? 'text-green-400' : 
              status === 'signing' ? 'text-white' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                status === 'confirming' || status === 'confirmed' ? 'bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30' :
                status === 'signing' ? 'bg-purple-500 bg-opacity-20 border border-purple-500 border-opacity-30' : 'bg-gray-500 bg-opacity-20 border border-gray-500 border-opacity-30'
              }`}>
                {status === 'confirming' || status === 'confirmed' ? '✓' : '2'}
              </div>
              <span className="text-sm font-medium">Sign blockchain transaction</span>
            </div>
            <div className={`flex items-center ${
              status === 'confirmed' ? 'text-green-400' :
              status === 'confirming' ? 'text-white' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                status === 'confirmed' ? 'bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30' :
                status === 'confirming' ? 'bg-purple-500 bg-opacity-20 border border-purple-500 border-opacity-30' : 'bg-gray-500 bg-opacity-20 border border-gray-500 border-opacity-30'
              }`}>
                {status === 'confirmed' ? '✓' : '3'}
              </div>
              <span className="text-sm font-medium">Confirm on blockchain</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

