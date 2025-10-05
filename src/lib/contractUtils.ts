import { ethers } from 'ethers';
import { 
  UserCampaignStatus, 
  ProcessedUserCampaignData, 
  GroupedCampaignData, 
  CampaignSummary,
  UserClaimsSummary,
  ContractError 
} from '@/types/contract';

// Utility function to safely convert wei to XFI
export const formatWeiValue = (weiValue: string | number, decimals: number = 4): string => {
  try {
    if (!weiValue || weiValue === '0' || weiValue === 0) {
      return '0.0000';
    }
    
    // Convert to string if it's a number
    const weiString = typeof weiValue === 'number' ? weiValue.toString() : weiValue;
    
    // Remove decimal points if they exist (ethers expects pure integers)
    const cleanWei = weiString.includes('.') ? weiString.split('.')[0] : weiString;
    
    // Convert wei to ether
    const etherValue = ethers.formatEther(cleanWei);
    
    // Format to specified decimal places
    return parseFloat(etherValue).toFixed(decimals);
  } catch (error) {
    console.error('Error formatting wei value:', error, 'Value:', weiValue);
    return '0.0000';
  }
};

// Process raw contract data into user-friendly format
export const processUserCampaignData = (contractData: UserCampaignStatus): ProcessedUserCampaignData[] => {
  const { campaignIds, appIds, estimatedRewards, hasClaimedFlags, userClaimedAmounts, feesGenerated, volumeGenerated } = contractData;
  
  return campaignIds.map((campaignId, index) => ({
    campaignId,
    appId: appIds[index],
    estimatedReward: formatWeiValue(estimatedRewards[index], 4),
    hasClaimed: hasClaimedFlags[index],
    claimedAmount: formatWeiValue(userClaimedAmounts[index], 4),
    feesGenerated: formatWeiValue(feesGenerated[index], 4),
    volumeGenerated: formatWeiValue(volumeGenerated[index], 4)
  }));
};

// Group processed data by campaign ID
export const groupDataByCampaign = (processedData: ProcessedUserCampaignData[]): GroupedCampaignData => {
  return processedData.reduce((groups, item) => {
    if (!groups[item.campaignId]) {
      groups[item.campaignId] = [];
    }
    groups[item.campaignId].push(item);
    return groups;
  }, {} as GroupedCampaignData);
};

// Calculate campaign summary for a specific campaign
export const calculateCampaignSummary = (campaignData: ProcessedUserCampaignData[]): CampaignSummary => {
  const totalApps = campaignData.length;
  const claimableApps = campaignData.filter(app => !app.hasClaimed && parseFloat(app.estimatedReward) > 0).length;
  const claimedApps = campaignData.filter(app => app.hasClaimed).length;
  
  const totalEstimatedRewards = campaignData
    .filter(app => !app.hasClaimed)
    .reduce((sum, app) => sum + parseFloat(app.estimatedReward), 0)
    .toFixed(4);
    
  const totalFeesGenerated = campaignData
    .reduce((sum, app) => sum + parseFloat(app.feesGenerated), 0)
    .toFixed(4);
    
  const totalVolumeGenerated = campaignData
    .reduce((sum, app) => sum + parseFloat(app.volumeGenerated), 0)
    .toFixed(4);

  return {
    totalApps,
    claimableApps,
    claimedApps,
    totalEstimatedRewards,
    totalFeesGenerated,
    totalVolumeGenerated
  };
};

// Calculate user's overall claims summary
export const calculateUserClaimsSummary = (processedData: ProcessedUserCampaignData[]): UserClaimsSummary => {
  const claimedData = processedData.filter(app => app.hasClaimed);
  const totalRewards = claimedData
    .reduce((sum, app) => sum + parseFloat(app.claimedAmount), 0)
    .toFixed(4);
    
  const totalClaims = claimedData.length;
  
  const totalFeesGenerated = processedData
    .reduce((sum, app) => sum + parseFloat(app.feesGenerated), 0)
    .toFixed(4);
    
  const totalVolumeGenerated = processedData
    .reduce((sum, app) => sum + parseFloat(app.volumeGenerated), 0)
    .toFixed(4);
    
  const averageClaimAmount = totalClaims > 0 
    ? (parseFloat(totalRewards) / totalClaims).toFixed(4)
    : '0.0000';
    
  const campaignsParticipated = new Set(processedData.map(app => app.campaignId)).size;

  return {
    totalRewards,
    totalClaims,
    totalFeesGenerated,
    totalVolumeGenerated,
    averageClaimAmount,
    campaignsParticipated
  };
};

// Handle contract errors and provide user-friendly messages
export const handleContractError = (error: any): ContractError => {
  console.error('Contract error:', error);
  
  if (error.code === 'ACTION_REJECTED') {
    return {
      code: 'USER_REJECTED',
      message: 'Transaction was cancelled by user',
      data: error
    };
  }
  
  if (error.message?.includes('insufficient funds')) {
    return {
      code: 'INSUFFICIENT_FUNDS',
      message: 'Insufficient funds for gas fees',
      data: error
    };
  }
  
  if (error.message?.includes('Already claimed')) {
    return {
      code: 'ALREADY_CLAIMED',
      message: 'Rewards have already been claimed',
      data: error
    };
  }
  
  if (error.message?.includes('Campaign not ended yet')) {
    return {
      code: 'CAMPAIGN_NOT_ENDED',
      message: 'Campaign has not ended yet',
      data: error
    };
  }
  
  if (error.message?.includes('No contributions')) {
    return {
      code: 'NO_CONTRIBUTIONS',
      message: 'No contributions to claim',
      data: error
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    data: error
  };
};

// Validate user address format
export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

// Create contract instance
export const createContractInstance = async (): Promise<ethers.Contract> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  const { CONTRACT_ADDRESSES } = await import('@/lib/contracts');
  const { ensureCrossFiMainnet } = await import('@/lib/networkUtils');
  const crossEraABI = await import('@/lib/cross-era-abi.json');

  // Ensure we're on the correct network
  await ensureCrossFiMainnet();

  // Connect to the contract
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  return new ethers.Contract(
    CONTRACT_ADDRESSES.mainnet,
    crossEraABI.abi,
    signer
  );
};
