import {
  SITEMAP_REVALIDATE_SECONDS,
  buildUrlSet,
  getLatestLastmod,
  getSitemapBaseUrlFromRequest,
  getSitemapLocales,
  sitemapHeaders,
} from "@/lib/sitemapXml";
import { fetchServiceSitemapEntries } from "@/services/sitemap";

export const revalidate = SITEMAP_REVALIDATE_SECONDS;

export async function GET(request: Request) {
  const baseUrl = getSitemapBaseUrlFromRequest(request);
  const locales = getSitemapLocales();
  const services = await fetchServiceSitemapEntries();
  const serviceLastmod = getLatestLastmod(
    services.map((entry) => ({ lastmod: entry.updatedAt || entry.publishedAt || entry.createdAt })),
  );

  const xml = buildUrlSet(
    locales.flatMap((locale) => [
      {
        loc: `${baseUrl}/${locale}/service/all`,
        lastmod: serviceLastmod,
        changefreq: "daily" as const,
        priority: 0.9,
      },
      ...services.map((service) => ({
        loc: `${baseUrl}/${locale}/service/${encodeURIComponent(service.slug)}`,
        lastmod: service.updatedAt || service.publishedAt || service.createdAt,
        changefreq: "daily" as const,
        priority: 0.8,
      })),
    ]),
  );

  return new Response(xml, {
    headers: sitemapHeaders(),
  });
}
