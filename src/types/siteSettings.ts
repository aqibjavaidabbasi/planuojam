import { strapiImage, StrapiSeo } from "./common";

export interface SiteSettings{
    id: number;
    siteLogo: strapiImage;
    siteTitle: string;
    bookingCancellationAllowedTime: number; // in hours
    currency: {
        shortCode: string;
        name?: string;
        symbol: string;
    }
    fallbackSeo: {
        id: number;
        seo: StrapiSeo | null;
    }
}
