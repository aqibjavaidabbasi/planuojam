import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";
import { createQuery, deleteAPI, fetchAPI, postAPIWithToken, putAPI } from "./api";
import type { ListingItem } from "@/types/pagesTypes";

export async function createListing(data: Record<string, unknown>) {
    const res = await postAPIWithToken("listings", data);
    return res;
}

export async function updateListing(id: string, data: Record<string, unknown>) {
    const res = await putAPI(`listings/${id}`, data);
    return res;
}

export async function deleteListing(id: string) {
    const res = await deleteAPI(`listings/${id}`);
    return res;
}

// Fetch listing by documentId with necessary relations populated
export async function fetchListingByDocumentId(documentId: string): Promise<ListingItem | undefined> {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const query = createQuery(populate);
    const filters: Record<string, unknown> = {
        filters: {
            documentId: {
                $eq: documentId
            }
        }
    };

    const data = await fetchAPI('listings', query, filters);
    return Array.isArray(data) ? (data[0] as ListingItem | undefined) : (data as ListingItem | undefined);
}


// Fetch all listings created by a user, optionally filtered by listingStatus
export async function fetchListingsByUser(documentId: string, status?: string): Promise<ListingItem[]> {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const query = createQuery(populate);
    const filters: Record<string, unknown> = {
        filters: {
            user: { documentId: { $eq: documentId } },
        },
        sort: ['updatedAt:desc']
    };
    if (status && status !== 'all') {
        (filters as { filters: Record<string, unknown> }).filters.listingStatus = { $eq: status };
    }
    const data = await fetchAPI('listings', query, filters);
    return Array.isArray(data) ? (data as ListingItem[]) : [];
}
