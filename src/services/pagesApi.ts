import { PAGES_DYNAMIC_ZONE } from "@/utils/dynamicZoneStructure";
import { fetchAPI, createQuery } from "./api";

export async function fetchHomePage(pageSlug: string) {
    const populate = PAGES_DYNAMIC_ZONE;
    const filters = { slug: { $eq: pageSlug } };
    const query = createQuery(populate);
    const res = await fetchAPI("pages", query, filters);
    return res[0];
}

export async function fetchHeader() {
    const populate = { 
        nav: { 
            populate: "*" 
        } ,
        'eventTypes': {
            populate: {
                'eventType': {
                    populate: true,
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