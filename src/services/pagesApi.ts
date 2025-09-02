import { PAGES_DYNAMIC_ZONE } from "@/utils/dynamicZoneStructure";
import { fetchAPI, createQuery } from "./api";
import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";
import { DEFAULT_LOCALE } from "@/config/i18n";

export async function fetchPage(pageSlug: string) {
    const populate = PAGES_DYNAMIC_ZONE;
    const filters = {
        filters: {
            slug: { $eq: pageSlug }
        }
    };
    const query = createQuery(populate);
    const res = await fetchAPI("pages", query, filters);
    return res[0];
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

    console.log("locale", locale)
    // Try requested locale first (if provided)
    if (locale) {
        const queryWithLocale = createQuery(populate, { locale });
        const resLocale = await fetchAPI("pages", queryWithLocale, filters);

        console.log("resLocale", resLocale);
        if (resLocale && resLocale[0]) return resLocale[0];
    }

    // Fallback to default locale
    const queryDefault = createQuery(populate, { locale: DEFAULT_LOCALE });
    const resDefault = await fetchAPI("pages", queryDefault, filters);
    return resDefault?.[0];
}

export async function fetchHeader() {
    const populate = {
        nav: {
            populate: "*"
        },
        'eventTypes': {
            populate: {
                'eventType': {
                    populate: {
                        'page': true,
                    },
                }
            }
        }
    };
    const query = createQuery(populate);
    const res = await fetchAPI("header", query);
    return res;
}

export async function fetchFooter() {
    const populate = {
        footerlinkSection: { populate: "*" },
        extraLinks: { populate: "*" }
    };
    const query = createQuery(populate);
    const res = await fetchAPI("footer", query);
    return res;
} 
export async function fetchListingItemPerSlug(slug: string) {
    const populate = LISTING_ITEM_POP_STRUCTURE;
    const filters = {
        filters: {
            slug: { $eq: slug }
        }
    };
    const query = createQuery(populate);
    const res = await fetchAPI("listings", query, filters);
    return res[0];
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