import { fetchAPI, createQuery } from "./api";

export async function fetchHomePage() {
    const populate = {
        blocks: {
          populate: {
            // This tells Strapi to populate ALL fields of ALL components in the dynamic zone
            '*': {
              populate: {
                '*': {
                  populate: '*'
                }
              }
            }
          }
        },
        seoSettings: { populate: '*' }
      };
    const filters = { slug: { $eq: "home" } };
    const query = createQuery(populate);
    const res = await fetchAPI("pages", query, filters);
    return res[0];
}

export async function fetchHeader() {
    const populate = { nav: { populate: "*" } };
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