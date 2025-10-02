'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';

interface TransactionDetails {
  hash: string;
  from: string;
  to: string;
  value: string;
  data: string;
  appId: string;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  timestamp?: number;
}

interface VerifyTabProps {
  onSuccess?: () => void;
}

export function VerifyTab({ onSuccess }: VerifyTabProps) {
  const { isConnected, connect } = useWallet();
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [txDetails, setTxDetails] = useState<TransactionDetails | null>(null);

  const validateTxHash = (hash: string) => {
    if (!hash) {
      setError('Please enter a transaction hash');
      return false;
    }
    if (!hash.startsWith('0x') || hash.length !== 66) {
      setError('Invalid transaction hash format');
      return false;
    }
    return true;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateTxHash(txHash)) return;

    try {
      setLoading(true);
      setError(null);
      setTxDetails(null);

      // Create provider to fetch transaction
      const provider = new ethers.JsonRpcProvider('https://rpc.testnet.ms/');
      
      // Fetch transaction
      const tx = await provider.getTransaction(txHash);
      
      if (!tx) {
        throw new Error('Transaction not found. Please check the hash and try again.');
      }

      // Fetch transaction receipt for gas details
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        throw new Error('Transaction not confirmed yet. Please wait and try again.');
      }

      // Decode app_id from data field
      let appId = '';
      try {
        if (tx.data && tx.data !== '0x') {
          appId = ethers.toUtf8String(tx.data);
        }
      } catch (err) {
        appId = 'Unable to decode (not valid UTF-8)';
      }

      // Get block timestamp
      let timestamp;
      try {
        const block = await provider.getBlock(receipt.blockNumber);
        timestamp = block?.timestamp;
      } catch (err) {
        console.warn('Failed to fetch block timestamp:', err);
      }

      // Prepare transaction details
      const details: TransactionDetails = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: ethers.formatEther(tx.value),
        data: tx.data,
        appId: appId,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : '0',
        timestamp: timestamp
      };

      setTxDetails(details);

    } catch (err: any) {
      console.error('Verify error:', err);
      setError(err.message || 'Failed to fetch transaction details');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTxHash('');
    setTxDetails(null);
    setError(null);
    setSuccess(null);
  };

  const handleSubmitForRewards = async () => {
    if (!txDetails) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_hash: txDetails.hash,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if error is retryable (RPC issue)
        if (data.retryable) {
          throw new Error(
            `${data.error}\n\n⚠️ This is a temporary network issue. Please click "Submit for Rewards" again in a few seconds.`
          );
        }
        throw new Error(data.error || 'Failed to submit transaction for rewards');
      }

      setSuccess(
        `✅ Transaction processed successfully! Updated ${data.data.campaignsUpdated} campaign(s). Process TX: ${data.data.processTxHash}`
      );
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (err: any) {
      console.error('Submit for rewards error:', err);
      setError(err.message || 'Failed to submit transaction for rewards');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-gray-600 mb-6">
          Please connect your wallet to verify transactions
        </p>
        <button
          onClick={connect}
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Verify Transaction</h3>
        <p className="text-sm text-gray-600">
          Enter a transaction hash to decode the app ID and view details
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 whitespace-pre-line">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800">{success}</p>
        </div>
      )}

      {!txDetails ? (
        <form onSubmit={handleVerify} className="space-y-6">
          {/* Transaction Hash Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Hash <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => {
                setTxHash(e.target.value);
                setError(null);
              }}
              placeholder="0x..."
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Paste the transaction hash from the "Send" tab or any CrossFi transaction
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 This will fetch the transaction from the blockchain and decode the app ID from the data field
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Fetching...
                </span>
              ) : (
                'Verify Transaction'
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Transaction Details Display */
        <div className="space-y-6">
          {/* Success Header */}
          <div className="text-center py-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-lg font-semibold text-green-800">Transaction Verified!</p>
          </div>

          {/* Extracted App ID */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h4 className="text-sm font-semibold text-purple-900 mb-3">Extracted App ID</h4>
            <div className="bg-white rounded-lg p-4">
              <p className="text-2xl font-bold text-purple-600 text-center">
                {txDetails.appId}
              </p>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Transaction Details</h4>
            <dl className="space-y-3">
              <div className="flex justify-between items-start">
                <dt className="text-sm font-medium text-gray-500">Hash</dt>
                <dd className="text-sm font-mono text-gray-900 text-right break-all ml-4">
                  {txDetails.hash}
                  <a
                    href={`https://scan.testnet.crossfi.org/tx/${txDetails.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline ml-2"
                  >
                    →
                  </a>
                </dd>
              </div>
              
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">From</dt>
                <dd className="text-sm font-mono text-gray-900">
                  {txDetails.from.slice(0, 10)}...{txDetails.from.slice(-8)}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">To</dt>
                <dd className="text-sm font-mono text-gray-900">
                  {txDetails.to.slice(0, 10)}...{txDetails.to.slice(-8)}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Value</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {txDetails.value} XFI
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Block Number</dt>
                <dd className="text-sm text-gray-900">{txDetails.blockNumber}</dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Gas Used</dt>
                <dd className="text-sm text-gray-900">{txDetails.gasUsed}</dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Gas Price</dt>
                <dd className="text-sm text-gray-900">{txDetails.gasPrice} Gwei</dd>
              </div>

              {txDetails.timestamp && (
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(txDetails.timestamp * 1000).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Raw Data Field */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Raw Data Field</h4>
            <p className="text-xs font-mono text-gray-700 break-all">
              {txDetails.data || '0x (empty)'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleReset}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify Another
            </button>
            <button
              onClick={handleSubmitForRewards}
              disabled={submitting || !txDetails.appId || txDetails.appId.includes('Unable to decode')}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Submitting...
                </span>
              ) : (
                'Submit for Rewards'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

