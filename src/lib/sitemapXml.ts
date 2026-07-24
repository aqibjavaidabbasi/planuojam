import { SUPPORTED_LOCALES } from "@/config/i18n";

export const SITEMAP_REVALIDATE_SECONDS = 3600;

export const STATIC_SITEMAP_PAGES = [
  { path: "", documentId: "k97xf2g2fdn14vlubd26wupu", priority: 1 },
  { path: "/about-us", documentId: "w9xmo2id7rjddo44es246xzl", priority: 0.7 },
  { path: "/contact-us", slug: "contact-us", priority: 0.7 },
  { path: "/hot-deal", documentId: "h7ycc611qvimjg3prccyvm3n", priority: 0.7 },
  { path: "/map", priority: 0.7 },
  { path: "/privacy-policy", documentId: "fvrfcj6up74ua7y459jbxt6t", priority: 0.7 },
  { path: "/terms-of-service", documentId: "d1wrcza11cao15fm3mg2xibi", priority: 0.7 },
];

export type SitemapUrlEntry = {
  loc: string;
  lastmod?: Date | string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

export type SitemapIndexEntry = {
  loc: string;
  lastmod?: Date | string;
};

export type StaticSitemapPage = (typeof STATIC_SITEMAP_PAGES)[number];

export function getSitemapLocales() {
  return SUPPORTED_LOCALES.length ? SUPPORTED_LOCALES : ["lt"];
}

export function isSupportedSitemapLocale(locale?: string) {
  if (!locale) return false;
  return getSitemapLocales().includes(locale);
}

export function getSitemapBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").replace(/\/$/, "");
}

export function getSitemapBaseUrlFromRequest(request: Request) {
  return getSitemapBaseUrl() || new URL(request.url).origin.replace(/\/$/, "");
}

export function sitemapHeaders() {
  return {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": `public, s-maxage=${SITEMAP_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
  };
}

export function getStaticSitemapEntries(
  baseUrl = getSitemapBaseUrl(),
  getLastmod?: (page: StaticSitemapPage, locale: string) => Date | string | undefined,
): SitemapUrlEntry[] {
  return getSitemapLocales().flatMap((locale) =>
    STATIC_SITEMAP_PAGES.map((page) => ({
      loc: `${baseUrl}/${locale}${page.path}`,
      lastmod: getLastmod?.(page, locale),
      changefreq: "weekly" as const,
      priority: page.priority,
    })),
  );
}

export function formatLastmod(value?: Date | string) {
  if (!value) return undefined;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}

export function getLatestLastmod(entries: Array<{ lastmod?: Date | string }>) {
  const timestamps = entries
    .map((entry) => {
      const formatted = formatLastmod(entry.lastmod);
      return formatted ? new Date(formatted).getTime() : undefined;
    })
    .filter((value): value is number => typeof value === "number");

  if (!timestamps.length) return undefined;

  return new Date(Math.max(...timestamps));
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemapIndex(entries: SitemapIndexEntry[]) {
  const sitemapEntries = entries
    .map((entry) => {
      const lastmod = formatLastmod(entry.lastmod);

      return [
        "  <sitemap>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
        "  </sitemap>",
      ].filter(Boolean).join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    sitemapEntries,
    "</sitemapindex>",
  ].join("\n");
}

export function buildUrlSet(entries: SitemapUrlEntry[]) {
  const urlEntries = entries
    .map((entry) => {
      const lastmod = formatLastmod(entry.lastmod);

      return [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
        entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : "",
        typeof entry.priority === "number" ? `    <priority>${entry.priority.toFixed(1)}</priority>` : "",
        "  </url>",
      ].filter(Boolean).join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    "</urlset>",
  ].join("\n");
}
