import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StrapiItem<T> {
  id: number;
  attributes: T;
}

interface StrapiCollectionResponse<T> {
  data: StrapiItem<T>[];
  meta?: unknown;
}

type Interval = 'one_time' | 'month' | 'year';
type Badge = 'basic' | 'featured' | 'premium';

export interface StripeProductAttributes {
  title: string;
  description?: string | null;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  price: number;
  interval?: Interval | null;
  is_active?: boolean;
  badge?: Badge | null;
  documentId: string;
  currency?: string;
  minListingPrice?: number;
  maxListingPrice?: number;
}

export async function GET() {
  try {
    if (!API_URL || !STRAPI_TOKEN) {
      return NextResponse.json(
        { error: 'Server misconfiguration: missing API_URL or STRAPI token' },
        { status: 500 }
      );
    }

    const url = `${API_URL}/api/stripe-products?filters[is_active][$eq]=true`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const json = (await res.json()) as StrapiCollectionResponse<StripeProductAttributes>;

    const products = Array.isArray(json) ? json.data : json;

    return NextResponse.json(products);
  } catch (err) {
    console.error('stripe-products endpoint error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
