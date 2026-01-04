export const LISTING_ITEM_POP_STRUCTURE = {
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
    workingSchedule: {
        populate: '*'
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
    portfolio: {
        populate: '*'
    },
    videos: {
        populate: '*'
    },
    FAQs: {
        populate: '*'
    },
    reviews: {
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
            workingSchedule: {
                populate: '*'
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
            portfolio: {
                populate: '*'
            },
            videos: {
                populate: '*'
            },
            FAQs: {
                populate: '*'
            },
            reviews: {
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
            },
        }
    }
}   