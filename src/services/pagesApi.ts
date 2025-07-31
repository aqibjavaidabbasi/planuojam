import { PAGES_DYNAMIC_ZONE } from "@/utils/dynamicZoneStructure";
import { fetchAPI, createQuery } from "./api";
import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";

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