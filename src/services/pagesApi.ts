import { PAGES_DYNAMIC_ZONE } from "@/utils/dynamicZoneStructure";
import { fetchAPI, createQuery } from "./api";
import { DEFAULT_LOCALE } from "@/config/i18n";

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
        footerlinkSection: {
            populate: {
                categories: {
                    populate: '*'
                },
                event_types: {
                    populate: '*'
                },
                pages: {
                    populate: '*'
                }
            }
        },
        extraLinks: {
            populate: {
                pages: {
                    populate: '*'
                }
            }
        },
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