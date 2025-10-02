// Form validation utilities

export interface ValidationError {
  field: string;
  message: string;
}

export const validators = {
  appId: (value: string): string | null => {
    if (!value) return 'App ID is required';
    if (value.length < 3) return 'App ID must be at least 3 characters';
    if (value.length > 32) return 'App ID must be less than 32 characters';
    if (!/^[a-zA-Z0-9-]+$/.test(value)) {
      return 'App ID can only contain letters, numbers, and hyphens';
    }
    return null;
  },

  appName: (value: string): string | null => {
    if (!value) return 'App name is required';
    if (value.length < 2) return 'App name must be at least 2 characters';
    if (value.length > 100) return 'App name must be less than 100 characters';
    return null;
  },

  description: (value: string): string | null => {
    if (value && value.length > 1000) {
      return 'Description must be less than 1000 characters';
    }
    return null;
  },

  url: (value: string): string | null => {
    if (!value) return null; // URL is optional
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  requiredUrl: (value: string): string | null => {
    if (!value) return 'This field is required';
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  category: (value: string): string | null => {
    if (!value) return 'Category is required';
    return null;
  }
};

export function validateStep1(data: {
  app_id: string;
  app_name: string;
  description: string;
  category: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  // App ID is auto-generated, no validation needed
  // const appIdError = validators.appId(data.app_id);
  // if (appIdError) errors.push({ field: 'app_id', message: appIdError });

  const appNameError = validators.appName(data.app_name);
  if (appNameError) errors.push({ field: 'app_name', message: appNameError });

  const descError = validators.description(data.description);
  if (descError) errors.push({ field: 'description', message: descError });

  const categoryError = validators.category(data.category);
  if (categoryError) errors.push({ field: 'category', message: categoryError });

  return errors;
}

export function validateStep2(data: {
  website_url: string;
  logo_url: string;
  github_url: string;
  twitter_url: string;
  discord_url: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  const websiteError = validators.url(data.website_url);
  if (websiteError) errors.push({ field: 'website_url', message: websiteError });

  // Logo is mandatory
  const logoError = validators.requiredUrl(data.logo_url);
  if (logoError) errors.push({ field: 'logo_url', message: logoError });

  const githubError = validators.url(data.github_url);
  if (githubError) errors.push({ field: 'github_url', message: githubError });

  const twitterError = validators.url(data.twitter_url);
  if (twitterError) errors.push({ field: 'twitter_url', message: twitterError });

  const discordError = validators.url(data.discord_url);
  if (discordError) errors.push({ field: 'discord_url', message: discordError });

  return errors;
}

