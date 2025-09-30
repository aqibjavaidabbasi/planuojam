import { fetchAPI, createQuery } from "./api";

export async function fetchSiteSettings() {
    const populate = { 
        siteLogo: { 
            populate: "*" 
        },
        currency: {
            populate: '*'
        },
        fallbackSeo: {
            populate: {
                seo: {
                    populate: '*'
                }
            }
        }
    };
    const query = createQuery(populate);
    const res = await fetchAPI("site-setting", query);
    return res;
}