import { strapiImage, User } from "./common";

export interface page {
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
    categories: category[];
  };
  eventTypes: {
    id: number;
    eventType: EventTypes;
  }[]
}

export interface EventTypes {
  documentId: string;
  id: number;
  locale: string;
  eventName: string;
  slug: string;
  page: {
    slug: string;
    documentId: string;
  }
}


export interface footer {
  id: number;
  copyRightText: string;
  extraLinks: {
    id: number;
    pages: {
      title: string;
      documentId: string;
    }[]
  };
  footerlinkSection: {
    id: number;
    title: string;
    linksType: string;
    categories: category[];
    pages: {
      title: string;
      documentId: string;
    }[]
    event_types: EventTypes[]
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
  | EventTypesBlock
  | RichTextAreaBlock;

export interface HeroBannerBlock {
  __component: 'dynamic-blocks.hero-banner';
  id: number;
  title: string;
  subTitle: string;
  heroImage: strapiImage;
  callToAction: CallToActionComponentBlock;
  imagePosition: string;
  variant: string;
  heading: {
    id: number;
    headingPiece: headingPiece[]
  };
}

export interface ImageBlocksGroupBlock {
  __component: 'dynamic-blocks.image-blocks-group';
  id: number;
  imageBlock: {
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
  listingType: string;
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
  socialLink: SocialLink[];
}

export interface SocialLink {
  id: number;
  link: string;
  platform: string;
  visible: boolean;
}

export interface LocationComponentBlock {
  __component: 'general.location';
}
export interface VideoEmbedComponentBlock {
  __component: 'dynamic-blocks.video-embed';
}
export interface CardComponentBlock {
  __component: 'dynamic-blocks.text-image-block';
  image: strapiImage;
  backgroundColor?: string;
  imagePositon?: 'top' | 'left' | 'right';
  heading: string;
  blockContent: string;
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
  sectionTitle: string;
  id: number;
  numberOfColumns: 'one' | 'two';
  items: FAQ[]
}
export interface CallToActionComponentBlock {
  __component: 'dynamic-blocks.call-to-action';
  id: number;
  bodyText: string;
  buttonUrl: string;
  style: 'primary' | 'secondary' | 'ghost';
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
    listings: ListingItem[];
  }
}

export interface Contact {
  email: string;
  phone: string;
  address: string;
}

export interface ListingItem {
  description: string;
  documentId: string;
  id: number;
  featured: boolean;
  listingStatus: string;
  locale: string;
  price?: number;
  slug: string;
  title: string;
  type: string;
  listingItem: (Venue | Vendor)[];
  averageRating: number;
  ratingsCount: number;
  category: category;
  contact: Contact;
  socialLinks: {
    optionalSectionTitle: string;
    socialLink: SocialLink[]
  }
  websiteLink: string;
  workingHours: number;
  pricingPackages: {
    sectionTitle: string;
    plans: Plans[];
    optionalAddons: {
      statement: string;
      price: number;
    }[]
  }
  portfolio: strapiImage[];
  FAQs: {
    sectionTitle: string;
    numberOfColumns: number;
    items: FAQ[];
  }
  reviews: Review[];
  user: User;
  eventTypes: EventTypes[];
  hotDeal: {
    enableHotDeal: boolean;
    startDate: string;
    lastDate: string;
    dealNote: string;
    discount: Discount;
  }
}
export interface Discount {
  discountType: 'Flat Rate' | 'Percentage'
  percentage: number;
  flatRatePrice: number;
}

export interface Venue {
  __component: 'dynamic-blocks.venue'
  amneties?: {
    text: string;
  }[];
  bookingDurationType?: string;
  bookingDuration?: number;
  capacity?: number;
  id: number;
  location?: {
    address: string;
    city: string;
    id: number;
    latitude: number;
    longitude: number;
    country: string;
  }
}
export interface Vendor {
  __component: 'dynamic-blocks.vendor'
  id: number;
  about: string;
  experienceYears: number;
  serviceArea: ServiceArea[]
}
export interface ServiceArea {
  city: Place;
  state: Place;
  latitude: number;
  longitude: number;
}

export interface Place {
  name: string;
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
export interface RichTextAreaBlock {
  __component: "dynamic-blocks.rich-text-area";
  id: number;
  content: {
    level?: number;
    type?: string;
  }[]
}

export interface Plans {
  name: string;
  price: number;
  isPopular: boolean;
  cta: CallToActionComponentBlock;
  featuresList: {
    statement: string;
  }[]
}
export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export interface Review {
  id: number;
  author: User;
  review: ReviewContent
}
export interface ReviewContent {
  rating: number;
  reviewBody: string;
  reviewStatus: 'Pending Approval' | 'Approved' | 'Rejected'
}