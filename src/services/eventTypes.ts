import { API_URL } from "./api";
import type { DynamicBlocks, ListingItem } from "@/types/pagesTypes";

export type EventTypeAggregateResponse = {
  eventType?: {
    documentId: string;
    slug_en?: string;
    locale?: string;
    page?: { documentId: string } | null;
  } | null;
  page?: { documentId: string; locale?: string; blocks?: DynamicBlocks[] } | null;
  listings?: ListingItem[];
  meta?: { resolvedLocale?: string };
};

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// Aggregated fetch: resolve event type by EN slug and return localized page + listings
export async function fetchEventTypeAggregateByEnSlug(slug: string, locale?: string): Promise<EventTypeAggregateResponse> {
  const url = new URL(`${API_URL}/api/event-types/by-en-slug/${encodeURIComponent(slug)}`);
  if (locale) url.searchParams.set("locale", locale);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (res.status === 404) {
    throw new HttpError('Not found', 404);
  }
  if (!res.ok) {
    throw new Error(`Failed to load event type: ${res.status}`);
  }
  const data: EventTypeAggregateResponse = await res.json();
  return data;
}
