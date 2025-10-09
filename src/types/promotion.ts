
export interface Promotion {
    promotionStatus: string;
    endDate?: string;
    startDate?: string;
    id: number;
    documentId: string;
    maxClickPerDay?: number | null;
    starsPerClick?: number | null;
    maxStarsLimit?: number | null;
    successPercentage?: number | null; // 0-100
    listing?: UserListingOption;
    starsUsed?: number | null;
}


export interface UserListingOption {
  id: string; // listing documentId for relations
  title: string;
  locale?: string;
  localizations?: UserListingOption[]
  documentId: string;
}