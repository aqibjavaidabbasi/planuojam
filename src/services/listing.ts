import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";
import { createQuery, deleteAPI, fetchAPI, fetchAPIWithMeta, postAPIWithToken, putAPI, API_URL } from "./api";
import { fetchTagsByIds } from "./tags";
import type { ListingItem } from "@/types/pagesTypes";
import QueryString from "qs";

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

// Generic promoted listings with meta (no special extra filters applied)
export async function fetchPromotedListingsWithMeta(
    locale?: string,
    pagination?: { page?: number; pageSize?: number },
    extraFilters: Record<string, unknown> = {}
) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const baseFilters: Record<string, unknown> = {
        filters: {
            ...extraFilters,
        },
    };
    const additional: Record<string, unknown> = {};
    if (locale) additional.locale = locale;
    if (pagination) additional.pagination = pagination;
    const query = createQuery(populate, additional);
    const res = await fetchAPIWithMeta('listings/promoted', query, baseFilters);
    return res as { data: ListingItem[]; meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } } };
}

// Paginated promoted listings filtered by event type with meta
export async function fetchPromotedListingsPerEventsWithMeta(
    eventTypeDocId: string,
    locale?: string,
    pagination?: { page?: number; pageSize?: number },
    extraFilters: Record<string, unknown> = {}
) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const baseFilters: Record<string, unknown> = {
        filters: {
            eventTypes: { documentId: eventTypeDocId },
            ...extraFilters,
        },
    };
    const additional: Record<string, unknown> = {};
    if (locale) additional.locale = locale;
    if (pagination) additional.pagination = pagination;
    const query = createQuery(populate, additional);
    const res = await fetchAPIWithMeta('listings/promoted', query, baseFilters);
    return res as { data: ListingItem[]; meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } } };
}

// Paginated Hot Deal listings with meta (includes upcoming and active deals)
export async function fetchPromotedHotDealsWithMeta(
    locale?: string,
    pagination?: { page?: number; pageSize?: number },
    extraFilters: Record<string, unknown> = {}
) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const baseFilters: Record<string, unknown> = {
        filters: {
            hotDeal: {
                enableHotDeal: true,
                lastDate: { $gte: today }, // Only show deals that haven't ended
            },
            ...extraFilters,
        },
    };
    const additional: Record<string, unknown> = {};
    if (locale) additional.locale = locale;
    if (pagination) additional.pagination = pagination;
    const query = createQuery(populate, additional);
    const res = await fetchAPIWithMeta('listings/promoted', query, baseFilters);
    return res as { data: ListingItem[]; meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } } };
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

export async function updateListing(
    listingdocId: string,
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
    const res = await putAPI(`listings/${listingdocId}`, data, { headers }, query);
    return res.data;
}

export async function deleteListing(id: string) {
    const res = await deleteAPI(`listings/${id}`);
    return res;
}

export async function fetchListingBySlug(slug: string, locale?: string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const filters = {
        filters: {
            slug: { $eq: slug }
        }
    }
    // Try requested locale first
    if (locale) {
        const queryWithLocale = createQuery(populate, { locale });
        const dataLocale = await fetchAPI(`listings`, queryWithLocale, filters);
        const listing = dataLocale[0];
        
        // Populate tags if they exist
        if (listing?.tagDocumentIds?.length) {
            listing.tags = await fetchTagsByIds(listing.tagDocumentIds as string[]);
        }
        

        return listing;
    }

    // Final fallback: no locale constraint
    const queryBase = createQuery(populate);
    const dataBase = await fetchAPI(`listings`, queryBase, filters);
    const listing = dataBase[0];
    
    // Populate tags if they exist
    if (listing?.tags?.length) {
        listing.tags = await fetchTagsByIds(listing.tags as string[]);
    }
    
    return listing;
}


// Fetch all listings created by a user, optionally filtered by listingStatus
export async function fetchListingsByUser(documentId: string, status?: string, locale?: string) {
    const populate = {
        category: {
            populate: '*',
        },
        listingItem: {
            on: {
                'dynamic-blocks.vendor': {
                    populate: {
                        'serviceArea': {
                            populate: {
                                'city': {
                                    populate: true,
                                },
                                'state': {
                                    populate: true,
                                }
                            }
                        }
                    }
                },
                'dynamic-blocks.venue': {
                    populate: {
                        location: {
                            populate: '*'
                        },
                        amneties: {
                            populate: '*'
                        }
                    }
                }
            }
        },
        portfolio: {
            populate: '*'
        },
        videos: {
            populate: '*'
        },
        reviews: {
            populate: '*'
        },
        user: {
            populate: '*'
        },
        eventTypes: {
            populate: '*'
        },
        hotDeal: {
            populate: {
                discount: {
                    populate: '*'
                }
            }
        },
        localizations: {
            populate: {
                category: {
                    populate: '*'
                },
                listingItem: {
                    on: {
                        'dynamic-blocks.vendor': {
                            populate: {
                                'serviceArea': {
                                    populate: {
                                        'city': {
                                            populate: true,
                                        },
                                        'state': {
                                            populate: true,
                                        }
                                    }
                                }
                            }
                        },
                        'dynamic-blocks.venue': {
                            populate: {
                                location: {
                                    populate: '*'
                                },
                                amneties: {
                                    populate: '*'
                                }
                            }
                        }
                    }
                },
                portfolio: {
                    populate: '*'
                },
                FAQs: {
                    populate: '*'
                },
                reviews: {
                    populate: '*'
                },
                user: {
                    populate: '*'
                },
                eventTypes: {
                    populate: '*'
                },
                hotDeal: {
                    populate: {
                        discount: {
                            populate: '*'
                        }
                    }
                },
            }
        }
    };
    const baseFilters: Record<string, unknown> = {
        filters: {
            user: { documentId: { $eq: documentId } },
        },
        sort: ['updatedAt:desc']
    };
    if (status && status !== 'all') {
        (baseFilters as { filters: Record<string, unknown> }).filters.listingStatus = { $eq: status };
    }

    const queryWithLocale = createQuery(populate, { locale });
    try {
        const dataLocale = await fetchAPI('listings', queryWithLocale, baseFilters);
        
        // Ensure we always return an array
        if (!dataLocale) {
            return [];
        }
        
        if (Array.isArray(dataLocale)) {
            return dataLocale as ListingItem[];
        }
        
        // If response has data property, use that
        if (dataLocale.data && Array.isArray(dataLocale.data)) {
            return dataLocale.data as ListingItem[];
        }
        
        return [];
    } catch (error) {
        console.error('Error in fetchListingsByUser:', error);
        // Re-throw the error to be handled by the caller
        throw error;
    }
}
export async function fetchListingsByUserLeastPopulated(documentId: string, status?: string, locale?: string): Promise<ListingItem[]> {
    const populate = {};
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

export async function fetchListingsByDocumentIds(documentIds: string[], locale?: string): Promise<ListingItem[]> {
    if (!documentIds.length) return [];

    const populate = LISTING_ITEM_POP_STRUCTURE;
    const filters = {
        filters: {
            documentId: { $in: documentIds }
        }
    };

    // Helper function to add timeout to fetch operations
    const fetchWithTimeout = async (query: string, signal?: AbortSignal) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        // Use provided signal or create new one
        const activeSignal = signal || controller.signal;

        try {
            const url = `${API_URL}/api/listings?${query}&${QueryString.stringify(filters, { encodeValuesOnly: true })}`;
            const response = await fetch(url, {
                signal: activeSignal,
                next: { revalidate: 3600 }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.data || data;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            throw error;
        }
    };

    // Try requested locale first
    if (locale) {
        try {
            const queryWithLocale = createQuery(populate, { locale });
            const dataLocale = await fetchWithTimeout(queryWithLocale, undefined);
            if (Array.isArray(dataLocale) && dataLocale.length) return dataLocale as ListingItem[];
        } catch (error) {
            console.warn('Locale-specific fetch failed, falling back to default:', error);
        }
    }

    // Final fallback: no locale constraint
    const queryBase = createQuery(populate);
    const dataBase = await fetchWithTimeout(queryBase, undefined);
    return Array.isArray(dataBase) ? (dataBase as ListingItem[]) : [];
}

// Fetch sorted listings by service type with meta information
export async function fetchSortedListingsWithMeta(
    serviceType?: 'vendor' | 'venue',
    appliedFilters: Record<string, unknown> = {},
    locale?: string,
    pagination?: { page: number; pageSize: number }
) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const baseFilters: Record<string, unknown> = {
        filters: {
            // Only add type filter if serviceType is provided
            ...(serviceType && { type: { $eq: serviceType } }),
            ...appliedFilters,
        },
    };

    const additional: Record<string, unknown> = {
        sort: ['createdAt:desc']
    };

    if (locale) additional.locale = locale;
    if (pagination) additional.pagination = pagination;

    const query = createQuery(populate, additional);
    const res = await fetchAPIWithMeta('listings/promoted', query, baseFilters);
    return res as { data: ListingItem[]; meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } } };
}
