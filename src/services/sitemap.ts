import QueryString from "qs";
import { API_URL } from "./api";
import { SUPPORTED_LOCALES } from "@/config/i18n";

export type ListingSitemapEntry = {
  documentId?: string;
  slug: string;
  locale?: string;
  updatedAt?: string;
  publishedAt?: string;
  createdAt?: string;
};

export type ServiceSitemapEntry = {
  documentId?: string;
  slug: string;
  locale?: string;
  updatedAt?: string;
  publishedAt?: string;
  createdAt?: string;
};

export type EventTypeSitemapEntry = {
  documentId?: string;
  slug: string;
  locale?: string;
  updatedAt?: string;
  publishedAt?: string;
  createdAt?: string;
};

export type CategoryFilterSitemapEntry = {
  documentId?: string;
  name: string;
  slug?: string;
  locale?: string;
  updatedAt?: string;
  publishedAt?: string;
  createdAt?: string;
  parentCategory?: {
    slug?: string;
    locale?: string;
    localizations?: Array<{ slug?: string; locale?: string }>;
  };
};

export type PageSitemapEntry = {
  documentId?: string;
  slug?: string;
  locale?: string;
  updatedAt?: string;
  publishedAt?: string;
  createdAt?: string;
};

type StrapiListResponse<T> = {
  data?: T[];
  meta?: {
    pagination?: {
      pageCount?: number;
    };
  };
};

function getConfiguredLocales() {
  return SUPPORTED_LOCALES.length ? SUPPORTED_LOCALES : ["lt"];
}

async function fetchAllPages<T>(endpoint: string, params: Record<string, unknown>, pageSize = 100): Promise<T[]> {
  const entries: T[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const query = QueryString.stringify(
      {
        ...params,
        pagination: { page, pageSize },
      },
      { encodeValuesOnly: true },
    );

    const response = await fetch(`${API_URL}/api/${endpoint}?${query}`, {
      next: { revalidate: 3600, tags: ["sitemap"] },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Strapi API error! status: ${response.status}`);
    }

    const data = (await response.json()) as StrapiListResponse<T>;
    if (Array.isArray(data.data)) entries.push(...data.data);

    pageCount = data.meta?.pagination?.pageCount || 1;
    page += 1;
  } while (page <= pageCount);

  return entries;
}

function uniqueBy<T>(entries: T[], getKey: (entry: T) => string) {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const key = getKey(entry);
    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export async function fetchPublishedListingSitemapEntries(pageSize = 100): Promise<ListingSitemapEntry[]> {
  const listingsByLocale = await Promise.all(
    getConfiguredLocales().map((locale) =>
      fetchAllPages<ListingSitemapEntry>(
        "listings",
        {
          locale,
          fields: ["documentId", "slug", "locale", "updatedAt", "publishedAt", "createdAt"],
          filters: {
            listingStatus: { $eq: "published" },
          },
          sort: ["updatedAt:desc"],
        },
        pageSize,
      ),
    ),
  );

  const listings = listingsByLocale.flat();

  return uniqueBy(
    listings.filter((listing) => Boolean(listing.slug)),
    (listing) => `${listing.locale || ""}:${listing.slug}`,
  );
}

export async function fetchCategoryFilterSitemapEntries(pageSize = 100): Promise<CategoryFilterSitemapEntry[]> {
  const categoriesByLocale = await Promise.all(
    getConfiguredLocales().map((locale) =>
      fetchAllPages<CategoryFilterSitemapEntry>(
        "categories",
        {
          locale,
          fields: ["documentId", "name", "slug", "locale", "updatedAt", "publishedAt", "createdAt"],
          filters: {
            parentCategory: { $null: false },
            isActive: { $eq: true },
          },
          populate: {
            parentCategory: {
              fields: ["slug", "locale"],
              populate: {
                localizations: {
                  fields: ["slug", "locale"],
                },
              },
            },
          },
          sort: ["updatedAt:desc"],
        },
        pageSize,
      ),
    ),
  );

  const categories = categoriesByLocale.flat();

  return uniqueBy(
    categories.filter((category) => Boolean(category.name && category.parentCategory?.slug)),
    (category) => `${category.locale || ""}:${category.parentCategory?.slug || ""}:${category.name}`,
  );
}

export async function fetchPageSitemapEntries(pageSize = 100): Promise<PageSitemapEntry[]> {
  const pagesByLocale = await Promise.all(
    getConfiguredLocales().map((locale) =>
      fetchAllPages<PageSitemapEntry>(
        "pages",
        {
          locale,
          fields: ["documentId", "slug", "locale", "updatedAt", "publishedAt", "createdAt"],
          sort: ["updatedAt:desc"],
        },
        pageSize,
      ),
    ),
  );

  const pages = pagesByLocale.flat();

  return uniqueBy(
    pages.filter((page) => Boolean(page.documentId || page.slug)),
    (page) => `${page.locale || ""}:${page.documentId || page.slug || ""}`,
  );
}

export async function fetchServiceSitemapEntries(pageSize = 100): Promise<ServiceSitemapEntry[]> {
  const services = await fetchAllPages<ServiceSitemapEntry>(
    "categories",
    {
      locale: "en",
      fields: ["documentId", "slug", "locale", "updatedAt", "publishedAt", "createdAt"],
      filters: {
        parentCategory: { $null: true },
        isActive: { $eq: true },
        serviceType: { $notNull: true },
      },
      sort: ["updatedAt:desc"],
    },
    pageSize,
  );

  return uniqueBy(
    services.filter((service) => Boolean(service.slug)),
    (service) => service.slug,
  );
}

export async function fetchEventTypeSitemapEntries(pageSize = 100): Promise<EventTypeSitemapEntry[]> {
  const eventTypes = await fetchAllPages<EventTypeSitemapEntry>(
    "event-types",
    {
      locale: "en",
      fields: ["documentId", "slug", "locale", "updatedAt", "publishedAt", "createdAt"],
      sort: ["updatedAt:desc"],
    },
    pageSize,
  );

  return uniqueBy(
    eventTypes.filter((eventType) => Boolean(eventType.slug)),
    (eventType) => eventType.slug,
  );
}
