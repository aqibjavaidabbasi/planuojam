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
        },
        page: {
            populate: true
        }
    }
    const query = createQuery(populate);
    const res = await fetchAPI('event-types',query);
    return res;
}

export async function fetchListings(type: 'venue' | 'vendor', appliedFilters={}){
    const populate = {
        images: {
            populate: '*'
        },
        listingItem: {
            populate: '*'
        },
        eventTypes: {
            populate: '*'
        },
        category: {
            populate: '*'
        }
    }
    const filters = {
        filters: {
            type: type,
            ...appliedFilters
        }
    }
    console.log('listing filter object finl: ', filters)
    const query = createQuery(populate);
    const res = await fetchAPI('listings',query,filters);
    return res;
}