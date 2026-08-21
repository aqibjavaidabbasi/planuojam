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
        if (resLocale) return resLocale;
    }

    // Fallback to default locale
    const queryDefault = createQuery(populate, { locale: DEFAULT_LOCALE });
    const resDefault = await fetchAPI(`pages/${docId}`, queryDefault, {});
    return resDefault;
}

export async function fetchHeader(locale?: string) {
    // ponytail: explicit fields, not populate:'*'. On a relation, '*' also pulls its
    // reverse relations (category.listings), which put ~900KB of listing rows in the
    // SSR payload of every page on the site.
    const populate = {
        nav: {
            populate: {
                'categories': {
                    fields: ['name', 'slug', 'locale'],
                    populate: {
                        'localizations': {
                            fields: ['slug', 'locale'],
                        }
                    }
                }
            }
        },
        'eventTypes': {
            populate: {
                'eventType': {
                    fields: ['eventName', 'slug', 'locale'],
                    populate: {
                        'localizations': {
                            fields: ['eventName', 'slug', 'locale'],
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
    // ponytail: same reverse-relation trap as fetchHeader — keep to rendered fields.
    const localizedSlug = { fields: ['slug', 'locale'] };
    const populate = {
        footerlinkSection: {
            populate: {
                categories: {
                    fields: ['name', 'slug', 'locale'],
                    populate: { localizations: localizedSlug }
                },
                event_types: {
                    fields: ['eventName', 'slug', 'locale'],
                    populate: { localizations: localizedSlug }
                },
                pages: {
                    fields: ['title']
                }
            }
        },
        extraLinks: {
            populate: {
                pages: {
                    fields: ['title']
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