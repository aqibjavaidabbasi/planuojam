import { strapiImage } from "./common";

export interface homePage {
    id: number;
    title: string;
    description: string;
    slug: string;
    locale: string;
    blocks: HomePageBlock[];
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
export type HomePageBlock =
  | HeroBannerBlock
  | ImageBlocksGroupBlock
  | BlockGroupsBlock
  | TitleDescriptionBlock
  | CityListBlock
  | SocialLinksComponentBlock;

export interface HeroBannerBlock {
    __component: 'dynamic-blocks.hero-banner';
    id: number;
    title: string;
    subTitle: string;
    heroImage: strapiImage;
  }
  
  // Image Blocks Group
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

        //image missing again??
    }[];
    title: {
        id: number;
        sectionTitle: string;
        sectionDescription: string;
        //multi color heading mising?
    };        
  }
  
  // Block Groups
  export interface BlockGroupsBlock {
    __component: 'dynamic-blocks.block-groups';
    id: number;
    block: unknown[];
    title: unknown;  
  }
  
  export interface TitleDescriptionBlock {
    __component: 'general.title-description';
    id: number;
    sectionTitle: string;
    sectionDescription: string;
    heading: string | null;
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