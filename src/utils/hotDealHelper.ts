// Hot deal interface (matching the structure in ListingItem)
import { Discount } from '@/types/pagesTypes';

export interface HotDeal {
  enableHotDeal: boolean;
  startDate: string;
  lastDate: string;
  dealNote: string;
  discount: Discount;
}

export enum HotDealStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active', 
  ENDED = 'ended',
  DISABLED = 'disabled'
}

export interface HotDealInfo {
  status: HotDealStatus;
  isValid: boolean;
  startDate?: Date;
  endDate?: Date;
  daysUntilStart?: number;
  daysUntilEnd?: number;
}

/**
 * Determines the status and information about a hot deal
 * @param hotDeal - The hot deal object from a listing
 * @returns HotDealInfo object with status and relevant dates
 */
export function getHotDealInfo(hotDeal?: HotDeal): HotDealInfo {
  // Return disabled status if no hot deal or not enabled
  if (!hotDeal || !hotDeal.enableHotDeal) {
    return { status: HotDealStatus.DISABLED, isValid: false };
  }

  try {
    const now = new Date();
    const startDate = new Date(hotDeal.startDate);
    const endDate = new Date(hotDeal.lastDate);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { status: HotDealStatus.DISABLED, isValid: false };
    }

    const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Determine status
    if (now < startDate) {
      // Upcoming hot deal
      return {
        status: HotDealStatus.UPCOMING,
        isValid: true,
        startDate,
        endDate,
        daysUntilStart,
        daysUntilEnd
      };
    } else if (now >= startDate && now <= endDate) {
      // Active hot deal
      return {
        status: HotDealStatus.ACTIVE,
        isValid: true,
        startDate,
        endDate,
        daysUntilEnd
      };
    } else {
      // Ended hot deal
      return {
        status: HotDealStatus.ENDED,
        isValid: false,
        startDate,
        endDate
      };
    }
  } catch (error) {
    console.error('Error parsing hot deal dates:', error);
    return { status: HotDealStatus.DISABLED, isValid: false };
  }
}

/**
 * Checks if a hot deal should be displayed (upcoming or active)
 * @param hotDeal - The hot deal object from a listing
 * @returns boolean - true if deal should be shown
 */
export function shouldShowHotDeal(hotDeal?: HotDeal): boolean {
  const info = getHotDealInfo(hotDeal);
  return info.status === HotDealStatus.UPCOMING || info.status === HotDealStatus.ACTIVE;
}

/**
 * Checks if a hot deal is currently active
 * @param hotDeal - The hot deal object from a listing  
 * @returns boolean - true if deal is active
 */
export function isHotDealActive(hotDeal?: HotDeal): boolean {
  return getHotDealInfo(hotDeal).status === HotDealStatus.ACTIVE;
}

/**
 * Checks if a hot deal is upcoming
 * @param hotDeal - The hot deal object from a listing
 * @returns boolean - true if deal is upcoming
 */
export function isHotDealUpcoming(hotDeal?: HotDeal): boolean {
  return getHotDealInfo(hotDeal).status === HotDealStatus.UPCOMING;
}

/**
 * Formats the upcoming hot deal message
 * @param hotDeal - The hot deal object from a listing
 * @param t - Translation function
 * @returns string - Formatted message
 */
export function getUpcomingHotDealMessage(hotDeal?: HotDeal, t?: (key: string, params?: Record<string, string | number | Date>) => string): string {
  const info = getHotDealInfo(hotDeal);
  
  if (info.status !== HotDealStatus.UPCOMING || !info.startDate) {
    return '';
  }

  const daysUntil = info.daysUntilStart || 0;

  if (daysUntil === 0) {
    return t?.('startsOn') || `Specialus pasiūlymas`;
  } else if (daysUntil === 1) {
    return t?.('startsTomorrow') || `Specialus pasiūlymas prasideda jau rytoj!`;
  } else if (daysUntil <= 7) {
    return t?.('startsInDays', { days: daysUntil }) || `Specialus pasiūlymas startuoja po ${daysUntil} dienų!`;
  } else {
    return t?.('startsOn') || `Specialus pasiūlymas!`;
  }
}
