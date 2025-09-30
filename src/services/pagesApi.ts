import { PAGES_DYNAMIC_ZONE } from "@/utils/dynamicZoneStructure";
import { fetchAPI, createQuery } from "./api";
import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";
import { DEFAULT_LOCALE } from "@/config/i18n";

export async function fetchPage(pageSlug: string, locale?: string) {
    // Delegate to the locale-aware implementation for consistency
    return fetchPageLocalized(pageSlug, locale);
}



/**
 * Locale-aware page fetch with fallback to DEFAULT_LOCALE if missing.
 */
export async function fetchPageById(docId: string, locale?: string) {
    const populate = PAGES_DYNAMIC_ZONE;
    // Try requested locale first (if provided)
    if (locale) {
        const queryWithLocale = createQuery(populate, { locale });
        const resLocale = await fetchAPI(`pages/${docId}`, queryWithLocale, {});
        return resLocale;
    }

    // Fallback to default locale
    const queryDefault = createQuery(populate, { locale: DEFAULT_LOCALE });
    const resDefault = await fetchAPI(`pages/${docId}`, queryDefault, {});
    return resDefault;
}
/**
 * Locale-aware page fetch with fallback to DEFAULT_LOCALE if missing.
 */
export async function fetchPageLocalized(pageSlug: string, locale?: string) {
    const populate = PAGES_DYNAMIC_ZONE;

    const filters = {
        filters: {
            slug: { $eq: pageSlug }
        }
    } as const;
    // Try requested locale first (if provided)
    if (locale) {
        const queryWithLocale = createQuery(populate, { locale });
        const resLocale = await fetchAPI("pages", queryWithLocale, filters);
        if (resLocale && resLocale[0]) return resLocale[0];
    }

    // Fallback to default locale
    const queryDefault = createQuery(populate, { locale: DEFAULT_LOCALE });
    const resDefault = await fetchAPI("pages", queryDefault, filters);
    return resDefault?.[0];
}

export async function fetchHeader(locale?: string) {
    const populate = {
        nav: {
            populate: {
                'categories': {
                    populate: '*'
                }
            }
        },
        'eventTypes': {
            populate: {
                'eventType': {
                    populate: {
                        'page': {
                                populate: '*'
                        },
                        'localizations': {
                            populate: '*'
                        }
                    },
                }
            }
        }
    };
    // Try requested locale first if provided, then fallback to default locale
    if (locale) {
        const queryWithLocale = createQuery(populate, { locale });
        const resLocale = await fetchAPI("header", queryWithLocale);
        if (resLocale) return resLocale;
    }

    const queryDefault = createQuery(populate, { locale: DEFAULT_LOCALE });
    const resDefault = await fetchAPI("header", queryDefault);
    return resDefault;
}

export async function fetchFooter(locale?: string) {
    const populate = {
        footerlinkSection: { populate: "*" },
        extraLinks: { populate: "*" }
    };
    if (locale) {
        const queryWithLocale = createQuery(populate, { locale });
        const resLocale = await fetchAPI("footer", queryWithLocale);
        if (resLocale) return resLocale;
    }

    const queryDefault = createQuery(populate, { locale: DEFAULT_LOCALE });
    const resDefault = await fetchAPI("footer", queryDefault);
    return resDefault;
} 
export async function fetchListingItemPerSlug(slug: string, locale?: string) {
    // Delegate to the locale-aware implementation for consistency
    return fetchListingItemPerSlugLocalized(slug, locale);
}

/**
 * Locale-aware listing fetch with fallback to DEFAULT_LOCALE if missing.
 */
export async function fetchListingItemPerSlugLocalized(slug: string, locale?: string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const filters = {
        filters: {
            slug: { $eq: slug }
        }
    } as const;

    if (locale) {
        const queryWithLocale = createQuery(populate, { locale });
        const resLocale = await fetchAPI("listings", queryWithLocale, filters);
        if (resLocale && resLocale[0]) return resLocale[0];
    }

    const queryDefault = createQuery(populate, { locale: DEFAULT_LOCALE });
    const resDefault = await fetchAPI("listings", queryDefault, filters);
    return resDefault?.[0];
}