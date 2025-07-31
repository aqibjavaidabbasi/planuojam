export const LISTING_ITEM_POP_STRUCTURE = {
    images: {
        populate: '*'
    },
    category: {
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
    contact: {
        populate: '*'
    },
    socialLinks: {
        populate: {
            socialLink: {
                populate: '*'
            }
        }
    },
    pricingPackages: {
        populate: {
            plans: {
                populate: {
                    cta: {
                        populate: '*'
                    },
                    featuresList: {
                        populate: '*'
                    }   
                }
            },
            optionalAddons: {
                populate: '*'
            }
        }
    },
    Portfolio: {
        populate: '*'
    },
    FAQs: {
        populate: '*'
    },
    reviews:{
        populate: '*'
    },
    user: {
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