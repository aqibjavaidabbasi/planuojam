import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const {
      userId,
      amount,
      currency,
      // Optional promotion checkout metadata
      purpose, // 'buy_stars' | 'promotion'
      listingDocumentId,
      listingTitle,
      promotionStars,
      promotionDays,
    } = await req.json();

    if (!userId || amount == null || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Stripe expects the smallest currency unit (e.g., cents)
    const adjustedAmount = Math.round(Number(amount) * 100);

    // Build metadata with only string values; omit undefineds
    const metadata: Record<string, string> = {
      app_user_id: String(userId),
    };
    if (purpose) metadata.purpose = String(purpose);
    if (listingDocumentId) metadata.listing_document_id = String(listingDocumentId);
    if (listingTitle) metadata.listing_title = String(listingTitle);
    if (promotionStars != null) metadata.promotion_stars = String(promotionStars);
    if (promotionDays != null) metadata.promotion_days = String(promotionDays);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: adjustedAmount,
      currency: String(currency).toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Stripe Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }else {
      console.error('Stripe Error:', error);
      return NextResponse.json({ error: error || 'Server error' }, { status: 500 });
    }
  }
}
