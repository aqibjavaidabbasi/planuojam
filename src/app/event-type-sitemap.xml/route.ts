import {
  buildUrlSet,
  getSitemapBaseUrlFromRequest,
  getSitemapLocales,
  sitemapHeaders,
} from "@/lib/sitemapXml";
import { fetchEventTypeSitemapEntries } from "@/services/sitemap";

export const revalidate = 3600; // SITEMAP_REVALIDATE_SECONDS (must be a literal for Next route config)

export async function GET(request: Request) {
  const baseUrl = getSitemapBaseUrlFromRequest(request);
  const locales = getSitemapLocales();
  const eventTypes = await fetchEventTypeSitemapEntries();

  const xml = buildUrlSet(
    locales.flatMap((locale) =>
      eventTypes.map((eventType) => ({
        loc: `${baseUrl}/${locale}/event-types/${encodeURIComponent(eventType.slug)}`,
        lastmod: eventType.updatedAt || eventType.publishedAt || eventType.createdAt,
        changefreq: "weekly" as const,
        priority: 0.7,
      })),
    ),
  );

  return new Response(xml, {
    headers: sitemapHeaders(),
  });
}
