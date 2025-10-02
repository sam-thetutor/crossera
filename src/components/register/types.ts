export interface ProjectFormData {
  app_id: string;
  app_name: string;
  description: string;
  category: string;
  website_url: string;
  logo_url: string;
  github_url: string;
  twitter_url: string;
  discord_url: string;
}

export const CATEGORIES = [
  'DeFi',
  'NFT',
  'Gaming',
  'Metaverse',
  'DAO',
  'Infrastructure',
  'Other'
] as const;

export const INITIAL_FORM_DATA: ProjectFormData = {
  app_id: '',
  app_name: '',
  description: '',
  category: 'DeFi',
  website_url: '',
  logo_url: '',
  github_url: '',
  twitter_url: '',
  discord_url: ''
};

export type RegistrationStep = 
  | 'basic-info' 
  | 'links' 
  | 'review' 
  | 'blockchain' 
  | 'success';

export interface StepInfo {
  id: RegistrationStep;
  title: string;
  description: string;
}

export const STEPS: StepInfo[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter your project details'
  },
  {
    id: 'links',
    title: 'Links & Social',
    description: 'Add your project links'
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review your information'
  },
  {
    id: 'blockchain',
    title: 'Register',
    description: 'Blockchain registration'
  },
  {
    id: 'success',
    title: 'Complete',
    description: 'Registration complete'
  }
];

