import { strapiImage } from "./common";

export interface SiteSettings{
    id: number;
    siteLogo: strapiImage;
    siteTitle: string;
    currency: {
        shortCode: string;
        name?: string;
        symbol: string;
    }
}
