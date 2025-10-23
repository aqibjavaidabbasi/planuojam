import { createQuery, deleteAPI, fetchAPIWithToken, postAPIWithToken } from "./api";


export async function createLikedListing(data: Record<string, unknown>) {
    //data should have listingId(document id) and userId(document id)
    const populate = {
        listing: {
            populate: '*'
        },
        user: {
            populate: '*'
        }
    }
    try {
        const query = createQuery(populate);
        const res = await postAPIWithToken('liked-listings', data, {}, query);
        return res;
    } catch (err) {
        console.log(err);
        throw new Error("Failed to add to wishlist, please try again later!");
    }
}

export async function deleteLikedListing(id: string) {
    try {
        const res = await deleteAPI(`liked-listings/${id}`);
        return res;
    } catch (err) {
        console.log(err);
        throw new Error("Failed to remove from wishlist, please try again later!");
    }
}

export async function getLikedListings(userId: string, locale: string) {
    const jwt = localStorage.getItem('token');
    if (!jwt) {
        throw new Error('No authentication token found. Please log in.');
    }
    const populate = {
        listing: {
            populate: {
                category: {
                    populate: '*',
                },
                listingItem: {
                    on: {
                        'dynamic-blocks.vendor': {
                            populate: {
                                'serviceArea': {
                                    populate: {
                                        'city': {
                                            populate: true,
                                        },
                                        'state': {
                                            populate: true,
                                        }
                                    }
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
                },
                localizations: {
                    populate: {
                        category: {
                            populate: '*'
                        },
                        listingItem: {
                            on: {
                                'dynamic-blocks.vendor': {
                                    populate: {
                                        'serviceArea': {
                                            populate: {
                                                'city': {
                                                    populate: true,
                                                },
                                                'state': {
                                                    populate: true,
                                                }
                                            }
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
                        },
                    }
                }
            },
        },
        user: {
            populate: '*'
        }
    }
    const filters = {
        filters: {
            user: {
                documentId: userId
            }
        }
    }
    if (locale) {
        const query = createQuery(populate, { locale });
        const res = await fetchAPIWithToken('liked-listings', query, filters, jwt);
        return res;
    }

    const query = createQuery(populate);
    const res = await fetchAPIWithToken('liked-listings', query, filters, jwt);
    return res;
}

