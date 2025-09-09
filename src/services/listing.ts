import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";
import { createQuery, deleteAPI, fetchAPI, postAPIWithToken, putAPI } from "./api";
import { DEFAULT_LOCALE } from "@/config/i18n";
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
export async function fetchListingByDocumentId(documentId: string, locale?: string): Promise<ListingItem | undefined> {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const filters: Record<string, unknown> = {
        filters: {
            documentId: {
                $eq: documentId
            }
        }
    };
    // Try requested locale first
    if (locale) {
        const queryWithLocale = createQuery(populate, { locale });
        const dataLocale = await fetchAPI('listings', queryWithLocale, filters);
        if (Array.isArray(dataLocale) ? dataLocale.length > 0 : !!dataLocale) {
            return Array.isArray(dataLocale) ? (dataLocale[0] as ListingItem | undefined) : (dataLocale as ListingItem | undefined);
        }
    }

    // Fallback to default locale
    const queryDefault = createQuery(populate, { locale: DEFAULT_LOCALE });
    const dataDefault = await fetchAPI('listings', queryDefault, filters);
    if (Array.isArray(dataDefault) ? dataDefault.length > 0 : !!dataDefault) {
        return Array.isArray(dataDefault) ? (dataDefault[0] as ListingItem | undefined) : (dataDefault as ListingItem | undefined);
    }

    // Final fallback: no locale constraint
    const queryBase = createQuery(populate);
    const dataBase = await fetchAPI('listings', queryBase, filters);
    return Array.isArray(dataBase) ? (dataBase[0] as ListingItem | undefined) : (dataBase as ListingItem | undefined);
}


// Fetch all listings created by a user, optionally filtered by listingStatus
export async function fetchListingsByUser(documentId: string, status?: string, locale?: string): Promise<ListingItem[]> {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const baseFilters: Record<string, unknown> = {
        filters: {
            user: { documentId: { $eq: documentId } },
        },
        sort: ['updatedAt:desc']
    };
    if (status && status !== 'all') {
        (baseFilters as { filters: Record<string, unknown> }).filters.listingStatus = { $eq: status };
    }

    // Try requested locale first
    if (locale) {
        const queryWithLocale = createQuery(populate, { locale });
        const dataLocale = await fetchAPI('listings', queryWithLocale, baseFilters);
        if (Array.isArray(dataLocale) && dataLocale.length) return dataLocale as ListingItem[];
    }

    // Fallback to default locale
    const queryDefault = createQuery(populate, { locale: DEFAULT_LOCALE });
    const dataDefault = await fetchAPI('listings', queryDefault, baseFilters);
    if (Array.isArray(dataDefault) && dataDefault.length) return dataDefault as ListingItem[];

    // Final fallback: no locale constraint
    const queryBase = createQuery(populate);
    const dataBase = await fetchAPI('listings', queryBase, baseFilters);
    return Array.isArray(dataBase) ? (dataBase as ListingItem[]) : [];
}
