'use client';

import React from 'react';
import { useNetwork } from '@/contexts/NetworkContext';

export function NetworkSelector() {
  const { network, setNetwork, networkConfig, isTestnet } = useNetwork();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Configuration</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Current Network:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900">{networkConfig.name}</span>
            <div className={`w-3 h-3 rounded-full ${isTestnet ? 'bg-yellow-500' : 'bg-green-500'}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{networkConfig.name}</div>
              <div className="text-sm text-gray-500">Chain ID: {networkConfig.chainId}</div>
              <div className="text-sm text-gray-500">RPC: {networkConfig.rpcUrl}</div>
            </div>
            <button
              onClick={() => setNetwork('testnet')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                network === 'testnet'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {network === 'testnet' ? 'Active' : 'Switch'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">CrossFi Mainnet</div>
              <div className="text-sm text-gray-500">Chain ID: 4158</div>
              <div className="text-sm text-gray-500">RPC: https://rpc.mainnet.ms</div>
            </div>
            <button
              onClick={() => setNetwork('mainnet')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                network === 'mainnet'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {network === 'mainnet' ? 'Active' : 'Switch'}
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> Make sure your wallet is configured for the selected network.
            You may need to add the CrossFi network to your wallet if it's not already configured.
          </div>
        </div>
      </div>
    </div>
  );
}
