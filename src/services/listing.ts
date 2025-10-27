import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";
import { createQuery, deleteAPI, fetchAPI, fetchAPIWithMeta, postAPIWithToken, putAPI } from "./api";
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

// Paginated Hot Deal listings with meta
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
                startDate: { $lte: today },
                lastDate: { $gte: today },
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
        filters: {
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
export async function fetchListingsByUserLeastPopulated(documentId: string, status?: string, locale?: string): Promise<ListingItem[]> {
    const populate = {
        localizations: {
            populate: '*'
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


export async function fetchSortedListings(type: 'venue' | 'vendor', appliedFilters = {}, locale?: string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const baseFilters: Record<string, unknown> = {
        filters: {
            listingStatus: { $eq: "published" },
            type: type,
            ...appliedFilters
        },
    };

    const queryBase = createQuery(populate, { locale });
    const dataBase = await fetchAPI('listings/promoted', queryBase, baseFilters);
    return Array.isArray(dataBase) ? (dataBase as ListingItem[]) : [];
}

export async function fetchSortedListingsWithMeta(
    type: 'venue' | 'vendor',
    appliedFilters: Record<string, unknown> = {},
    locale?: string,
    pagination?: { page?: number; pageSize?: number; start?: number; limit?: number }
) {
    const populate = {
        category: {
            populate: '*'
        },
        listingItem: {
            on: {
                'dynamic-blocks.vendor': {
                    populate: '*'
                },
                'dynamic-blocks.venue': {
                    populate: '*'
                }
            }
        },
        portfolio: {
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
                            populate: '*'
                        },
                        'dynamic-blocks.venue': {
                            populate: '*'
                        }
                    }
                },
                portfolio: {
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
    }
    const baseFilters: Record<string, unknown> = {
        filters: {
            listingStatus: { $eq: "published" },
            type: type,
            ...appliedFilters
        },
    };
    const additional: Record<string, unknown> = { locale };
    if (pagination) additional.pagination = pagination;
    const query = createQuery(populate, additional);
    const res = await fetchAPIWithMeta('listings/promoted', query, baseFilters);
    return res as { data: ListingItem[]; meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } } };
}
