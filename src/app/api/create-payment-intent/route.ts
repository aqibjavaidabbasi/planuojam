import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { userId, amount, currency, packageId, starsBought } = await req.json();

    if (!userId || amount == null || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Stripe expects the smallest currency unit (e.g., cents)
    const adjustedAmount = Math.round(Number(amount) * 100);

    // Build metadata with only string values; omit undefineds
    const metadata: Record<string, string> = {
      app_user_id: String(userId),
    };
    if (packageId != null) metadata.package_id = String(packageId);
    if (starsBought != null) metadata.stars_bought = String(starsBought);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: adjustedAmount,
      currency: String(currency).toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Stripe Error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
