import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";
import { createQuery, deleteAPI, fetchAPI, postAPIWithToken, putAPI } from "./api";

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
export async function fetchListingByDocumentId(documentId: string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const query = createQuery(populate);
    const filters = {
        filters: {
            documentId: {
                $eq: documentId
            }
        }
    } as Record<string, unknown>;

    const data = await fetchAPI('listings', query, filters);
    return Array.isArray(data) ? data[0] : data;
}


// Fetch all listings created by a user, optionally filtered by listingStatus
export async function fetchListingsByUser(documentId: string, status?: string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const query = createQuery(populate);
    const filters: any = {
        filters: {
            user: { documentId: { $eq: documentId } },
        },
        sort: ['updatedAt:desc']
    };
    if (status && status !== 'all') {
        filters.filters.listingStatus = { $eq: status };
    }
    const data = await fetchAPI('listings', query, filters);
    return Array.isArray(data) ? data : [];
}
