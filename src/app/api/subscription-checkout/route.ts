import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logApiEvent } from '@/utils/subscriptionLogger';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const {
      userId,
      stripePriceId,
      listingDocId,
      listingTitle,
      successUrl,
      cancelUrl,
    } = await req.json();

    if (!userId || !stripePriceId || !listingDocId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, stripePriceId, listingDocId' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: String(userId),
        listingDocId: String(listingDocId),
        listingTitle: listingTitle ? String(listingTitle) : '',
      },
      subscription_data: {
        metadata: {
          userId: String(userId),
          listingDocId: String(listingDocId),
          listingTitle: listingTitle ? String(listingTitle) : '',
        },
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=my-listings`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=my-listings`,
    });

    // Log checkout session creation
    await logApiEvent(
      "subscription_created",
      `Checkout session created for listing: ${listingDocId}`,
      {
        severity: "info",
        userId,
        listingDocId,
        rawMeta: {
          sessionId: session.id,
          stripePriceId,
          listingTitle,
        },
      }
    );

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Subscription checkout error:', error.message);
      await logApiEvent("error", `Subscription checkout failed: ${error.message}`, {
        severity: "error",
        rawMeta: { error: error.message },
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error('Subscription checkout error:', error);
    await logApiEvent("error", "Subscription checkout failed", {
      severity: "error",
      rawMeta: { error: String(error) },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
