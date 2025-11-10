import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const listingDocId = searchParams.get('listingDocId');

    if (!userId && !listingDocId) {
      return NextResponse.json(
        { error: 'Either userId or listingDocId is required' },
        { status: 400 }
      );
    }

    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions?`;
    const filters: string[] = [];

    if (userId) {
      filters.push(`filters[users_permissions_user][documentId][$eq]=${encodeURIComponent(userId)}`);
    }

    if (listingDocId) {
      filters.push(`filters[listingDocId][$eq]=${encodeURIComponent(listingDocId)}`);
    }

    // Only get active subscriptions
    filters.push(`filters[subscriptionStatus][$in][0]=active`);
    filters.push(`filters[subscriptionStatus][$in][1]=past_due`);

    url += filters.join('&');

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const json = await res.json();
    const subscriptions = Array.isArray(json?.data) ? json.data : [];

    return NextResponse.json({
      subscriptions,
      hasActiveSubscription: subscriptions.length > 0,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Subscription status error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error('Subscription status error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
