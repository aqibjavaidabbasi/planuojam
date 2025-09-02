import { ListingItem } from "./pagesTypes";

export interface strapiImage{
    id: number;
    url: string;
    width: number;
    formats: {
        small: {
            url: string;
            width: number;
        },
        medium: {
            url: string;
            width: number;
        },
        thumbnail: {
            url: string;
            width: number;
        }
    }
}

export interface LikedListing{
    id: number;
    documentId: string;
    listing: ListingItem;
    user: User
}

export interface User{
    username: string;
    email: string;
    blocked: boolean;
    confirmed: boolean;
    id: number;
    documentId: string;
    serviceType: string | null;
}