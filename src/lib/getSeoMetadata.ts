// lib/getSeoMetadata.ts
import { StrapiSeo } from "@/types/common";
import { getCompleteImageUrl } from "@/utils/helpers";
import type { Metadata } from "next";

interface ExtendedMetadata extends Metadata {
  metaImage?: { url: string, alt: string };
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
  const alternates = options?.alternates ?? {};

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
    // NOTE: JSON-LD is returned here for convenience; many people inject it manually in head.tsx/page
    other: data?.schemaMarkup ? { "script:ld+json": JSON.stringify(data.schemaMarkup) } : {},
  };

  return metadata;
}
