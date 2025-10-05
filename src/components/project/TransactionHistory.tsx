'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

interface TransactionHistoryProps {
  projectId: string;
}

export function TransactionHistory({ projectId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [projectId]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/projects/transactions?project_id=${projectId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="glass-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">Transaction History</h2>
        <LoadingSpinner size="sm" message="Loading transactions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">Transaction History</h2>
        <div className="glass-card rounded-lg p-4 border-red-500 border-opacity-30">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        Transaction History
        <span className="ml-2 text-sm font-normal text-gray-400">
          ({transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'})
        </span>
      </h2>

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Transactions will appear here once you start submitting them for verification"
          icon="📜"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white divide-opacity-10">
            <thead className="bg-black bg-opacity-20 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Transaction Hash
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Reward
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white divide-opacity-10">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white hover:bg-opacity-5 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-white">
                      {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300">
                      {tx.transaction_type || 'Other'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-400">
                      {tx.reward_calculated ? 
                        `${(parseFloat(tx.reward_calculated) / 1e18).toFixed(4)} XFI` : 
                        '-'
                      }
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-400">
                      {formatDate(tx.processed_at)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <a
                      href={`https://scan.crossfi.org/tx/${tx.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                    >
                      View →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

