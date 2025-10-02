'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';
import { generateAppId } from '@/lib/uuid';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';
import { validateStep1, validateStep2 } from '@/lib/formValidation';
import { ensureCrossFiTestnet } from '@/lib/networkUtils';
import { ProjectFormData, INITIAL_FORM_DATA, RegistrationStep } from '@/components/register/types';
import { StepIndicator } from '@/components/register/StepIndicator';
import { Step1BasicInfo } from '@/components/register/Step1BasicInfo';
import { Step2Links } from '@/components/register/Step2Links';
import { Step3Review } from '@/components/register/Step3Review';
import { Step4Blockchain } from '@/components/register/Step4Blockchain';
import { Step5Success } from '@/components/register/Step5Success';
import { NetworkWarning } from '@/components/shared/NetworkWarning';

export default function RegisterPage() {
  const router = useRouter();
  const { address, isConnected, connect } = useWallet();
  
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('basic-info');
  const [formData, setFormData] = useState<ProjectFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blockchainStatus, setBlockchainStatus] = useState<
    'idle' | 'saving' | 'signing' | 'confirming' | 'confirmed' | 'error'
  >('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Generate app_id automatically when component mounts
  useEffect(() => {
    const generatedAppId = generateAppId(20);
    setFormData(prev => ({ ...prev, app_id: generatedAppId }));
  }, []);

  // Handle form field changes
  const handleChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate and move to next step
  const handleNext = () => {
    let validationErrors: Array<{ field: string; message: string }> = [];

    if (currentStep === 'basic-info') {
      validationErrors = validateStep1(formData);
      if (validationErrors.length === 0) {
        setCurrentStep('links');
        window.scrollTo(0, 0);
      }
    } else if (currentStep === 'links') {
      validationErrors = validateStep2(formData);
      if (validationErrors.length === 0) {
        setCurrentStep('review');
        window.scrollTo(0, 0);
      }
    }

    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
    }
  };

  // Move to previous step
  const handleBack = () => {
    if (currentStep === 'links') {
      setCurrentStep('basic-info');
    } else if (currentStep === 'review') {
      setCurrentStep('links');
    }
    window.scrollTo(0, 0);
  };

  // Navigate to specific step from review
  const handleEditStep = (stepIndex: number) => {
    if (stepIndex === 0) setCurrentStep('basic-info');
    else if (stepIndex === 1) setCurrentStep('links');
    window.scrollTo(0, 0);
  };

  // Submit and register on blockchain
  const handleSubmit = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setCurrentStep('blockchain');
    setBlockchainStatus('saving');
    setErrorMessage('');

    try {
      // Step 1: Save to Supabase
      const response = await fetch('/api/projects/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          owner_address: address
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save project');
      }

      // Step 2: Ensure correct network
      setBlockchainStatus('signing');

      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.');
      }

      // Check and switch to CrossFi Testnet if needed
      try {
        await ensureCrossFiTestnet();
      } catch (networkError) {
        throw new Error('Please switch to CrossFi Testnet in MetaMask');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.testnet,
        CROSS_ERA_REWARD_SYSTEM_ABI,
        signer
      );

      const tx = await contract.registerApp(formData.app_id);
      setTxHash(tx.hash);

      // Update status to pending
      await fetch('/api/projects/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: formData.app_id,
          tx_hash: tx.hash,
          status: 'pending'
        })
      });

      // Step 3: Wait for confirmation
      setBlockchainStatus('confirming');
      await tx.wait();

      // Update status to confirmed
      await fetch('/api/projects/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: formData.app_id,
          tx_hash: tx.hash,
          status: 'confirmed'
        })
      });

      setBlockchainStatus('confirmed');
      
      // Move to success screen after a short delay
      setTimeout(() => {
        setCurrentStep('success');
        window.scrollTo(0, 0);
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      const message = err instanceof Error ? err.message : 'Registration failed';
      setErrorMessage(message);
      setBlockchainStatus('error');
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to register a new project.
            </p>
            <button
              onClick={connect}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
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
            Register Your Project
          </h1>
          <p className="text-gray-600">
            Start earning rewards for your CrossFi transactions
          </p>
        </div>

        {/* Network Warning */}
        {currentStep !== 'blockchain' && currentStep !== 'success' && (
          <NetworkWarning />
        )}

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Form Container */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 mb-6">
          {/* Step 1: Basic Info */}
          {currentStep === 'basic-info' && (
            <Step1BasicInfo
              formData={formData}
              onChange={handleChange}
              errors={errors}
            />
          )}

          {/* Step 2: Links */}
          {currentStep === 'links' && (
            <Step2Links
              formData={formData}
              onChange={handleChange}
              errors={errors}
            />
          )}

          {/* Step 3: Review */}
          {currentStep === 'review' && (
            <Step3Review
              formData={formData}
              onEdit={handleEditStep}
            />
          )}

          {/* Step 4: Blockchain */}
          {currentStep === 'blockchain' && (
            <Step4Blockchain
              status={blockchainStatus}
              txHash={txHash}
              error={errorMessage}
            />
          )}

          {/* Step 5: Success */}
          {currentStep === 'success' && (
            <Step5Success
              formData={formData}
              txHash={txHash}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 'blockchain' && currentStep !== 'success' && (
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 'basic-info'}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 'basic-info'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ← Back
            </button>

            {currentStep === 'review' ? (
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Submit & Register →
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

