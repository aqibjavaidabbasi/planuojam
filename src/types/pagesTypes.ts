import { strapiImage } from "./common";

export interface homePage {
  id: number;
  title: string;
  description: string;
  slug: string;
  locale: string;
  blocks: DynamicBlocks[];
}
export interface header {
  id: number;
  locale: string;
  nav: {
    id: number;
    item: navObj[]
  };
  eventTypes: {
    id: number;
    eventType: eventType;
  }[]
}

export interface eventType {
  documentId: string;
  id: number;
  locale: string;
  eventName: string;
  slug: string;
  page: {
    slug: string;
  }
}


export interface footer {
  id: number;
  copyRightText: string;
  extraLinks: navObj[];
  footerlinkSection: {
    id: number;
    title: string;
    navItem: navObj[]
  }[]
}
export interface navObj {
  id: number;
  label: string;
  relativeUrl: string;
  target: string;
}


//home page blocks
export type DynamicBlocks =
  | HeroBannerBlock
  | ImageBlocksGroupBlock
  | BlockGroupsBlock
  | TitleDescriptionBlock
  | CityListBlock
  | SocialLinksComponentBlock
  | LocationComponentBlock
  | VideoEmbedComponentBlock
  | CardComponentBlock
  | testimonialsComponentBlock
  | PricingTableComponentBlock
  | HTMLBlockComponentBlock
  | FAQComponentBlock
  | CallToActionComponentBlock
  | HeadingTypographyBlock
  | ImageBlockBackgroundBlock
  | topListingItemsBlock
  | SelectedCategoriesList
  | EventTypesBlock;

export interface HeroBannerBlock {
  __component: 'dynamic-blocks.hero-banner';
  id: number;
  title: string;
  subTitle: string;
  heroImage: strapiImage;
  callToAction: CallToActionComponentBlock;
  heading: {
    id: number;
    headingPiece: headingPiece[]
  };
}

export interface ImageBlocksGroupBlock {
  __component: 'dynamic-blocks.image-blocks-group';
  id: number;
  imageBlocks: {
    backgroundColor: string;
    blockContent: string;
    heading: string;
    id: number;
    imagePositon: string;
    url: string;
    image: strapiImage;
  }[];
  title: TitleDescriptionBlock
}

// Block Groups
export interface BlockGroupsBlock {
  __component: 'dynamic-blocks.block-groups';
  id: number;
  block: {
    id: number;
    blockTitle: string;
    contentPlacement: string;
    optionalButton: CallToActionComponentBlock;
    backgroundImage: strapiImage;
  }[];
  title: TitleDescriptionBlock
}

export interface TitleDescriptionBlock {
  __component: 'general.title-description';
  id: number;
  sectionDescription: string;
  heading: {
    id: number;
    headingPiece: headingPiece[];
  };
}

export interface headingPiece {
  id: number;
  color: string;
  text: string;
}

export interface CityListBlock {
  __component: 'general.city-list';
  id: number;
  Cities: city[]
}

export interface city {
  id: number;
  city: {
  documentId: string;
  locale: string;
  name: string;
}
}

export interface SocialLinksComponentBlock {
  __component: 'general.social-links-component';
  id: number;
  optionalSectionTitle: string;
  socialLink: {
    id: number;
    link: string;
    platform: string;
    visible: boolean;
  }[];
}
export interface LocationComponentBlock {
  __component: 'general.location';
}
export interface VideoEmbedComponentBlock {
  __component: 'dynamic-blocks.video-embed';
}
export interface CardComponentBlock {
  __component: 'dynamic-blocks.text-image-block';
}
export interface testimonialsComponentBlock {
  __component: 'dynamic-blocks.testimonials';
}
export interface PricingTableComponentBlock {
  __component: 'dynamic-blocks.pricing-table';
}
export interface HTMLBlockComponentBlock {
  __component: 'dynamic-blocks.html-block';
}
export interface FAQComponentBlock {
  __component: 'dynamic-blocks.faqs';
}
export interface CallToActionComponentBlock {
  __component: 'dynamic-blocks.call-to-action';
  id: number;
  bodyText: string;
  buttonUrl: string;
  style: string;
}
export interface HeadingTypographyBlock {
  __component: 'typography.heading';
}
export interface ImageBlockBackgroundBlock {
  __component: 'dynamic-blocks.image-block';
}
export interface topListingItemsBlock {
  __component: 'general.top-listing-items';
  id: number;
  listingType: string;
  sectionheader: TitleDescriptionBlock;
  topListings: {
    id: number;
    listingsComponent: {
      id: number;
      listingItem: listingItem;
    }[]
  }
}
export interface listingItem{
  description: string;
  documentId: string;
  id: number;
  featured: boolean;
  images: strapiImage[];
  listingStatus: string;
  locale: string;
  price: number;
  slug: string;
  title: string;
  type: string;
  listingItem: Venue | Vendor;
  averageRating: number;
  ratingsCount: number;
}

export interface Venue {
  __component: 'dynamic-blocks.venue'
  amneties: [];
  bookingDurationType: string;
  bookingDuration: number;
  capacity: number;
  id: number;
  location: string
}
export interface Vendor {
  __component: 'dynamic-blocks.vendor'
  id: number;
  about: string;
  experienceYears: number;
  serviceArea: unknown;
  location: string; //location is not in vendor yet
}

export interface SelectedCategoriesList {
  __component: 'dynamic-blocks.category-list';
  id: number;
  categoryListItem: {
    id: number;
    category: category;
  }[];
  sectionTitle: TitleDescriptionBlock;
  parentCategory: {
    id: number;
    parent: category;
  }
}
export interface category {
  id: number;
  documentId: string;
  externalUrl?: string;
  childCategories: category[];
  image: strapiImage;
  locale: string;
  name: string;
  parentCategory: category;
  slug: string;
}

export interface EventTypesBlock {
  __component: 'dynamic-blocks.event-types-list',
  id: number;
  sectionheader: TitleDescriptionBlock;
  eventTypeItem: {
    id: number;
    eventType: eventType;
    contentPlacement: string;
  }[]
}

export interface eventType {
  documentId: string;
  id: number;
  eventName: string;
  image: strapiImage;
  externalUrl?: string;

}