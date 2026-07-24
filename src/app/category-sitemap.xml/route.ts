import {
  SITEMAP_REVALIDATE_SECONDS,
  buildUrlSet,
  getSitemapBaseUrlFromRequest,
  isSupportedSitemapLocale,
  sitemapHeaders,
} from "@/lib/sitemapXml";
import { fetchCategoryFilterSitemapEntries } from "@/services/sitemap";
import type { CategoryFilterSitemapEntry } from "@/services/sitemap";

export const revalidate = SITEMAP_REVALIDATE_SECONDS;

function getParentServiceSlug(category: CategoryFilterSitemapEntry) {
  const parent = category.parentCategory;
  if (!parent?.slug) return undefined;

  if (parent.locale === "en") return parent.slug;

  return parent.localizations?.find((localization) => localization.locale === "en")?.slug || parent.slug;
}

export async function GET(request: Request) {
  const baseUrl = getSitemapBaseUrlFromRequest(request);
  const categories = await fetchCategoryFilterSitemapEntries();

  const xml = buildUrlSet(
    categories
      .filter((category) => isSupportedSitemapLocale(category.locale))
      .map((category) => {
        const parentSlug = getParentServiceSlug(category);
        if (!parentSlug) return null;

        return {
          loc: `${baseUrl}/${category.locale}/service/${encodeURIComponent(parentSlug)}?cats=${encodeURIComponent(category.name.trim())}`,
          lastmod: category.updatedAt || category.publishedAt || category.createdAt,
          changefreq: "weekly" as const,
          priority: 0.6,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
  );

  return new Response(xml, {
    headers: sitemapHeaders(),
  });
}
