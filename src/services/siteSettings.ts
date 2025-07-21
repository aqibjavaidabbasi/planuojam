import { fetchAPI, createQuery } from "./api";

export async function fetchSiteSettings() {
    const populate = { siteLogo: { populate: "*" } };
    const query = createQuery(populate);
    const res = await fetchAPI("site-setting", query);
    return res;
}