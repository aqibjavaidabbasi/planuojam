import { User } from "./userTypes";

export interface LikedListing{
    id: number;
    documentId: string;
    listing: string;
    user: User
}