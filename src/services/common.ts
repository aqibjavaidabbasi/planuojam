import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";
import { createQuery, fetchAPI } from "./api";
import { DEFAULT_LOCALE } from "@/config/i18n";
import { ListingItem } from "@/types/pagesTypes";

// Generic fetch with locale fallback: try requested locale -> DEFAULT_LOCALE -> base (no locale)
async function fetchWithLocaleFallback(
    resource: string,
    populate: Record<string, unknown>,
    filters?: Record<string, unknown>,
    locale?: string
) {
    // 1) Try the requested locale
    if (locale) {
        const queryWithLocale = createQuery(populate, { locale });
        const resLocale = await fetchAPI(resource, queryWithLocale, filters);
        if (Array.isArray(resLocale) ? resLocale.length : !!resLocale) return resLocale;
    }

    // 2) Fallback to DEFAULT_LOCALE (if different from requested)
    if (!locale || locale !== DEFAULT_LOCALE) {
        const queryDefault = createQuery(populate, { locale: DEFAULT_LOCALE });
        const resDefault = await fetchAPI(resource, queryDefault, filters);
        if (Array.isArray(resDefault) ? resDefault.length : !!resDefault) return resDefault;
    }

    // 3) Final fallback: no locale constraint
    const queryBase = createQuery(populate);
    const resBase = await fetchAPI(resource, queryBase, filters);
    return resBase;
}

// Fetch listings by parent category slug (localized). Uses populate like other listings.
export async function fetchListingsByParentSlug(
  parentSlug: string,
  appliedFilters: Record<string, unknown> = {},
  locale?: string
) {
  const populate = LISTING_ITEM_POP_STRUCTURE;
  const filters = {
    filters: {
      category: {
        parentCategory: {
          slug: { $eq: parentSlug },
        },
      },
      ...appliedFilters,
    },
  };
  console.log(filters)
  const query = createQuery(populate, locale ? { locale } : undefined);
  const res = await fetchAPI('listings', query, filters);
  return res;
}


export async function fetchChildCategories(docId: string, locale?: string) {
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
    return await fetchWithLocaleFallback('categories', populate, filter, locale);
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
        },
        localizations: {
            populate: '*'
        }
    }
    return await fetchWithLocaleFallback('event-types', populate, undefined, locale);
}

export async function fetchListings(type: 'venue' | 'vendor', appliedFilters = {}, locale?: string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const filters = {
        filters: {
            type: type,
            ...appliedFilters
        }
    }
    const query = createQuery(populate, locale ? { locale } : undefined);
    const res = await fetchAPI('listings', query, filters);
    return res;
}

export async function fetchCities(locale?: string) {
    const populate = { populate: '*' };
    return await fetchWithLocaleFallback('cities', populate, undefined, locale);
}

export async function fetchStates(locale?: string) {
    const populate = { populate: '*' };
    return await fetchWithLocaleFallback('states', populate, undefined, locale);
}
// Fetch listing by Events with necessary relations populated
export async function fetchListingsPerEvents(docId: string,locale?:string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const filters = {
        filters: {
            eventTypes: {
                documentId:  docId
            }
        }
    }
    if(locale){
        const queryWithLocal= createQuery(populate,{locale});
        const dataLocal= await fetchAPI('listings',queryWithLocal,filters);


    if (Array.isArray(dataLocal) && dataLocal.length > 0) {
      return dataLocal as ListingItem[];
    }
  }

    const query = createQuery(populate)
    const res = await fetchAPI('listings', query, filters);
    return res;
}

export async function fetchHotDealListings(filter = {}) {
    const populate = {
        listingItem: {
            populate: '*'
        },
        eventTypes: {
            populate: '*'
        },
        category: {
            populate: '*'
        },
        hotDeal: {
            populate: '*'
        },
        portfolio: {
            populate: '*'
        }
    }
    const filters = {
        filters: {
            hotDeal: {
                enableHotDeal: true,
            },
            ...filter,
        }
    }
    const query = createQuery(populate);
    const res = await fetchAPI('listings', query, filters);
    return res;
}