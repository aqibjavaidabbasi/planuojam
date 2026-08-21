import { createQuery, fetchAPI } from "./api";
import { StrapiSeo } from "@/types/mediaTypes";
import { fetchSiteSettings } from "./siteSettings";

// Fetch SEO from the Pages collection by slug
export async function fetchPageSeoBySlug(slug: string, locale?: string): Promise<StrapiSeo | null> {
  // Always fetch EN base and include localizations; then pick localized SEO
  const populate = {
    seoSettings: { populate: '*' },
    localizations: { populate: { seoSettings: { populate: '*' } } },
  } as const;
  const filters = { filters: { slug: { $eq: slug } } } as const;

  const queryEn = createQuery(populate, { locale: 'en' });
  const res = await fetchAPI("pages", queryEn, filters);
  const page = Array.isArray(res) ? res[0] : res?.[0];
  if (!page) return null;

  if (locale && page.localizations) {
    const match = page.localizations?.find((l: {locale: string}) => l?.locale === locale);
    const locSeo = match?.seoSettings?.[0] ?? null;
    if (locSeo) return locSeo;
  }

  const baseSeo = page?.seoSettings?.[0] ?? null;
  return baseSeo || null;
}

// Fetch SEO from the Pages collection by document ID (preferred for stability across auto-translate) ✔
export async function fetchPageSeoById(documentId: string, locale?: string){
  // Always fetch base (English) and include localizations, then pick localized SEO
  const populate = {
    seoSettings: { populate: '*' },
    localizations: {
      populate: {
        seoSettings: { populate: '*' },
      },
    },
  } as const;

  const queryEn = createQuery(populate, { locale: 'en' });
  const base = await fetchAPI(`pages/${documentId}`, queryEn, {});

  // Prefer the requested locale's seoSettings if present
  if (locale && base?.localizations) {
    if (locale === 'en'){
        return base?.seoSettings;
    }else {
        const match = base.localizations?.find((l: {locale: string}) => l?.locale === locale);
        const locSeo = match?.seoSettings?.[0] ?? null;
        if (locSeo) return locSeo;
    }
  }

  return null;
}

// Fetch SEO from dedicated SEO collection by absolute or relative pageUrl ✔
export async function fetchSeoByPageUrl(pageUrl: string, locale?: string): Promise<StrapiSeo | null> {
  const populate = {
    seo: { populate: '*' },
    localizations: {
        populate: {
            // Important: use proper nested populate object, not a raw '*'
            seo: { populate: '*' }
        }
    }
  } as const;
  const filters = {
    filters: { pageUrl: { $eq: pageUrl } },
  } as const;

  const queryWithLocale = createQuery(populate, { locale: 'en'});
  const resLocale = await fetchAPI("seos", queryWithLocale, filters);

  // Ensure we are working with a single SEO mapping entry
  const item = Array.isArray(resLocale) ? resLocale[0] : resLocale?.[0];
  if (!item) return null;

  // If requested locale is provided, prefer localized SEO from localizations
  if (locale) {
    if (locale === 'en') {
      return item?.seo ?? null;
    } else if (item?.localizations) {
      const match = item.localizations?.find((l: { locale: string }) => l?.locale === locale);
      const locSeo = match?.seo ?? null;
      if (locSeo) return locSeo;
    }
  }

  // Fallback to base SEO
  return item?.seo ?? null;
}

// Fetch fallback SEO from Site Settings ✔
export async function fetchFallbackSeo(): Promise<StrapiSeo | null> {
  const settings = await fetchSiteSettings();
  return settings?.fallbackSeo?.seo || null;
}

// Google renders roughly 155-160 characters of a description. Cut on a word boundary so the
// snippet doesn't end mid-word, and collapse the newlines listing descriptions are full of.
const META_DESCRIPTION_MAX = 155;

export function toMetaDescription(text: unknown): string {
  if (typeof text !== 'string') return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= META_DESCRIPTION_MAX) return clean;

  const cut = clean.slice(0, META_DESCRIPTION_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  // Only honour the word boundary if it doesn't throw away most of the snippet.
  const trimmed = lastSpace > META_DESCRIPTION_MAX * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.replace(/[\s.,;:!?-]+$/, '')}…`;
}

// Build a minimal SEO object from a listing's own title/description so listings
// without a manually-filled seo block still emit per-listing metadata (not the generic fallback).
function seoFromListingFields(listing: { title?: string; description?: unknown } | null | undefined): StrapiSeo | null {
  if (!listing?.title) return null;
  return {
    metaTitle: listing.title,
    metaDescription: toMetaDescription(listing.description),
  } as StrapiSeo;
}

// Merge per field rather than picking one source. A manual `seo` block that exists but has
// an empty metaTitle/metaDescription used to win outright (`seo ?? derived`), dropping the
// listing straight through to the generic site-wide SEO — the exact duplicate-title problem
// the derived values exist to prevent.
function resolveListingSeo(listing: { title?: string; description?: unknown; seo?: StrapiSeo } | null | undefined): StrapiSeo | null {
  const derived = seoFromListingFields(listing);
  const manual = listing?.seo ?? null;
  if (!manual) return derived;
  if (!derived) return manual;

  return {
    ...manual,
    metaTitle: manual.metaTitle || derived.metaTitle,
    metaDescription: manual.metaDescription || derived.metaDescription,
  };
}

// Fetch SEO for a Listing by slug. Mirrors listing data fetch behavior (locale-first approach).
// Prefers the manual `seo` block field by field, falling back to the listing's own title/description.
export async function fetchListingSeoBySlug(slug: string, locale?: string): Promise<StrapiSeo | null> {
  const populate = {
    seo: { populate: '*' }
  } as const;
  const additional = { fields: ['title', 'description'] } as const;
  const filters = { filters: { slug: { $eq: slug } } } as const;

  // 1) Try requested locale (since slug is global)
  if (locale) {
    const queryWithLocale = createQuery(populate, { locale, ...additional });
    const resLocale = await fetchAPI('listings', queryWithLocale, filters);
    const listingLocale = Array.isArray(resLocale) ? resLocale[0] : resLocale?.[0];
    const locSeo = resolveListingSeo(listingLocale);
    if (locSeo) return locSeo;
  }

  // 2) Fallback: no locale constraint (base)
  const queryBase = createQuery(populate, additional);
  const resBase = await fetchAPI('listings', queryBase, filters);
  const listingBase = Array.isArray(resBase) ? resBase[0] : resBase?.[0];
  return resolveListingSeo(listingBase);
}

// High-level resolver by page slug -> SEO collection (pageUrl) -> fallback
export async function resolveSeoForPage(
  params: { slug: string; pageUrl?: string; locale?: string }
): Promise<StrapiSeo | null> {
  const { slug, pageUrl, locale } = params;

  // 1) Page SEO
  const pageSeo = await fetchPageSeoBySlug(slug, locale);
  if (pageSeo) return pageSeo;

  // 2) Dedicated SEO collection by pageUrl (if provided)
  if (pageUrl) {
    const mappedSeo = await fetchSeoByPageUrl(pageUrl, locale);
    if (mappedSeo) return mappedSeo;
  }

  // 3) Fallback SEO
  return await fetchFallbackSeo();
}

// High-level resolver by URL only -> fallback 
export async function resolveSeoByUrl(
  params: { pageUrl: string; locale?: string }
): Promise<StrapiSeo | null> {
  const { pageUrl, locale } = params;

  // 1) Dedicated SEO collection by pageUrl
  const mappedSeo = await fetchSeoByPageUrl(pageUrl, locale);
  if (mappedSeo) return mappedSeo;

  // 2) Fallback SEO
  return await fetchFallbackSeo();
}

// High-level resolver for a Page by document ID -> SEO collection by pageUrl -> fallback ✔
export async function resolveSeoForPageById(
  params: { documentId: string; locale?: string }
): Promise<StrapiSeo | null> {
  const { documentId, locale } = params;
  const pageSeo = await fetchPageSeoById(documentId, locale);
  if (pageSeo !== null || pageSeo?.length > 0) return pageSeo;
  return await fetchFallbackSeo();
}

// High-level resolver for Listing by slug -> SEO collection by pageUrl (relative) -> fallback
export async function resolveSeoForListing(
  params: { slug: string; locale?: string }
): Promise<StrapiSeo | null> {
  const { slug, locale } = params;

  const listingSeo = await fetchListingSeoBySlug(slug, locale);
  if (listingSeo) return listingSeo;

  return await fetchFallbackSeo();
}
