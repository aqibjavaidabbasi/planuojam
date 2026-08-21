import { LISTING_CARD_POP_STRUCTURE } from './listingPopulates';

export const PAGES_DYNAMIC_ZONE = {
    blocks: {
        on: {
            'dynamic-blocks.hero-banner': {
                populate: {
                    'heroImage': true,
                    'callToAction': {
                        populate: '*'
                    },
                    'heading': {
                        populate: {
                            'headingPiece': {
                                populate: '*'
                            }
                        }
                    }
                }
            },
            'general.location': {
                populate: '*'
            },
            'dynamic-blocks.video-embed': {
                populate: '*'
            },
            'dynamic-blocks.text-image-block': {
                populate: {
                    'image': true,
                    'cta': {
                        populate: '*'
                    }
                }
            },
            'dynamic-blocks.testimonials': {
                populate: {
                    'items': {
                        populate: '*'
                    }
                }
            },
            'dynamic-blocks.pricing-table': {
                populate: {
                    'plans': {
                        populate: {
                            'cta': {
                                populate: '*'
                            },
                            'featuresList': {
                                populate: '*'
                            },
                            'optionalAddons': {
                                populate: '*'
                            }
                        }
                    }
                }
            },
            'dynamic-blocks.html-block': {
                populate: '*'
            },
            'dynamic-blocks.faqs': {
                populate: {
                    'items': {
                        populate: '*'
                    }
                }
            },
            'dynamic-blocks.call-to-action': {
                populate: '*'
            },
            'dynamic-blocks.image-blocks-group': {
                populate: {
                    'imageBlocks': {
                        populate: {
                            'image': true,
                            'cta': {
                                populate: '*'
                            }
                        }
                    },
                    'title': {
                        populate: {
                            'heading': {
                                populate: {
                                    'headingPiece': {
                                        populate: '*'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            'general.city-list': {
                populate: {
                    'Cities': {
                        populate: {
                            'city': {
                                populate: {
                                    localizations: true
                                },
                            }
                        }
                    }
                }
            },
            'typography.heading': {
                populate: '*'
            },
            'dynamic-blocks.image-block': {
                populate: {
                    'backgroundImage': true,
                    'optionalButton': {
                        populate: '*'
                    }
                }
            },
            'dynamic-blocks.block-groups': {
                populate: {
                    'block': {
                        populate: {
                            'backgroundImage': true,
                            'optionalButton': {
                                populate: '*'
                            }
                        }
                    },
                    'title': {
                        populate: {
                            'heading': {
                                populate: {
                                    'headingPiece': {
                                        populate: '*'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            'general.title-description': {
                populate: {
                    'heading': {
                        populate: {
                            'headingPiece': {
                                populate: '*'
                            }
                        }
                    }
                }
            },
            'general.social-links-component': {
                populate: {
                    'socialLink': {
                        populate: true,
                    }
                }
            },
            'general.top-listing-items': {
                populate: {
                    'sectionheader': {
                        populate: {
                            'heading': {
                                populate: {
                                    'headingPiece': {
                                        populate: '*'
                                    }
                                }
                            }
                        }
                    },
                    'topListings': {
                        populate: {
                            'listings': {
                                populate: LISTING_CARD_POP_STRUCTURE
                            }
                        }
                    }
                }
            },
            'dynamic-blocks.category-list': {
                populate: {
                    'categoryListItem': {
                        populate: {
                            // ponytail: fields-only. `populate: '*'` on a category relation also
                            // pulls category.listings (every listing in it) into the payload.
                            'category': {
                                fields: ['name'],
                                populate: {
                                    'image': { fields: ['url'] },
                                    // localizations carry the EN slug, which is what
                                    // /service/[service] resolves against.
                                    'parentCategory': {
                                        fields: ['slug', 'locale'],
                                        populate: { 'localizations': { fields: ['slug', 'locale'] } },
                                    },
                                },
                            }
                        }
                    },
                    'sectionTitle': {
                        populate: {
                            'heading': {
                                populate: {
                                    'headingPiece': {
                                        populate: '*'
                                    }
                                }
                            }
                        }
                    },
                    'parentCategory': {
                        populate: {
                            // Only the documentId is read (locale-invariant parent match).
                            'parent': {
                                fields: ['slug']
                            }
                        }
                    }
                }
            },
            'dynamic-blocks.event-types-list': {
                populate: {
                    'sectionheader': {
                        populate: {
                            'heading': {
                                populate: {
                                    'headingPiece': {
                                        populate: '*'
                                    }
                                }
                            }
                        }
                    },
                    'eventTypeItem': {
                        populate: {
                            // ponytail: fields-only, same reverse-relation trap (eventType.listings).
                            'eventType': {
                                fields: ['eventName', 'locale'],
                                populate: {
                                    'image': { fields: ['url'] },
                                    'localizations': { fields: ['eventName', 'locale'] },
                                },
                            }
                        }
                    }
                }
            },
            'dynamic-blocks.rich-text-area': {
                populate: '*'
            }
        }
    },
    seoSettings: { populate: '*' },
};
