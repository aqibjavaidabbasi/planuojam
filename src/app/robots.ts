import type { MetadataRoute } from "next";
import { getSitemapBaseUrl } from "@/lib/sitemapXml";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSitemapBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: baseUrl ? `${baseUrl}/sitemap_index.xml` : "/sitemap_index.xml",
    host: baseUrl || undefined,
  };
}
