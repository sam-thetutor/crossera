'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { getCampaignStatus } from '@/lib/dateUtils';
import { useUserCampaignStatus } from '@/hooks/useUserCampaignStatus';
import { ProcessedUserCampaignData } from '@/types/contract';

// Helper function to safely format wei values
const formatWeiValue = (value: string, decimals: number = 4): string => {
  try {
    if (!value || value === '0') return '0.0000';
    
    // Convert to number and back to string to remove any decimal points
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.0000';
    
    // If the value is very large, it's likely already in wei format
    if (numValue > 1e15) {
      return parseFloat(ethers.formatEther(Math.floor(numValue).toString())).toFixed(decimals);
    } else {
      // If it's smaller, it might already be in XFI format
      return numValue.toFixed(decimals);
    }
  } catch (error) {
    console.error('Error formatting wei value:', error);
    return '0.0000';
  }
};

// Legacy interface for backward compatibility with campaign data
interface CampaignData {
  id: number;
  name: string;
  description: string;
  rewardPool: string;
  totalDistributed: string;
  remainingRewards: string;
  isActive: boolean;
  isEnded: boolean;
  startDate: string;
  endDate: string;
  registeredApps: string[];
}

interface CampaignClaimsSectionProps {
  campaignId: number;
  onClaimSuccess?: () => void;
}

export default function CampaignClaimsSection({ campaignId, onClaimSuccess }: CampaignClaimsSectionProps) {
  const { address } = useAccount();
  const { 
    getCampaignData, 
    getCampaignSummary, 
    loading: contractLoading, 
    error: contractError, 
    refresh 
  } = useUserCampaignStatus();
  
  // Get campaign-specific data from the hook
  const campaignApps = getCampaignData(campaignId);
  const campaignSummary = getCampaignSummary(campaignId);
  
  // Legacy campaign data (we'll fetch this separately for now)
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  // Fetch campaign metadata (name, description, etc.) from API
  const fetchCampaignData = async () => {
    try {
      setCampaignLoading(true);
      // Add cache-busting timestamp to prevent stale data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/campaigns/${campaignId}?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch campaign data');
      }
      
      const data = await response.json();
      
      console.log('🔄 CampaignClaimsSection fetched data:', {
        campaignId,
        totalPool: data.campaign.total_pool,
        distributedRewards: data.campaign.distributed_rewards
      });
      
      // Map database fields to expected interface
      const campaign: CampaignData = {
        id: data.campaign.campaign_id,
        name: data.campaign.name,
        description: data.campaign.description || '',
        rewardPool: data.campaign.total_pool || '0',
        totalDistributed: data.campaign.distributed_rewards || '0',
        remainingRewards: (parseFloat(data.campaign.total_pool || '0') - parseFloat(data.campaign.distributed_rewards || '0')).toString(),
        isActive: getCampaignStatus(data.campaign.start_date, data.campaign.end_date, data.campaign.is_active) === 'active',
        isEnded: getCampaignStatus(data.campaign.start_date, data.campaign.end_date, data.campaign.is_active) === 'ended',
        startDate: data.campaign.start_date,
        endDate: data.campaign.end_date,
        registeredApps: []
      };
      
      setCampaignData(campaign);
      setCampaignError(null);
    } catch (err) {
      console.error('Error fetching campaign data:', err);
      setCampaignError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCampaignLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);

  // Combined loading and error states
  const loading = contractLoading || campaignLoading;
  const error = contractError || campaignError;

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold mb-2">⚠️ Error Loading Claims</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!campaignData && !campaignApps.length) {
    return (
      <div className="glass-card p-6">
        <div className="text-gray-500 text-center">
          <p>No claims data available</p>
        </div>
      </div>
    );
  }

  // Use campaign data and summary from new system
  const campaign = campaignData;
  const userApps = campaignApps;
  const summary = campaignSummary;

  return (
    <div className="space-y-6">
      {/* Campaign Reward Pool Information */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          💰 Reward Pool Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {campaignData ? formatWeiValue(campaignData.rewardPool || '0', 4) : '0.0000'} XFI
            </div>
            <div className="text-sm text-gray-400">Total Pool</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {campaignData ? formatWeiValue(campaignData.totalDistributed || '0', 4) : '0.0000'} XFI
            </div>
            <div className="text-sm text-gray-400">Distributed</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {campaignData ? formatWeiValue(campaignData.remainingRewards || '0', 4) : '0.0000'} XFI
            </div>
            <div className="text-sm text-gray-400">Remaining</div>
          </div>
        </div>

      
      </div>

      {/* User Apps & Claims */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          📊 Your Apps & Claims
        </h3>

        {(summary?.totalApps || 0) === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">📱 No Apps Registered</div>
            <p className="text-gray-500">
              You don't have any apps registered for this campaign.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{summary?.totalApps || 0}</div>
                <div className="text-sm text-gray-400">Total Apps</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{summary?.claimableApps || 0}</div>
                <div className="text-sm text-gray-400">Can Claim</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{summary?.claimedApps || 0}</div>
                <div className="text-sm text-gray-400">Already Claimed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">
                  {formatWeiValue(summary?.totalEstimatedRewards || '0', 2)} XFI
                </div>
                <div className="text-sm text-gray-400">Est. Rewards</div>
              </div>
            </div>

            {/* App Cards */}
            <div className="space-y-4">
              {userApps.map((app) => (
                <AppClaimCard
                  key={app.appId}
                  app={app}
                  campaignId={campaignId}
                  campaign={campaignData}
                  onClaimSuccess={async () => {
                    // Wait a moment for database to update, then refresh data
                    console.log('🔄 Claim successful, refreshing data...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Refresh claims section data
                    refresh();
                    fetchCampaignData();
                    
                    // Call parent callback to refresh campaign details page
                    if (onClaimSuccess) {
                      console.log('🔄 Calling parent onClaimSuccess callback...');
                      await onClaimSuccess();
                      console.log('✅ Parent page refreshed');
                    }
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// App Claim Card Component
interface AppClaimCardProps {
  app: ProcessedUserCampaignData;
  campaignId: number;
  campaign: CampaignData | null;
  onClaimSuccess: () => void;
}

function AppClaimCard({ app, campaignId, campaign, onClaimSuccess }: AppClaimCardProps) {
  const { address } = useAccount();
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);

  // Fetch project name from database
  useEffect(() => {
    const fetchProjectName = async () => {
      try {
        const response = await fetch(`/api/projects/${app.appId}`);
        const data = await response.json();
        if (data.success && data.project) {
          setProjectName(data.project.app_name);
        }
      } catch (error) {
        console.error('Error fetching project name:', error);
      }
    };
    
    fetchProjectName();
  }, [app.appId]);

  const handleClaim = async () => {
    if (!window.ethereum) {
      setClaimError('Please install MetaMask');
      return;
    }

    try {
      setClaiming(true);
      setClaimError(null);

      // Import ethers and contract configuration
      const { ethers } = await import('ethers');
      const { CONTRACT_ADDRESSES } = await import('@/lib/contracts');
      const { CROSS_ERA_REWARD_SYSTEM_ABI } = await import('@/lib/serverConfig');
      const { ensureCrossFiMainnet } = await import('@/lib/networkUtils');

      // Ensure we're on the correct network
      await ensureCrossFiMainnet();

      // Connect to the contract
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.mainnet,
        CROSS_ERA_REWARD_SYSTEM_ABI,
        signer
      );

      // Call the claimRewards function directly on the contract
      const tx = await contract.claimRewards(app.appId, campaignId);
      console.log('Claim transaction submitted:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Claim transaction confirmed:', receipt);

      // Get the actual claim amount from the transaction receipt
      // Look for RewardsClaimed event to get the actual amount
      let actualClaimAmountWei = ethers.parseEther(app.estimatedReward).toString();
      
      if (receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === 'RewardsClaimed') {
              // This is the rewards claimed event
              const amount = parsedLog.args.amount || parsedLog.args[3];
              if (amount) {
                actualClaimAmountWei = amount.toString();
                console.log('Actual claim amount from event:', ethers.formatEther(amount), 'XFI');
                console.log('In wei:', actualClaimAmountWei);
                break;
              }
            }
          } catch (e) {
            // Not a RewardsClaimed event, continue
          }
        }
      }

      console.log('📊 Recording claim to database:', {
        claimTxHash: receipt.hash,
        claimAmountWei: actualClaimAmountWei,
        claimAmountXFI: ethers.formatEther(actualClaimAmountWei)
      });

      // Update the database with the claim information (amount in WEI format)
      const recordResponse = await fetch(`/api/campaigns/${campaignId}/claims/${app.appId}/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimTxHash: receipt.hash,
          claimAmount: actualClaimAmountWei,  // Send in WEI format
          claimedBy: address,
        }),
      });

      const recordData = await recordResponse.json();
      
      if (!recordResponse.ok) {
        console.error('❌ Failed to record claim in database:');
        console.error('   Status:', recordResponse.status);
        console.error('   Error:', recordData);
        
        // Show specific error message for authorization issues
        if (recordResponse.status === 403) {
          setClaimError(recordData.error || 'You can only claim rewards for your own apps');
        } else {
          // Don't throw error here - the claim was successful on-chain
          console.log('⚠️  Claim was successful on-chain but database recording failed');
        }
      } else {
        console.log('✅ Claim recorded successfully in database:', recordData);
      }

      // Show success message
      setClaimError(null);
      alert(`🎉 Successfully claimed ${app.estimatedReward} XFI!`);
      
      onClaimSuccess();
    } catch (err: any) {
      console.error('Claim error:', err);
      
      // Handle specific error messages
      if (err.message?.includes('user rejected')) {
        setClaimError('Transaction was cancelled by user');
      } else if (err.message?.includes('insufficient funds')) {
        setClaimError('Insufficient funds for gas fees');
      } else if (err.message?.includes('Campaign not ended yet')) {
        setClaimError('Campaign has not ended yet');
      } else if (err.message?.includes('Already claimed')) {
        setClaimError('Rewards have already been claimed');
      } else if (err.message?.includes('No contributions')) {
        setClaimError('No contributions to claim');
      } else {
        setClaimError(err.message || 'Claim failed');
      }
    } finally {
      setClaiming(false);
    }
  };

  const getStatusColor = () => {
    if (app.hasClaimed) return 'text-green-400';
    if (parseFloat(app.estimatedReward) > 0) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (app.hasClaimed) return '✅ Claimed';
    if (parseFloat(app.estimatedReward) > 0) return '💰 Ready to Claim';
    if (campaign?.isEnded) return '🔴 Campaign Ended';
    return '⏳ Campaign Active';
  };

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
      {claimError && (
        <div className="mb-3 p-2 bg-red-900/30 border border-red-500/30 rounded text-red-400 text-sm">
          {claimError}
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* App Name */}
        <div className="flex-1">
          <h4 className="font-semibold text-white text-lg">
            {projectName || 'Loading...'}
          </h4>
          {/* <div className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div> */}
        </div>

        {/* Fees Generated */}
        <div className="flex-1 text-center">
          <div className="text-sm text-gray-400 mb-1">Fees </div>
          <div className="font-semibold text-white">
            {app.feesGenerated} XFI
          </div>
        </div>

        {/* Volume Generated */}
        <div className="flex-1 text-center">
          <div className="text-sm text-gray-400 mb-1">Volume </div>
          <div className="font-semibold text-white">
            {app.volumeGenerated} XFI
          </div>
        </div>

        {/* Rewards */}
        <div className="flex-1 text-center">
          <div className="text-sm text-gray-400 mb-1">Rewards</div>
          <div className="font-semibold text-yellow-400">
            {app.hasClaimed ? '0.0000' : app.estimatedReward} XFI
          </div>
        </div>

        {/* Claim Button */}
        <div className="flex-1 flex justify-center">
          {app.hasClaimed ? (
            <div className="text-green-400">
              ✅ Claimed
            </div>
          ) : campaign?.isActive ? (
            <button
              disabled
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium cursor-not-allowed opacity-60"
              title="You can claim rewards after the campaign ends"
            >
              💰 Claim 
            </button>
          ) : (parseFloat(app.estimatedReward) > 0) ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {claiming ? 'Claiming...' : '💰 Claim'}
            </button>
          ) : (
            <div className="text-gray-500 text-sm">
              No rewards to claim
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
