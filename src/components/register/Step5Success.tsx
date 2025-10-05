'use client';

import Link from 'next/link';
import { ProjectFormData } from './types';

interface Step5SuccessProps {
  formData: ProjectFormData;
  txHash: string;
}

export function Step5Success({ formData, txHash }: Step5SuccessProps) {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center py-8">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Registration Complete!
        </h2>
        <p className="text-lg text-gray-600 mb-2">
          Your project <span className="font-semibold text-blue-600">{formData.app_name}</span> has been successfully registered
        </p>
        <p className="text-sm text-gray-500">
          App ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{formData.app_id}</span>
        </p>
      </div>

      {/* Transaction Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-3">✓ Blockchain Confirmed</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-800">Transaction Hash:</span>
            <a
              href={`https://scan.crossfi.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline font-mono"
            >
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-800">Network:</span>
            <span className="text-sm font-medium text-green-900">CrossFi Testnet</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-800">Status:</span>
            <span className="text-sm font-medium text-green-900">Registered & Confirmed</span>
          </div>
        </div>
      </div>

      {/* What's Next */}
      {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">What's Next?</h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="text-blue-600 mr-3">1.</span>
            <div>
              <p className="text-sm font-medium text-blue-900">Include Your App ID</p>
              <p className="text-sm text-blue-700">
                Add your App ID to transaction data or logs to make them eligible for rewards
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-3">2.</span>
            <div>
              <p className="text-sm font-medium text-blue-900">Submit Transactions</p>
              <p className="text-sm text-blue-700">
                Send transaction hashes for verification to earn XFI rewards
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-3">3.</span>
            <div>
              <p className="text-sm font-medium text-blue-900">Join Campaigns</p>
              <p className="text-sm text-blue-700">
                Participate in reward campaigns to maximize your earnings
              </p>
            </div>
          </li>
        </ul>
      </div> */}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard"
          className="flex-1 px-6 py-3 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href={`/projects/${formData.app_id}`}
          className="flex-1 px-6 py-3 bg-white text-blue-600 border border-blue-600 text-center font-semibold rounded-lg hover:bg-blue-50 transition-colors"
        >
          View Project
        </Link>
      </div>

      {/* Resources */}
      {/* <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Helpful Resources</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://docs.crossfi.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            📚 Documentation
          </a>
          <a
            href="https://scan.crossfi.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            🔍 Block Explorer
          </a>
        </div>
      </div> */}
    </div>
  );
}

