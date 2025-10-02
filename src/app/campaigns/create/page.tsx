'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';
import { ensureCrossFiTestnet } from '@/lib/networkUtils';
import { CampaignFormData, INITIAL_CAMPAIGN_DATA, CampaignCreationStep, CAMPAIGN_CATEGORIES } from '@/components/campaigns/types';
import { NetworkWarning } from '@/components/shared/NetworkWarning';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { address, isConnected, connect } = useWallet();
  
  const [currentStep, setCurrentStep] = useState<CampaignCreationStep>('basic-info');
  const [formData, setFormData] = useState<CampaignFormData>(INITIAL_CAMPAIGN_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blockchainStatus, setBlockchainStatus] = useState<
    'idle' | 'saving' | 'signing' | 'confirming' | 'confirmed' | 'error'
  >('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [campaignId, setCampaignId] = useState<number | null>(null);

  // Handle form field changes
  const handleChange = (field: keyof CampaignFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate basic info
  const validateBasicInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Campaign name must be at least 3 characters';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    return newErrors;
  };

  // Validate details
  const validateDetails = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.total_pool || parseFloat(formData.total_pool) <= 0) {
      newErrors.total_pool = 'Total pool must be greater than 0';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }
    
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end <= start) {
        newErrors.end_date = 'End date must be after start date';
      }
      if (start <= new Date()) {
        newErrors.start_date = 'Start date must be in the future';
      }
    }
    
    return newErrors;
  };

  // Navigate between steps
  const handleNext = () => {
    let validationErrors: Record<string, string> = {};

    if (currentStep === 'basic-info') {
      validationErrors = validateBasicInfo();
      if (Object.keys(validationErrors).length === 0) {
        setCurrentStep('details');
      }
    } else if (currentStep === 'details') {
      validationErrors = validateDetails();
      if (Object.keys(validationErrors).length === 0) {
        setCurrentStep('links');
      }
    } else if (currentStep === 'links') {
      setCurrentStep('review');
    }

    setErrors(validationErrors);
  };

  const handleBack = () => {
    if (currentStep === 'details') setCurrentStep('basic-info');
    else if (currentStep === 'links') setCurrentStep('details');
    else if (currentStep === 'review') setCurrentStep('links');
  };

  // Submit campaign
  const handleSubmit = async () => {
    try {
      if (!isConnected || !address) {
        throw new Error('Please connect your wallet');
      }

      setCurrentStep('blockchain');
      setBlockchainStatus('signing');

      // Step 1: Ensure correct network
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.');
      }

      try {
        await ensureCrossFiTestnet();
      } catch (networkError) {
        throw new Error('Please switch to CrossFi Testnet in MetaMask');
      }

      // Step 2: Create campaign on blockchain
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.testnet,
        CROSS_ERA_REWARD_SYSTEM_ABI,
        signer
      );

      const startTimestamp = Math.floor(new Date(formData.start_date).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(formData.end_date).getTime() / 1000);
      const poolAmount = ethers.parseEther(formData.total_pool);

      const tx = await contract.createCampaign(
        startTimestamp,
        endTimestamp,
        { value: poolAmount }
      );
      
      setTxHash(tx.hash);
      setBlockchainStatus('confirming');

      const receipt = await tx.wait();
      
      // Extract campaign ID from transaction logs
      const onChainCampaignId = await contract.totalCampaigns();
      setCampaignId(Number(onChainCampaignId));

      setBlockchainStatus('confirmed');

      // Step 3: Save to Supabase
      setBlockchainStatus('saving');

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: Number(onChainCampaignId),
          name: formData.name,
          description: formData.description,
          banner_image_url: formData.banner_image_url,
          logo_url: formData.logo_url,
          category: formData.category,
          total_pool: formData.total_pool,
          start_date: formData.start_date,
          end_date: formData.end_date,
          eligibility_criteria: formData.eligibility_criteria,
          terms_url: formData.terms_url,
          website_url: formData.website_url,
          twitter_url: formData.twitter_url,
          discord_url: formData.discord_url,
          is_featured: formData.is_featured,
          tags: formData.tags,
          created_by: address,
          blockchain_tx_hash: tx.hash
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save campaign to database');
      }

      setCurrentStep('success');

    } catch (err: any) {
      console.error('Campaign creation error:', err);
      setBlockchainStatus('error');
      setErrorMessage(err.message || 'Failed to create campaign');
      setCurrentStep('blockchain');
    }
  };

  // Require wallet connection
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to create a campaign.
          </p>
          <button
            onClick={connect}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Campaign
          </h1>
          <p className="text-gray-600">
            Launch a reward campaign for CrossFi developers
          </p>
        </div>

        {/* Network Warning */}
        {currentStep !== 'blockchain' && currentStep !== 'success' && (
          <NetworkWarning />
        )}

        {/* Form Container */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          {currentStep === 'basic-info' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
                <p className="text-gray-600">Start with the essentials for your campaign</p>
              </div>

              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Summer DeFi Rewards"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  placeholder="Describe your campaign and its goals..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  {CAMPAIGN_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {currentStep === 'details' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Details</h2>
                <p className="text-gray-600">Set up the reward pool and timeline</p>
              </div>

              {/* Total Pool */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Pool (XFI) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_pool}
                  onChange={(e) => handleChange('total_pool', e.target.value)}
                  placeholder="1000"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${
                    errors.total_pool ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.total_pool && (
                  <p className="mt-1 text-sm text-red-600">{errors.total_pool}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Amount of XFI to allocate for rewards
                </p>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${
                    errors.start_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${
                    errors.end_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                )}
              </div>

              {/* Eligibility Criteria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eligibility Criteria
                </label>
                <textarea
                  value={formData.eligibility_criteria}
                  onChange={(e) => handleChange('eligibility_criteria', e.target.value)}
                  rows={3}
                  placeholder="Who can participate in this campaign..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {currentStep === 'links' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Links & Resources</h2>
                <p className="text-gray-600">Add social links and resources (optional)</p>
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>

              {/* Banner URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner URL
                </label>
                <input
                  type="url"
                  value={formData.banner_image_url}
                  onChange={(e) => handleChange('banner_image_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => handleChange('website_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>

              {/* Twitter URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter URL
                </label>
                <input
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => handleChange('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>

              {/* Discord URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discord URL
                </label>
                <input
                  type="url"
                  value={formData.discord_url}
                  onChange={(e) => handleChange('discord_url', e.target.value)}
                  placeholder="https://discord.gg/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Campaign</h2>
                <p className="text-gray-600">Review all details before creating on-chain</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Campaign Name</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{formData.name}</dd>
                </div>
                {formData.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.description}</dd>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Pool</dt>
                    <dd className="mt-1 text-lg font-bold text-blue-600">{formData.total_pool} XFI</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.category}</dd>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(formData.start_date).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">End Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(formData.end_date).toLocaleString()}
                    </dd>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Important:</strong> You will send <strong>{formData.total_pool} XFI</strong> with this transaction. Make sure you have sufficient balance.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Campaign
                </button>
              </div>
            </div>
          )}

          {currentStep === 'blockchain' && (
            <div className="text-center py-8">
              {blockchainStatus === 'signing' && (
                <>
                  <div className="text-6xl mb-4 animate-pulse">✍️</div>
                  <p className="text-lg font-medium text-gray-900">Waiting for signature...</p>
                  <p className="text-sm text-gray-600 mt-2">Please confirm the transaction in MetaMask</p>
                  <p className="text-sm text-gray-600 mt-4">Sending {formData.total_pool} XFI to contract</p>
                </>
              )}
              {blockchainStatus === 'confirming' && (
                <>
                  <div className="text-6xl mb-4 animate-spin">⏳</div>
                  <p className="text-lg font-medium text-gray-900">Transaction confirming...</p>
                  <p className="text-sm text-gray-600 mt-2">This may take a few moments</p>
                  {txHash && (
                    <a
                      href={`https://scan.testnet.crossfi.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                      View transaction
                    </a>
                  )}
                </>
              )}
              {blockchainStatus === 'confirmed' && (
                <>
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-lg font-medium text-gray-900">Transaction confirmed!</p>
                  <p className="text-sm text-gray-600 mt-2">Campaign registered on blockchain</p>
                </>
              )}
              {blockchainStatus === 'saving' && (
                <>
                  <div className="text-6xl mb-4 animate-pulse">💾</div>
                  <p className="text-lg font-medium text-gray-900">Saving campaign metadata...</p>
                  <p className="text-sm text-gray-600 mt-2">Storing campaign details in database</p>
                </>
              )}
              {blockchainStatus === 'error' && (
                <>
                  <div className="text-6xl mb-4">❌</div>
                  <p className="text-lg font-medium text-red-600">Campaign Creation Failed</p>
                  <p className="text-sm text-gray-600 mt-2">{errorMessage}</p>
                  <button
                    onClick={() => {
                      setCurrentStep('review');
                      setBlockchainStatus('idle');
                      setErrorMessage('');
                    }}
                    className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          )}

          {currentStep === 'success' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Campaign Created Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your campaign has been registered on-chain and saved to the database
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Campaign ID</dt>
                    <dd className="mt-1 text-lg font-bold text-gray-900">{campaignId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Transaction Hash</dt>
                    <dd className="mt-1">
                      <a
                        href={`https://scan.testnet.crossfi.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline font-mono"
                      >
                        {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Pool Amount</dt>
                    <dd className="mt-1 text-lg font-bold text-green-600">{formData.total_pool} XFI</dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/campaigns')}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View All Campaigns
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

