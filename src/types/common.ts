import { ListingItem } from "./pagesTypes";
import { User } from "./userTypes";

export interface LikedListing{
    id: number;
    documentId: string;
    listing: ListingItem;
    user: User
}