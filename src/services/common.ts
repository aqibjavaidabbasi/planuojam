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
export async function fetchParentCategories() {
    const filter = {
        filters: {
            parentCategory: {
                $null: true,
            }
        }
    }
    const populate = {}
    const query = createQuery(populate);
    const res = await fetchAPI(`categories`, query, filter);
    return res;
}
export async function fetchEventTypes() {
    const populate = {
        image: {
            populate: '*'
        },
        page: {
            populate: true
        }
    }
    const query = createQuery(populate);
    const res = await fetchAPI('event-types', query);
    return res;
}

export async function fetchListings(type: 'venue' | 'vendor', appliedFilters = {}) {
    const populate = {
        images: {
            populate: '*'
        },
        listingItem: {
            on: {
                'dynamic-blocks.vendor': {
                    populate: {
                        'serviceArea': {
                            populate: {
                                'countries': {
                                    populate: true,
                                },
                                'cities': {
                                    populate: true,
                                },
                                'states': {
                                    populate: true,
                                }
                            }
                        }
                    }
                },
                'dynamic-blocks.venue': {
                    populate: '*'
                }
            }
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
    const query = createQuery(populate);
    const res = await fetchAPI('listings', query, filters);
    return res;
}

export async function fetchListingsPerEvents(passedEvent: string) {
    const populate = {
        eventTypes: {
            populate: '*'
        },
        category: {
            populate: '*'
        }
    }
    const filters = {
        filters: {
            eventTypes: {
                eventName: passedEvent
            }
        }
    }
    const query = createQuery(populate)
    const res = await fetchAPI('listings', query, filters);
    return res;
}

export async function fetchHotDealListings(filter = {}) {
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
            hotDeal: {
                enableHotDeal: true,
            },
            ...filter,
        }
    }
    const query = createQuery(populate);
    const res = await fetchAPI('listings', query, filters);
    return res;
}