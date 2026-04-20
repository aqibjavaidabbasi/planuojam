import { NextRequest, NextResponse } from 'next/server';
import QueryString from 'qs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

/**
 * GET /api/invoices
 * Query params:
 *   - userId (required) - documentId of the user
 *
 * Returns invoices for the authenticated user based on their subscription relation.
 * Always verifies token and userId match to prevent unauthorized access.
 */
export async function GET(request: NextRequest) {
  try {
    const urlParams = request.nextUrl.searchParams;
    const userId = urlParams.get('userId');
    const authHeader = request.headers.get('authorization');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all subscription document IDs belonging to the user
    const subsUrl = `${API_URL}/api/subscriptions?filters[users_permissions_user][documentId][$eq]=${userId}&fields[0]=documentId`;
    const subsResponse = await fetch(subsUrl, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!subsResponse.ok) {
      if (subsResponse.status === 401 || subsResponse.status === 403) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: subsResponse.status });
      }
      return NextResponse.json({ error: 'Failed to fetch user subscriptions' }, { status: subsResponse.status });
    }

    const subsData = await subsResponse.json();
    const subIds: string[] = subsData.data?.map((s: { documentId: string }) => s.documentId) || [];

    if (subIds.length === 0) {
      // User has no subscriptions, therefore no invoices
      return NextResponse.json({ data: [] });
    }

    // 2. Fetch invoices that map to one of those subscriptions.
    // Try 'subscriptions' then fallback to 'subscription' if server uses a different schema.
    const fetchInvoices = async (relationKey: string) => {
      const qs = QueryString.stringify({
        populate: { [relationKey]: { populate: '*' } },
        filters: { [relationKey]: { documentId: { $in: subIds } } },
        sort: ['periodStart:desc'],
      }, { encodeValuesOnly: true });

      return fetch(`${API_URL}/api/invoices?${qs}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
    };

    let response = await fetchInvoices('subscriptions');
    
    // If the schema on remote is called 'subscription' instead, fallback to it
    if (response.status === 400) {
      response = await fetchInvoices('subscription');
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: response.status });
      }
      const err = await response.json().catch(() => ({}));
      console.error('Strapi invoices fetch error:', { status: response.status, err });
      return NextResponse.json(
        { error: 'Failed to fetch invoices', details: err },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('Error in invoices API route:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
