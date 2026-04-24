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
  hotDeal: {
    fields: ['enableHotDeal', 'startDate', 'lastDate'],
  },
  user: {
    fields: ['documentId', 'username'],
  },
};

export const LISTING_DETAIL_POP_STRUCTURE = {
  categories: {
    populate: '*',
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
    populate: '*',
  },
  user: {
    populate: '*',
  },
  eventTypes: {
    populate: '*',
  },
  hotDeal: {
    populate: {
      discount: {
        populate: '*',
      },
    },
  },
  localizations: {
    populate: {
      categories: {
        populate: '*',
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
        populate: '*',
      },
      user: {
        populate: '*',
      },
      eventTypes: {
        populate: '*',
      },
      hotDeal: {
        populate: {
          discount: {
            populate: '*',
          },
        },
      },
    },
  },
};
