// TypeScript interfaces for smart contract interactions

export interface UserCampaignStatus {
  campaignIds: number[];
  appIds: string[];
  estimatedRewards: string[]; // in wei
  hasClaimedFlags: boolean[];
  userClaimedAmounts: string[]; // in wei
  feesGenerated: string[]; // in wei
  volumeGenerated: string[]; // in wei
}

export interface ProcessedUserCampaignData {
  campaignId: number;
  appId: string;
  estimatedReward: string; // in XFI
  hasClaimed: boolean;
  claimedAmount: string; // in XFI
  feesGenerated: string; // in XFI
  volumeGenerated: string; // in XFI
}

export interface GroupedCampaignData {
  [campaignId: number]: ProcessedUserCampaignData[];
}

export interface CampaignSummary {
  totalApps: number;
  claimableApps: number;
  claimedApps: number;
  totalEstimatedRewards: string; // in XFI
  totalFeesGenerated: string; // in XFI
  totalVolumeGenerated: string; // in XFI
}

export interface UserClaimsSummary {
  totalRewards: string; // in XFI
  totalClaims: number;
  totalFeesGenerated: string; // in XFI
  totalVolumeGenerated: string; // in XFI
  averageClaimAmount: string; // in XFI
  campaignsParticipated: number;
}

export interface ContractError {
  code: string;
  message: string;
  data?: any;
}

export interface ContractCallOptions {
  gasLimit?: number;
  gasPrice?: string;
  value?: string;
}
