import {
  buildUrlSet,
  getStaticSitemapEntries,
  getSitemapBaseUrlFromRequest,
  sitemapHeaders,
} from "@/lib/sitemapXml";
import type { StaticSitemapPage } from "@/lib/sitemapXml";
import { fetchPageSitemapEntries } from "@/services/sitemap";
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
  const pages = await fetchPageSitemapEntries();
  const xml = buildUrlSet(
    getStaticSitemapEntries(baseUrl, (page, locale) => findPageLastmod(pages, page, locale)),
  );

  return new Response(xml, {
    headers: sitemapHeaders(),
  });
}
