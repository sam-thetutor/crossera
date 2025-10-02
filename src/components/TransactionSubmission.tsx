'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useNetwork } from '@/contexts/NetworkContext';

export function TransactionSubmission() {
  const { isConnected, address } = useWallet();
  const { network } = useNetwork();
  const [txHash, setTxHash] = useState('');
  const [appId, setAppId] = useState('');
  const [campaignId, setCampaignId] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!txHash || !appId) {
      alert('Please provide transaction hash and app ID');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_hash: txHash,
          app_id: appId,
          campaign_id: campaignId,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setTxHash('');
        setAppId('');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setResult({ success: false, error: 'Failed to submit transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyTransaction = async () => {
    if (!txHash) {
      alert('Please provide transaction hash');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_hash: txHash,
          app_id: appId,
          campaign_id: campaignId,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Verification error:', error);
      setResult({ success: false, error: 'Failed to verify transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction Submission</h1>
        <p className="text-gray-600">Submit and verify transactions to earn XFI rewards</p>
        <div className="mt-2 text-sm text-gray-500">
          Network: {network} | Connected: {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not connected'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transaction Submission Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Transaction</h2>
          
          <form onSubmit={handleSubmitTransaction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Hash *
              </label>
              <input
                type="text"
                required
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
              />
              <p className="text-xs text-gray-500 mt-1">
                The hash of your CrossFi transaction
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App ID *
              </label>
              <input
                type="text"
                required
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="my-app-123"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your registered app identifier
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign ID
              </label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Campaign 1</option>
                <option value={2}>Campaign 2</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting || !isConnected}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Transaction'}
              </button>

              <button
                type="button"
                onClick={handleVerifyTransaction}
                disabled={isSubmitting || !txHash}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Verifying...' : 'Verify Only'}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
          
          {result ? (
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center mb-2">
                <div className={`w-4 h-4 rounded-full mr-2 ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Success' : 'Error'}
                </span>
              </div>
              
              {result.success ? (
                <div className="text-sm text-green-700">
                  <div className="mb-2">
                    <strong>Transaction:</strong> {result.transactionHash}
                  </div>
                  <div className="mb-2">
                    <strong>App ID:</strong> {result.appId}
                  </div>
                  <div className="mb-2">
                    <strong>Status:</strong> {result.verificationStatus}
                  </div>
                  <div className="mb-2">
                    <strong>Gas Used:</strong> {result.gasUsed}
                  </div>
                  <div className="mb-2">
                    <strong>Fee Generated:</strong> {result.feeGenerated}
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    <strong>Estimated Reward:</strong> {result.estimatedReward} XFI
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-700">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Submit a transaction to see results here
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Earn Rewards</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <div className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            <span>Register your app using the Developer Dashboard</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <span>Include your App ID in your transaction data or logs</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            <span>Submit the transaction hash using this form</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            <span>Claim your XFI rewards from the Developer Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}

