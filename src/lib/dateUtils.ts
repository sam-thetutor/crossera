/**
 * Date utility functions for handling timezone-aware campaign dates
 */

/**
 * Convert UTC date string to user's local timezone
 * @param utcDateString - UTC date string from database
 * @returns Date object in user's local timezone
 */
export function utcToLocal(utcDateString: string): Date {
  return new Date(utcDateString);
}

/**
 * Convert local date to UTC for database storage
 * @param localDate - Local date object or string
 * @returns UTC date string for database
 */
export function localToUtc(localDate: Date | string): string {
  const date = typeof localDate === 'string' ? new Date(localDate) : localDate;
  return date.toISOString();
}

/**
 * Get current time in user's local timezone
 * @returns Current Date object in user's local timezone
 */
export function getCurrentLocalTime(): Date {
  return new Date();
}

/**
 * Format date for display in user's local timezone
 * @param utcDateString - UTC date string from database
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in user's local timezone
 */
export function formatLocalDate(
  utcDateString: string, 
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }
): string {
  const localDate = utcToLocal(utcDateString);
  return localDate.toLocaleString('en-US', options);
}

/**
 * Check if a campaign is currently active based on local time
 * @param startDate - Campaign start date (UTC string)
 * @param endDate - Campaign end date (UTC string)
 * @param isActive - Campaign active flag from database
 * @returns true if campaign is currently active
 */
export function isCampaignActive(
  startDate: string, 
  endDate: string, 
  isActive: boolean
): boolean {
  const now = getCurrentLocalTime();
  const start = utcToLocal(startDate);
  const end = utcToLocal(endDate);
  
  return isActive && now >= start && now <= end;
}

/**
 * Check if a campaign has started (regardless of active flag)
 * @param startDate - Campaign start date (UTC string)
 * @returns true if campaign has started
 */
export function hasCampaignStarted(startDate: string): boolean {
  const now = getCurrentLocalTime();
  const start = utcToLocal(startDate);
  
  return now >= start;
}

/**
 * Check if a campaign has ended
 * @param endDate - Campaign end date (UTC string)
 * @returns true if campaign has ended
 */
export function hasCampaignEnded(endDate: string): boolean {
  const now = getCurrentLocalTime();
  const end = utcToLocal(endDate);
  
  return now > end;
}

/**
 * Get campaign status based on local time
 * @param startDate - Campaign start date (UTC string)
 * @param endDate - Campaign end date (UTC string)
 * @param isActive - Campaign active flag from database
 * @returns Campaign status string
 */
export function getCampaignStatus(
  startDate: string, 
  endDate: string, 
  isActive: boolean
): 'upcoming' | 'active' | 'ended' | 'inactive' {
  const now = getCurrentLocalTime();
  const start = utcToLocal(startDate);
  const end = utcToLocal(endDate);
  
  if (now < start) {
    return 'upcoming';
  } else if (now >= start && now <= end && isActive) {
    return 'active';
  } else if (now > end) {
    return 'ended';
  } else {
    return 'inactive';
  }
}

/**
 * Get days remaining until campaign ends
 * @param endDate - Campaign end date (UTC string)
 * @returns Number of days remaining (0 if ended)
 */
export function getDaysRemaining(endDate: string): number {
  const now = getCurrentLocalTime();
  const end = utcToLocal(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Create a datetime-local input value from UTC date string
 * @param utcDateString - UTC date string from database
 * @returns String in format YYYY-MM-DDTHH:MM for datetime-local input
 */
export function utcToDateTimeLocal(utcDateString: string): string {
  const localDate = utcToLocal(utcDateString);
  
  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert datetime-local input value to UTC string for database
 * @param dateTimeLocal - String from datetime-local input (YYYY-MM-DDTHH:MM)
 * @returns UTC date string for database storage
 */
export function dateTimeLocalToUtc(dateTimeLocal: string): string {
  const localDate = new Date(dateTimeLocal);
  return localToUtc(localDate);
}
