// lib/getSeoMetadata.ts
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/config/i18n";
import { StrapiSeo } from "@/types/mediaTypes";
import { getCompleteImageUrl } from "@/utils/helpers";
import type { Metadata } from "next";

interface ExtendedMetadata extends Metadata {
  metaImage?: { url: string, alt: string };
}

/**
 * hreflang for every locale in NEXT_PUBLIC_SUPPORTED_LOCALES. Derived from env so adding a
 * locale there is the only step needed — no page or config change. Returns undefined for a
 * single-locale site, where hreflang carries no signal.
 */
function buildLanguageAlternates(urlPath: string, baseUrl: string) {
  if (SUPPORTED_LOCALES.length < 2) return undefined;

  // urlPath is `/<locale>/rest` (possibly with a query); swap the locale segment.
  const pathWithoutLocale = urlPath.replace(/^\/[^/?#]+/, "");
  const href = (locale: string) =>
    baseUrl ? `${baseUrl}/${locale}${pathWithoutLocale}` : `/${locale}${pathWithoutLocale}`;

  return {
    ...Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, href(locale)])),
    "x-default": href(DEFAULT_LOCALE),
  };
}

export function getSeoMetadata(
  seo: StrapiSeo | null,
  fallbackSeo: StrapiSeo | null,
  urlPath: string, // e.g. '/en/about-us'
  options?: {
    baseUrl?: string;
    alternates?: Record<string, string>;
  }
): Metadata {
  const baseUrl = (options?.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const alternates = options?.alternates ?? buildLanguageAlternates(urlPath, baseUrl);

  const data: StrapiSeo | null = seo ?? fallbackSeo ?? null;
  const title = data?.metaTitle || fallbackSeo?.metaTitle || process.env.NEXT_PUBLIC_SITE_NAME || "Planuojam";
  const description = data?.metaDescription || fallbackSeo?.metaDescription || "";
  const canonical =
    data?.canonicalUrl && data.canonicalUrl.startsWith("http")
      ? data.canonicalUrl
      : (baseUrl ? `${baseUrl}${urlPath}` : urlPath);

    const ogImageUrl = getCompleteImageUrl(data?.ogImage?.url || fallbackSeo?.ogImage?.url || fallbackSeo?.metaImage?.url || data?.metaImage?.url || "");
  const twitterImageUrl = getCompleteImageUrl(data?.twitterImage?.url || data?.ogImage?.url || fallbackSeo?.twitterImage?.url || data?.metaImage?.url || "");
 

  // absolute image URL
  const maybeImage = data?.metaImage?.url;
  const image = getCompleteImageUrl(maybeImage || "");
  const robots = data?.metaRobots
    ? {
        index: data.metaRobots.includes("index"),
        follow: data.metaRobots.includes("follow"),
      }
    : { index: true, follow: true };

  const metadata: ExtendedMetadata = {
    title,
    description,
    metaImage: image ? { url: image, alt: title } : undefined,
    alternates: {
      canonical,
      languages: alternates,
    },
    robots,
    openGraph: {
      title: data?.ogTitle || title,
      description: data?.ogDescription || description,
      url: baseUrl ? `${baseUrl}${urlPath}` : urlPath,
      images: ogImageUrl ? [{ url: ogImageUrl, alt: data?.ogTitle || title }] : [],
    },
     twitter: {
      card: ogImageUrl || twitterImageUrl ? "summary_large_image" : "summary",
      title: data?.twitterTitle || data?.ogTitle || title,
      description: data?.twitterDescription || data?.ogDescription || description,
      images: twitterImageUrl ? [twitterImageUrl] : ogImageUrl ? [ogImageUrl] : [],
    },
    // NOTE: Strapi's `schemaMarkup` is deliberately NOT emitted here. Next's `other`
    // renders <meta name="..."> — it cannot produce a <script type="application/ld+json">,
    // so this produced an invalid meta tag rather than structured data. Real JSON-LD is
    // rendered as a <script> in the page itself (see listing/[slug]/page.tsx).
  };

  return metadata;
}
