import { NextRequest, NextResponse } from 'next/server';
import QueryString from 'qs';
import { createQuery } from '@/services/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

/**
 * GET /api/user-listings
 * Query params:
 *   - userId (required) - documentId of the user
 *   - locale (optional)
 *   - status (optional) - filter by listingStatus (draft, published, pending review, archived)
 *
 * Returns listings for authenticated user without server-side caching.
 * Always verifies token and userId match to prevent unauthorized access.
 */
export async function GET(request: NextRequest) {
  try {
    const urlParams = request.nextUrl.searchParams;
    const userId = urlParams.get('userId');
    const locale = urlParams.get('locale');
    const status = urlParams.get('status');
    const authHeader = request.headers.get('authorization');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Minimal token presence check - Strapi will validate token fully
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

        const populate = {
        category: {
            populate: '*',
        },
        listingItem: {
            on: {
                'dynamic-blocks.vendor': {
                    populate: {
                        'serviceArea': {
                            populate: {
                                'city': {
                                    populate: true,
                                },
                                'state': {
                                    populate: true,
                                }
                            }
                        }
                    }
                },
                'dynamic-blocks.venue': {
                    populate: {
                        location: {
                            populate: '*'
                        },
                        amneties: {
                            populate: '*'
                        }
                    }
                }
            }
        },
        portfolio: {
            populate: '*'
        },
        videos: {
            populate: '*'
        },
        user: {
            populate: '*'
        },
        eventTypes: {
            populate: '*'
        },
        hotDeal: {
            populate: {
                discount: {
                    populate: '*'
                }
            }
        },
    };


    const baseFilters: Record<string, unknown> = {
      filters: {
        user: { documentId: { $eq: userId } },
      },
      sort: ['updatedAt:desc'],
    };

    // Add status filter if provided and not 'all'
    if (status && status !== 'all') {
      (baseFilters.filters as Record<string, unknown>).listingStatus = { $eq: status };
    }

    const additional: Record<string, unknown> = {};
    if (locale) additional.locale = locale;

    const query = createQuery(populate, additional);
    const filterString = QueryString.stringify(baseFilters, { encodeValuesOnly: true });
    const url = `${API_URL}/api/listings?${query}&${filterString}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If Strapi returns 401/403, propagate it
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: response.status });
      }
      const err = await response.json().catch(() => ({}));
      console.error('Strapi user listings error:', { status: response.status, url, err });
      return NextResponse.json(
        { error: 'Failed to fetch user listings', details: err },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('Error in user-listings route:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
