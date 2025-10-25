import { createQuery, deleteAPI, fetchAPIWithToken, postAPIWithToken } from "./api";


export async function createLikedListing(data: { userId: number; listing: string }) {
    const populate = {
        listing: {
            populate: {
                listingItem: {
                    on: {
                        'dynamic-blocks.vendor': {
                            populate: {
                                'serviceArea': {
                                    populate: '*'
                                }
                            }
                        },
                        'dynamic-blocks.venue': {
                            populate: {
                                location: {
                                    populate: '*'
                                }
                            }
                        }
                    }
                },
                portfolio: {
                    populate: '*'
                },
                reviews: {
                    populate: '*'
                },
                eventTypes: {
                    populate: '*'
                },
                category: {
                    populate: '*'
                }
            }
        }
    };

    try {
        const query = createQuery(populate);
        const res = await postAPIWithToken('liked-listings', { data }, {}, query);
        return res;
    } catch (err) {
        console.error("Error creating liked listing:", err);
        throw new Error("Failed to add to wishlist, please try again later!");
    }
}

export async function deleteLikedListing(id: string | number) {
    try {
        const res = await deleteAPI(`liked-listings/${id}`);
        return res;
    } catch (err) {
        console.error("Error deleting liked listing:", err);
        throw new Error("Failed to remove from wishlist, please try again later!");
    }
}

export async function getLikedListings(userId: number, locale?: string) {
    const jwt = localStorage.getItem('token');
    if (!jwt) {
        throw new Error('No authentication token found. Please log in.');
    }

    const populate = {
        listing: {
            populate: {
                category: {
                    populate: '*'
                },
                listingItem: {
                    on: {
                        'dynamic-blocks.vendor': {
                            populate: {
                                'serviceArea': {
                                    populate: '*'
                                }
                            }
                        },
                        'dynamic-blocks.venue': {
                            populate: {
                                location: {
                                    populate: '*'
                                },
                                amneties: {
                                    populate: '*'
                                }
                            }
                        }
                    }
                },
                portfolio: {
                    populate: '*'
                },
                reviews: {
                    populate: '*'
                },
                eventTypes: {
                    populate: '*'
                },
                hotDeal: {
                    populate: {
                        discount: {
                            populate: '*'
                        }
                    }
                }
            }
        }
    };

    const filters = {
        filters: {
            userId: userId
        }
    };

    try {
        if (locale) {
            const query = createQuery(populate, { locale });
            const res = await fetchAPIWithToken('liked-listings', query, filters, jwt);
            return res;
        }

        const query = createQuery(populate);
        const res = await fetchAPIWithToken('liked-listings', query, filters, jwt);
        return res;
    } catch (err) {
        console.error("Error fetching liked listings:", err);
        throw new Error("Failed to load wishlist items. Please try again later!");
    }
}

