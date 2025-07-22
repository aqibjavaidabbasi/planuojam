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
  nav: {
    id: number;
    item: navObj[]
  };
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
  | ImageBlockBackgroundBlock;

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
  title: {
    id: number;
    sectionTitle: string;
    sectionDescription: string;
    heading: {
      id: number;
      headingPiece: headingPiece[]
    }
  };
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
  title: {
    heading: {
      headingPiece: headingPiece[];
    }
    id: number;
    sectionDescription: string;
    sectionTitle: string;
  };
}

export interface TitleDescriptionBlock {
  __component: 'general.title-description';
  id: number;
  sectionTitle: string;
  sectionDescription: string;
  heading: headingPiece[];
}

export interface headingPiece {
  id: number;
  color: string;
  text: string;
}

export interface CityListBlock {
  __component: 'general.city-list';
  id: number;
  Cities: unknown[];
}

export interface SocialLinksComponentBlock {
  __component: 'general.social-links-component';
  id: number;
  optionalSectionTitle: string;
  socialLink: unknown[];
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