'use client';

import { useContract, useContractWrite, useContractRead, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES, NETWORK_CONFIGS } from '@/lib/contracts';
import { CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';
import { useNetwork } from '@/contexts/NetworkContext';

// Types for contract interactions
export interface CampaignData {
  id: number;
  name: string;
  description: string;
  creator: string;
  totalPool: string;
  startDate: number;
  endDate: number;
  status: number;
  registeredAppsCount: number;
  totalTransactions: number;
  totalVolume: string;
}

export interface AppInfo {
  id: string;
  name: string;
  developer: string;
  registeredCampaigns: number[];
  totalRewards: string;
  totalTransactions: number;
}

export interface CreateCampaignData {
  name: string;
  description: string;
  totalPool: string;
  startDate: number;
  endDate: number;
  rewardType: number;
  rulesHash: string;
}

export interface RegisterAppData {
  appId: string;
  appName: string;
  description: string;
  category: string;
  websiteUrl: string;
}

export interface TransactionData {
  appId: string;
  campaignId: number;
  txHash: string;
  gasUsed: string;
  gasPrice: string;
  transactionValue: string;
  transactionType: number;
  additionalData: string;
}

// Hook for campaign management
export function useCampaigns() {
  const { network } = useNetwork();
  const contractAddress = CONTRACT_ADDRESSES[network];

  const { write: createCampaignWrite, isLoading: isCreatingCampaign } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: CROSS_ERA_REWARD_SYSTEM_ABI,
    functionName: 'createCampaign',
  });

  const { write: activateCampaignWrite, isLoading: isActivatingCampaign } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: CROSS_ERA_REWARD_SYSTEM_ABI,
    functionName: 'activateCampaign',
  });

  const createCampaign = async (campaignData: CreateCampaignData) => {
    try {
      await createCampaignWrite({
        args: [
          campaignData.name,
          campaignData.description,
          BigInt(campaignData.totalPool),
          BigInt(campaignData.startDate),
          BigInt(campaignData.endDate),
          campaignData.rewardType,
          campaignData.rulesHash as `0x${string}`,
        ],
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };

  const activateCampaign = async (campaignId: number) => {
    try {
      await activateCampaignWrite({
        args: [BigInt(campaignId)],
      });
    } catch (error) {
      console.error('Error activating campaign:', error);
      throw error;
    }
  };

  return {
    createCampaign,
    activateCampaign,
    isCreatingCampaign,
    isActivatingCampaign,
  };
}

// Hook for app registration
export function useRegisterApp() {
  const { network } = useNetwork();
  const contractAddress = CONTRACT_ADDRESSES[network];

  const { write: registerAppWrite, isLoading: isRegisteringApp } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: CROSS_ERA_REWARD_SYSTEM_ABI,
    functionName: 'registerApp',
  });

  const { write: updateAppWrite, isLoading: isUpdatingApp } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: CROSS_ERA_REWARD_SYSTEM_ABI,
    functionName: 'updateApp',
  });

  const registerApp = async (appData: RegisterAppData) => {
    try {
      await registerAppWrite({
        args: [
          appData.appId,
          appData.appName,
          appData.description,
          appData.category,
          appData.websiteUrl,
        ],
      });
      return appData.appId;
    } catch (error) {
      console.error('Error registering app:', error);
      throw error;
    }
  };

  const updateApp = async (appId: string, appData: Omit<RegisterAppData, 'appId'>) => {
    try {
      await updateAppWrite({
        args: [
          appId,
          appData.appName,
          appData.description,
          appData.category,
          appData.websiteUrl,
        ],
      });
    } catch (error) {
      console.error('Error updating app:', error);
      throw error;
    }
  };

  return {
    registerApp,
    updateApp,
    isRegisteringApp,
    isUpdatingApp,
  };
}

// Hook for transaction management
export function useSendTransaction() {
  const { network } = useNetwork();
  const contractAddress = CONTRACT_ADDRESSES[network];

  const { write: processTransactionWrite, isLoading: isProcessingTransaction } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: CROSS_ERA_REWARD_SYSTEM_ABI,
    functionName: 'processTransaction',
  });

  const sendTransaction = async (txData: TransactionData) => {
    try {
      await processTransactionWrite({
        args: [
          txData.appId,
          BigInt(txData.campaignId),
          txData.txHash as `0x${string}`,
          BigInt(txData.gasUsed),
          BigInt(txData.gasPrice),
          BigInt(txData.transactionValue),
          txData.transactionType,
          txData.additionalData as `0x${string}`,
        ],
      });
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error;
    }
  };

  return {
    sendTransaction,
    isProcessingTransaction,
  };
}

// Hook for reward management
export function useRewards() {
  const { network } = useNetwork();
  const contractAddress = CONTRACT_ADDRESSES[network];

  const { write: claimRewardsWrite, isLoading: isClaimingRewards } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: CROSS_ERA_REWARD_SYSTEM_ABI,
    functionName: 'claimRewards',
  });

  const claimRewards = async (appId: string, campaignId: number) => {
    try {
      await claimRewardsWrite({
        args: [appId, BigInt(campaignId)],
      });
    } catch (error) {
      console.error('Error claiming rewards:', error);
      throw error;
    }
  };

  return {
    claimRewards,
    isClaimingRewards,
  };
}

// Hook for reading contract data
export function useContractData() {
  const { network } = useNetwork();
  const contractAddress = CONTRACT_ADDRESSES[network];

  const { data: campaignData, refetch: refetchCampaign } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: CROSS_ERA_REWARD_SYSTEM_ABI,
    functionName: 'getCampaign',
    args: [BigInt(1)], // Example campaign ID
  });

  const getClaimableRewards = (appId: string, campaignId: number) => {
    const { data } = useContractRead({
      address: contractAddress as `0x${string}`,
      abi: CROSS_ERA_REWARD_SYSTEM_ABI,
      functionName: 'getClaimableRewards',
      args: [appId, BigInt(campaignId)],
    });
    return data;
  };

  const isTransactionProcessed = (txHash: string) => {
    const { data } = useContractRead({
      address: contractAddress as `0x${string}`,
      abi: CROSS_ERA_REWARD_SYSTEM_ABI,
      functionName: 'isTransactionProcessed',
      args: [txHash as `0x${string}`],
    });
    return data;
  };

  return {
    campaignData,
    refetchCampaign,
    getClaimableRewards,
    isTransactionProcessed,
  };
}
