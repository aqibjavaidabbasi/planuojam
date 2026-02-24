import { NextRequest, NextResponse } from 'next/server';
import QueryString from 'qs';
import { createQuery } from '@/services/api';
import { LISTING_ITEM_POP_STRUCTURE } from '@/utils/ListingItemStructure';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

/**
 * GET /api/listing/[slug]
 * Fetches a single listing by slug WITHOUT ISR caching
 * Always returns fresh data from Strapi
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    const populate = LISTING_ITEM_POP_STRUCTURE;
    const query = createQuery(populate, { locale });
    const filters = {
      filters: {
        slug: { $eq: slug }
      }
    };

    const filterString = QueryString.stringify(filters, { encodeValuesOnly: true });
    const url = `${API_URL}/api/listings?${query}&${filterString}`;

    // No ISR caching - always fetch fresh
    const response = await fetch(url, {
      cache: 'no-store', // ← Important: disables all caching
    }); 

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Strapi API error:', {
        status: response.status,
        url,
        error: errorData
      });
      return NextResponse.json(
        { error: 'Failed to fetch listing from Strapi', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const listing = data.data?.[0];

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Fetch tags if needed
    if (listing?.tagDocumentIds?.length) {
      try {
        const tagsUrl = `${API_URL}/api/tags?filters[documentId][$in]=${listing.tagDocumentIds.join(',')}`;
        const tagsResponse = await fetch(tagsUrl, { cache: 'no-store' });
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          listing.tags = tagsData.data || [];
        }
      } catch (e) {
        console.warn('Failed to fetch tags:', e);
      }
    }

    return NextResponse.json({ data: listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
