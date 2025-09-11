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

export async function fetchListingBySlug(slug: string, locale?: string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const filters = {
        filters : {
            slug: { $eq: slug }
        }
    }
    // Try requested locale first
    if (locale) {
        const queryWithLocale = createQuery(populate, { locale });
        const dataLocale = await fetchAPI(`listings`, queryWithLocale, filters);
        return dataLocale[0]
    }

    // Final fallback: no locale constraint
    const queryBase = createQuery(populate);
    const dataBase = await fetchAPI(`listings`, queryBase, filters);
    return dataBase[0]
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
