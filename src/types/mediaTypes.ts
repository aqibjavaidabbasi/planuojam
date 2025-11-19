export interface strapiImage{
    id: number;
    url: string;
    width: number;
    formats: {
        small: {
            url: string;
            width: number;
        },
        medium: {
            url: string;
            width: number;
        },
        thumbnail: {
            url: string;
            width: number;
        },
        banner: {
            url: string;
            width: number;
        }
    }
}

export type StrapiSeo = {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  metaImage?: { url: string };
  metaRobots?: "index, follow" | "noindex, nofollow" | "noindex, follow" | "index, nofollow";
  schemaMarkup?: object;
   // OG overrides
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: strapiImage;
  ogType?: string;

  // Twitter overrides
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: strapiImage;
};
