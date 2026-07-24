import {
  buildUrlSet,
  getSitemapBaseUrlFromRequest,
  isSupportedSitemapLocale,
  sitemapHeaders,
} from "@/lib/sitemapXml";
import { fetchPublishedListingSitemapEntries } from "@/services/sitemap";

export const revalidate = 3600; // SITEMAP_REVALIDATE_SECONDS (must be a literal for Next route config)

export async function GET(request: Request) {
  const baseUrl = getSitemapBaseUrlFromRequest(request);
  const listings = await fetchPublishedListingSitemapEntries();

  const xml = buildUrlSet(
    listings
      .filter((listing) => isSupportedSitemapLocale(listing.locale))
      .map((listing) => ({
        loc: `${baseUrl}/${listing.locale}/listing/${listing.slug}`,
        lastmod: listing.updatedAt || listing.publishedAt || listing.createdAt,
        changefreq: "daily",
        priority: 0.8,
      })),
  );

  return new Response(xml, {
    headers: sitemapHeaders(),
  });
}
