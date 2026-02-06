import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";
import { createQuery, fetchAPI } from "./api";
import { DEFAULT_LOCALE } from "@/config/i18n";

// Generic fetch with locale fallback: try requested locale -> DEFAULT_LOCALE -> base (no locale)
async function fetchWithLocaleFallback(
    resource: string,
    populate: Record<string, unknown>,
    filters?: Record<string, unknown>,
    locale?: string,
    additionalParams?: Record<string, unknown>
) {
    // 1) Try the requested locale
    if (locale) {
        const queryWithLocale = createQuery(populate, { locale, ...additionalParams });
        const resLocale = await fetchAPI(resource, queryWithLocale, filters);
        if (Array.isArray(resLocale) ? resLocale.length : !!resLocale) return resLocale;
    }

    // 2) Fallback to DEFAULT_LOCALE (if different from requested)
    if (!locale || locale !== DEFAULT_LOCALE) {
        const queryDefault = createQuery(populate, { locale: DEFAULT_LOCALE, ...additionalParams });
        const resDefault = await fetchAPI(resource, queryDefault, filters);
        if (Array.isArray(resDefault) ? resDefault.length : !!resDefault) return resDefault;
    }

    // 3) Final fallback: no locale constraint
    const queryBase = createQuery(populate, additionalParams);
    const resBase = await fetchAPI(resource, queryBase, filters);
    return resBase;
}

export async function fetchChildCategories(docId: string, locale?: string, pageSize: number = 100) {
    const filter = {
        filters: {
            parentCategory: {
                documentId: {
                    $eq: docId,
                },
            },
        }
    }

    const populate = {
        parentCategory: {
            populate: '*'
        }
    }
    
    // Add pagination to fetch all child categories (bypass 25-item limit)
    const additionalParams = {
        'pagination[page]': 1,
        'pagination[pageSize]': pageSize, // Configurable limit to get more categories
    }
    
    return await fetchWithLocaleFallback('categories', populate, filter, locale, additionalParams);
}

export async function fetchAllChildCategories(locale?: string, pageSize: number = 200) {
    const filter = {
        filters: {
            parentCategory: {
                $null: false, // Only get categories that have a parent
            },
        }
    }

    const populate = {
        parentCategory: {
            populate: '*'
        }
    }
    
    // Add pagination to fetch all child categories
    const additionalParams = {
        'pagination[page]': 1,
        'pagination[pageSize]': pageSize,
    }
    
    return await fetchWithLocaleFallback('categories', populate, filter, locale, additionalParams);
}
export async function fetchParentCategories(locale?: string) {
    const filter = {
        filters: {
            parentCategory: {
                $null: true,
            }
        }
    }
    const populate = {
        localizations: {
            populate: '*'
        },
    };
    return await fetchWithLocaleFallback('categories', populate, filter, locale);
}
export async function fetchEventTypes(locale?: string) {
    const populate = {
        image: {
            populate: '*'
        },
        page: {
            populate: true
        }
    }
    return await fetchWithLocaleFallback('event-types', populate, undefined, locale);
}

export async function fetchListings(type?: 'venue' | 'vendor', appliedFilters = {}, locale?: string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const filters = {
        filters: {
            // Only add type filter if provided
            ...(type && { type }),
            ...appliedFilters
        }
    }
    const query = createQuery(populate, locale ? { locale } : undefined);
    const res = await fetchAPI('listings/promoted', query, filters);
    return res;
}

export async function fetchCities(locale?: string) {
    const populate = {};
    const additionalParams = {
        'pagination[page]': 1,
        'pagination[pageSize]': 100,
    };
    return await fetchWithLocaleFallback('cities', populate, undefined, locale, additionalParams);
}

export async function fetchStates(locale?: string) {
    const populate = {};
    const additionalParams = {
        'pagination[page]': 1,
        'pagination[pageSize]': 100,
    };
    return await fetchWithLocaleFallback('states', populate, undefined, locale, additionalParams);
}

// Lightweight suggestions for header search dropdown
// - Always query base entries in English (slug source)
// - Populate localizations to display title in the requested display locale
// - Only include listings with listingStatus = 'published'
export async function fetchListingSuggestions(keyword: string, displayLocale?: string, limit: number = 8) {
    const trimmed = (keyword || '').trim();
    if (trimmed.length < 3) return [];

    // Limit fields; query in English
    const additionalParams: Record<string, unknown> = {
        fields: ['title', 'slug', 'listingStatus'],
        'pagination[page]': 1,
        'pagination[pageSize]': Math.max(1, Math.min(limit, 25)),
        sort: ['updatedAt:desc'],
        locale: 'en',
    };
    const populate = {
        localizations: {
            fields: ['title', 'slug', 'locale']
        }
    };

    const query = createQuery(populate, additionalParams);
    const filters = {
        filters: {
            listingStatus: { $eq: 'published' },
            $or: [
                { title: { $containsi: trimmed } },
                { description: { $containsi: trimmed } },
            ],
        },
    };

    const res = await fetchAPI('listings', query, filters);

    const out: Array<{ title: string; slug: string }> = Array.isArray(res)
        ? res.map((item) => {
            const enSlug = item.slug || '';
            let displayTitle = item.title || '';
            const locs = item.localizations?.data || [];
            if (Array.isArray(locs) && displayLocale) {
                const match = locs.find((l) => l?.attributes?.locale === displayLocale);
                if (match?.attributes?.title) displayTitle = match.attributes.title;
            }
            return { title: displayTitle, slug: enSlug };
        })
            .filter((x) => !!x.slug && !!x.title)
        : [];
    return out;
}

export async function fetchHotDealListings(filter = {}) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filters = {
        filters: {
            hotDeal: {
                enableHotDeal: true,
                lastDate: { $gte: today }, // Only show deals that haven't ended
            },
            ...filter,
        }
    }
    const query = createQuery(populate);
    const res = await fetchAPI('listings/promoted', query, filters);
    return res;
}