import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { 
  UserCampaignStatus, 
  ProcessedUserCampaignData, 
  GroupedCampaignData,
  CampaignSummary,
  UserClaimsSummary 
} from '@/types/contract';
import { 
  processUserCampaignData, 
  groupDataByCampaign, 
  calculateCampaignSummary,
  calculateUserClaimsSummary,
  createContractInstance,
  isValidAddress 
} from '@/lib/contractUtils';

interface UseUserCampaignStatusReturn {
  // Raw data
  rawData: UserCampaignStatus | null;
  processedData: ProcessedUserCampaignData[];
  groupedData: GroupedCampaignData;
  
  // Summaries
  userSummary: UserClaimsSummary | null;
  campaignSummaries: Record<number, CampaignSummary>;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  getCampaignData: (campaignId: number) => ProcessedUserCampaignData[];
  getCampaignSummary: (campaignId: number) => CampaignSummary | null;
}

export const useUserCampaignStatus = (): UseUserCampaignStatusReturn => {
  const { address } = useAccount();
  
  // State
  const [rawData, setRawData] = useState<UserCampaignStatus | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedUserCampaignData[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedCampaignData>({});
  const [userSummary, setUserSummary] = useState<UserClaimsSummary | null>(null);
  const [campaignSummaries, setCampaignSummaries] = useState<Record<number, CampaignSummary>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user campaign status from contract
  const fetchUserCampaignStatus = useCallback(async () => {
    if (!address || !isValidAddress(address)) {
      setRawData(null);
      setProcessedData([]);
      setGroupedData({});
      setUserSummary(null);
      setCampaignSummaries({});
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create contract instance
      const contract = await createContractInstance();
      
      // Call the comprehensive function
      const result = await contract.getUserCampaignStatus(address);
      
      // Transform the result to our interface
      const userCampaignStatus: UserCampaignStatus = {
        campaignIds: result[0].map((id: bigint) => Number(id)),
        appIds: result[1],
        estimatedRewards: result[2].map((reward: bigint) => reward.toString()),
        hasClaimedFlags: result[3],
        userClaimedAmounts: result[4].map((amount: bigint) => amount.toString()),
        feesGenerated: result[5].map((fees: bigint) => fees.toString()),
        volumeGenerated: result[6].map((volume: bigint) => volume.toString())
      };

      // Process the data
      const processed = processUserCampaignData(userCampaignStatus);
      const grouped = groupDataByCampaign(processed);
      const summary = calculateUserClaimsSummary(processed);
      
      // Calculate summaries for each campaign
      const summaries: Record<number, CampaignSummary> = {};
      Object.keys(grouped).forEach(campaignId => {
        const id = parseInt(campaignId);
        summaries[id] = calculateCampaignSummary(grouped[id]);
      });

      // Update state
      setRawData(userCampaignStatus);
      setProcessedData(processed);
      setGroupedData(grouped);
      setUserSummary(summary);
      setCampaignSummaries(summaries);

    } catch (err: any) {
      console.error('Error fetching user campaign status:', err);
      setError(err.message || 'Failed to fetch campaign status');
      
      // Reset data on error
      setRawData(null);
      setProcessedData([]);
      setGroupedData({});
      setUserSummary(null);
      setCampaignSummaries({});
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchUserCampaignStatus();
  }, [fetchUserCampaignStatus]);

  // Get campaign-specific data
  const getCampaignData = useCallback((campaignId: number): ProcessedUserCampaignData[] => {
    return groupedData[campaignId] || [];
  }, [groupedData]);

  // Get campaign-specific summary
  const getCampaignSummary = useCallback((campaignId: number): CampaignSummary | null => {
    return campaignSummaries[campaignId] || null;
  }, [campaignSummaries]);

  // Fetch data on mount and when address changes
  useEffect(() => {
    fetchUserCampaignStatus();
  }, [fetchUserCampaignStatus]);

  return {
    // Raw data
    rawData,
    processedData,
    groupedData,
    
    // Summaries
    userSummary,
    campaignSummaries,
    
    // State
    loading,
    error,
    
    // Actions
    refresh,
    getCampaignData,
    getCampaignSummary
  };
};
