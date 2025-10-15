import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";
import { createQuery, deleteAPI, fetchAPI, postAPIWithToken, putAPI } from "./api";
import type { ListingItem } from "@/types/pagesTypes";

export async function createListing(data: Record<string, unknown>, locale?: string) {
    const headers = locale ? {
        'X-Strapi-Locale': locale,
        'Content-Language': locale,
        'Accept-Language': locale,
      } : undefined;
    const query = locale ? `locale=${encodeURIComponent(locale)}` : undefined;

    const res = await postAPIWithToken("listings", data, { headers }, query);
    return res;
}

// Promoted-first listings filtered by event type documentId
export async function fetchPromotedListingsPerEvents(eventTypeDocId: string, locale?: string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const baseFilters = {
        filters: {
            eventTypes: {
                documentId: eventTypeDocId
            },
        },
    } as Record<string, unknown>;

    const query = createQuery(populate, locale ? { locale } : undefined);
    const data = await fetchAPI('listings/promoted', query, baseFilters);
    return Array.isArray(data) ? (data as ListingItem[]) : [];
}

// Promoted-first hot deal listings
export async function fetchPromotedHotDealListings(locale?: string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const baseFilters = {
        filters: {
            hotDeal: {
                enableHotDeal: true,
            },
        },
    } as Record<string, unknown>;

    const query = createQuery(populate, locale ? { locale } : undefined);
    const data = await fetchAPI('listings/promoted', query, baseFilters);
    return Array.isArray(data) ? (data as ListingItem[]) : [];
}

export async function updateListing(
    id: string,
    data: Record<string, unknown>,
    locale?: string,
) {
    const headers = locale
        ? {
            'X-Strapi-Locale': locale,
            'Content-Language': locale,
            'Accept-Language': locale,
          }
        : undefined;
    const query = locale ? `locale=${encodeURIComponent(locale)}` : undefined;

    const res = await putAPI(`listings/${id}`, data, { headers }, query);
    return res.data;
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

    // Final fallback: no locale constraint
    const queryBase = createQuery(populate);
    const dataBase = await fetchAPI('listings', queryBase, baseFilters);
    return Array.isArray(dataBase) ? (dataBase as ListingItem[]) : [];
}


export async function fetchSortedListings(type: 'venue' | 'vendor', appliedFilters = {}, locale?: string){
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const baseFilters: Record<string, unknown> = {
        filters: {
            listingStatus: { $eq: "published" },
            type: type,
            ...appliedFilters
        },
    };

    const queryBase = createQuery(populate, {locale});
    const dataBase = await fetchAPI('listings/promoted', queryBase, baseFilters);
    return Array.isArray(dataBase) ? (dataBase as ListingItem[]) : [];
}
