import { NextRequest, NextResponse } from 'next/server';
import QueryString from 'qs';
import { createQuery } from '@/services/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

/**
 * GET /api/event-listings/[eventTypeId]
 * Query params:
 *  - locale
 *  - page
 *  - pageSize
 *  - parentCategory (optional) -> parentCategory documentId to filter vendor/venue
 *
 * Returns promoted listings for given eventTypeId without server-side caching.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ eventTypeId: string }> }) {
  try {
    const { eventTypeId } = await params;
    const urlParams = request.nextUrl.searchParams;
    const locale = urlParams.get('locale') || undefined;
    const page = urlParams.get('page');
    const pageSize = urlParams.get('pageSize');
    const parentCategory = urlParams.get('parentCategory');

    if (!eventTypeId) {
      return NextResponse.json({ error: 'eventTypeId is required' }, { status: 400 });
    }

    // Build populate structure similar to client/service usage
    const populate = {
      category: { populate: '*' },
      listingItem: {
        on: {
          'dynamic-blocks.vendor': {
            populate: {
              serviceArea: {
                populate: {
                  city: { populate: true },
                  state: { populate: true }
                }
              }
            }
          },
          'dynamic-blocks.venue': {
            populate: {
              location: { populate: '*' },
              amneties: { populate: '*' }
            }
          }
        }
      },
      portfolio: { populate: '*' },
      videos: { populate: '*' },
      reviews: { populate: '*' },
      user: { populate: '*' },
      eventTypes: { populate: '*' },
      hotDeal: { populate: { discount: { populate: '*' } } },
    };

    const baseFilters: Record<string, unknown> = {
      filters: {
        eventTypes: { documentId: eventTypeId },
      },
    };

    if (parentCategory) {
      (baseFilters.filters as Record<string, unknown>).category = { parentCategory: { documentId: parentCategory } };
    }

    const additional: Record<string, unknown> = {};
    if (locale) additional.locale = locale;
    if (page || pageSize) additional.pagination = {
      ...(page ? { page: Number(page) } : {}),
      ...(pageSize ? { pageSize: Number(pageSize) } : {}),
    };

    const query = createQuery(populate, additional);
    const filterString = QueryString.stringify(baseFilters, { encodeValuesOnly: true });
    const url = `${API_URL}/api/listings/promoted?${query}&${filterString}`;

    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Strapi promoted listings error:', { status: response.status, url, err });
      return NextResponse.json({ error: 'Failed to fetch promoted listings', details: err }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('Error in event-listings route:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
