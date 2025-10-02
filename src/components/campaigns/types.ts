export interface CampaignFormData {
  name: string;
  description: string;
  category: string;
  banner_image_url: string;
  logo_url: string;
  total_pool: string;
  start_date: string;
  end_date: string;
  eligibility_criteria: string;
  terms_url: string;
  website_url: string;
  twitter_url: string;
  discord_url: string;
  is_featured: boolean;
  tags: string[];
}

export const CAMPAIGN_CATEGORIES = [
  'DeFi',
  'NFT',
  'Gaming',
  'Metaverse',
  'Infrastructure',
  'General',
  'Other'
] as const;

export const INITIAL_CAMPAIGN_DATA: CampaignFormData = {
  name: '',
  description: '',
  category: 'General',
  banner_image_url: '',
  logo_url: '',
  total_pool: '',
  start_date: '',
  end_date: '',
  eligibility_criteria: '',
  terms_url: '',
  website_url: '',
  twitter_url: '',
  discord_url: '',
  is_featured: false,
  tags: []
};

export type CampaignCreationStep = 
  | 'basic-info' 
  | 'details' 
  | 'links'
  | 'review' 
  | 'blockchain' 
  | 'success';

export interface CampaignStepInfo {
  id: CampaignCreationStep;
  title: string;
  description: string;
}

export const CAMPAIGN_STEPS: CampaignStepInfo[] = [
  {
    id: 'basic-info',
    title: 'Basic Info',
    description: 'Campaign name and category'
  },
  {
    id: 'details',
    title: 'Details',
    description: 'Pool, dates, and eligibility'
  },
  {
    id: 'links',
    title: 'Links',
    description: 'Social and resources'
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review your campaign'
  },
  {
    id: 'blockchain',
    title: 'Deploy',
    description: 'Blockchain registration'
  },
  {
    id: 'success',
    title: 'Complete',
    description: 'Campaign created'
  }
];

