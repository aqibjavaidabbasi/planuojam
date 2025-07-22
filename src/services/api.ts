const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const REVALIDATION_TIME = 3600; // 1 hour
import QueryString from "qs";


// Reusable fetch options
const FETCH_OPTIONS = {
  next: { revalidate: REVALIDATION_TIME },
  cache: "force-cache",
} as const;

/**
 * Build query string for Strapi populate and filters
 */
export function createQuery(
  populate: object,
  additionalParams: object = {}
): string {
  return QueryString.stringify(
    {
      populate,
      ...additionalParams,
    },
    { encodeValuesOnly: true }
  );
}

/**
 * Fetch from Strapi API
 */
export async function fetchAPI(
  endpoint: string,
  query: string,
  filters?: Record<string, unknown>
) {
  const url = filters
    ? `${API_URL}/api/${endpoint}?${query}&${QueryString.stringify(filters, {
        encodeValuesOnly: true,
      })}`
    : `${API_URL}/api/${endpoint}?${query}`;

    console.log("fetching from :: ",url)

  const response = await fetch(url, FETCH_OPTIONS);
  if (!response.ok) {
    console.warn('DEBUG LOGGG:::', await response.json() )
    throw new Error(`Strapi API error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

