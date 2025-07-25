import { createQuery, fetchAPI } from "./api";

export async function fetchChildCategories(slug: string) {
    const filter = {
        filters: {
            parentCategory: {
                slug: {
                    $eq: slug,
                },
            },
        }
    }

    const populate = {
        parentCategory: {
            populate: '*'
        }
    }
    const query = createQuery(populate);
    const res = await fetchAPI(`categories`, query, filter);
    return res;
}
export async function fetchEventTypes(){
    const populate = {
        image: {
            populate: '*'
        }
    }
    const query = createQuery(populate);
    const res = await fetchAPI('event-types',query);
    return res;
}