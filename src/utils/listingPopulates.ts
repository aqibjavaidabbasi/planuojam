const LISTING_CARD_VENDOR_POPULATE = {
  serviceArea: {
    populate: {
      city: {
        fields: ['name'],
      },
      state: {
        fields: ['name'],
      },
    },
  },
};

const LISTING_CARD_VENUE_POPULATE = {
  location: {
    fields: ['address'],
  },
};

const LISTING_CARD_MAP_VENUE_POPULATE = {
  location: {
    fields: ['address', 'latitude', 'longitude'],
  },
};

const LISTING_CARD_SOCIAL_LINKS_POPULATE = {
  fields: ['optionalSectionTitle'],
  populate: {
    socialLink: {
      fields: ['platform', 'link', 'visible'],
    },
  },
};

const LISTING_MAP_VENDOR_POPULATE = {
  serviceArea: {
    fields: ['latitude', 'longitude'],
    populate: {
      city: {
        fields: ['name'],
      },
      state: {
        fields: ['name'],
      },
    },
  },
};

const LISTING_MAP_VENUE_POPULATE = {
  fields: ['capacity'],
  populate: LISTING_CARD_MAP_VENUE_POPULATE,
};

const LISTING_CARD_SHARED_POPULATE = {
  listingItem: {
    on: {
      'dynamic-blocks.vendor': {
        populate: LISTING_CARD_VENDOR_POPULATE,
      },
      'dynamic-blocks.venue': {
        populate: LISTING_CARD_VENUE_POPULATE,
      },
    },
  },
  portfolio: {
    fields: ['url', 'mime'],
  },
  videos: {
    fields: ['url'],
  },
  socialLinks: LISTING_CARD_SOCIAL_LINKS_POPULATE,
  hotDeal: {
    fields: ['enableHotDeal', 'startDate', 'lastDate'],
  },
};

export const LISTING_CARD_POP_STRUCTURE = {
  categories: {
    fields: ['name'],
  },
  ...LISTING_CARD_SHARED_POPULATE,
  user: {
    fields: ['documentId'],
  },
};

export const LISTING_CARD_MAP_POP_STRUCTURE = {
  categories: {
    fields: ['name'],
    populate: {
      image: {
        fields: ['url', 'mime'],
      },
    },
  },
  listingItem: {
    on: {
      'dynamic-blocks.vendor': {
        populate: LISTING_CARD_VENDOR_POPULATE,
      },
      'dynamic-blocks.venue': {
        populate: LISTING_CARD_MAP_VENUE_POPULATE,
      },
    },
  },
  portfolio: {
    fields: ['url', 'mime'],
  },
  videos: {
    fields: ['url'],
  },
  socialLinks: LISTING_CARD_SOCIAL_LINKS_POPULATE,
  hotDeal: {
    fields: ['enableHotDeal', 'startDate', 'lastDate'],
  },
  user: {
    fields: ['documentId', 'username'],
  },
};

export const LISTING_MAP_LOCATION_POP_STRUCTURE = {
  categories: {
    fields: ['name'],
    populate: {
      image: {
        fields: ['url', 'mime'],
      },
    },
  },
  listingItem: {
    on: {
      'dynamic-blocks.vendor': {
        populate: LISTING_MAP_VENDOR_POPULATE,
      },
      'dynamic-blocks.venue': LISTING_MAP_VENUE_POPULATE,
    },
  },
  portfolio: {
    fields: ['url', 'mime'],
  },
  videos: {
    fields: ['url'],
  },
  socialLinks: LISTING_CARD_SOCIAL_LINKS_POPULATE,
  hotDeal: {
    fields: ['enableHotDeal', 'startDate', 'lastDate'],
  },
  user: {
    fields: ['username'],
  },
};

// ponytail: relations here are pinned to explicit `fields`. `populate: '*'` on a
// relation also pulls its reverse relations (category.listings, user.listings),
// which dragged ~1500 listing rows x 5 locales into the SSR payload (5.8MB HTML).
export const LISTING_DETAIL_POP_STRUCTURE = {
  categories: {
    fields: ['name', 'slug', 'serviceType', 'locale'],
  },
  listingItem: {
    on: {
      'dynamic-blocks.vendor': {
        populate: {
          serviceArea: {
            populate: {
              city: {
                populate: true,
              },
              state: {
                populate: true,
              },
            },
          },
        },
      },
      'dynamic-blocks.venue': {
        populate: {
          location: {
            populate: '*',
          },
          amneties: {
            populate: '*',
          },
        },
      },
    },
  },
  contact: {
    populate: '*',
  },
  socialLinks: {
    populate: {
      socialLink: {
        populate: '*',
      },
    },
  },
  workingSchedule: {
    populate: '*',
  },
  pricingPackages: {
    populate: {
      plans: {
        populate: {
          cta: {
            populate: '*',
          },
          featuresList: {
            populate: '*',
          },
          optionalAddons: {
            populate: '*',
          },
        },
      },
    },
  },
  portfolio: {
    populate: '*',
  },
  videos: {
    populate: '*',
  },
  FAQs: {
    populate: '*',
  },
  reviews: {
    populate: {
      author: {
        fields: ['username'],
      },
      review: {
        populate: '*',
      },
    },
  },
  user: {
    fields: ['username'],
  },
  eventTypes: {
    fields: ['eventName', 'slug', 'locale'],
  },
  hotDeal: {
    populate: {
      discount: {
        populate: '*',
      },
    },
  },
  // Only booking lists read this (localized listing title); no consumer needs the
  // full localized listing, so keep it to the fields actually rendered.
  localizations: {
    fields: ['title', 'slug', 'locale'],
  },
};
