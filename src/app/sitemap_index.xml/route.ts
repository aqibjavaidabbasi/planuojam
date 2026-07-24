import {
  buildSitemapIndex,
  getLatestLastmod,
  getStaticSitemapEntries,
  getSitemapBaseUrlFromRequest,
  sitemapHeaders,
} from "@/lib/sitemapXml";
import type { StaticSitemapPage } from "@/lib/sitemapXml";
import {
  fetchCategoryFilterSitemapEntries,
  fetchEventTypeSitemapEntries,
  fetchPageSitemapEntries,
  fetchPublishedListingSitemapEntries,
  fetchServiceSitemapEntries,
} from "@/services/sitemap";
import type { PageSitemapEntry } from "@/services/sitemap";

export const revalidate = 3600; // SITEMAP_REVALIDATE_SECONDS (must be a literal for Next route config)

function findPageLastmod(pages: PageSitemapEntry[], page: StaticSitemapPage, locale: string) {
  const match = pages.find((entry) => {
    if (entry.locale !== locale) return false;
    if ("documentId" in page && page.documentId) return entry.documentId === page.documentId;
    if ("slug" in page && page.slug) return entry.slug === page.slug;
    return false;
  });

  return match?.updatedAt || match?.publishedAt || match?.createdAt;
}

export async function GET(request: Request) {
  const baseUrl = getSitemapBaseUrlFromRequest(request);
  const [pages, listings, services, eventTypes, categories] = await Promise.all([
    fetchPageSitemapEntries(),
    fetchPublishedListingSitemapEntries(),
    fetchServiceSitemapEntries(),
    fetchEventTypeSitemapEntries(),
    fetchCategoryFilterSitemapEntries(),
  ]);

  const xml = buildSitemapIndex([
    {
      loc: `${baseUrl}/page-sitemap.xml`,
      lastmod: getLatestLastmod(getStaticSitemapEntries(baseUrl, (page, locale) => findPageLastmod(pages, page, locale))),
    },
    {
      loc: `${baseUrl}/listing-sitemap.xml`,
      lastmod: getLatestLastmod(listings.map((entry) => ({ lastmod: entry.updatedAt || entry.publishedAt || entry.createdAt }))),
    },
    {
      loc: `${baseUrl}/service-sitemap.xml`,
      lastmod: getLatestLastmod(services.map((entry) => ({ lastmod: entry.updatedAt || entry.publishedAt || entry.createdAt }))),
    },
    {
      loc: `${baseUrl}/category-sitemap.xml`,
      lastmod: getLatestLastmod(categories.map((entry) => ({ lastmod: entry.updatedAt || entry.publishedAt || entry.createdAt }))),
    },
    {
      loc: `${baseUrl}/event-type-sitemap.xml`,
      lastmod: getLatestLastmod(eventTypes.map((entry) => ({ lastmod: entry.updatedAt || entry.publishedAt || entry.createdAt }))),
    },
  ]);

  return new Response(xml, {
    headers: sitemapHeaders(),
  });
}
