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
      promoCode,
    } = await req.json();

    if (!userId || !stripePriceId || !listingDocId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, stripePriceId, listingDocId' },
        { status: 400 }
      );
    }

    // Validate promotion code (proper Stripe usage)
    let discount;
    let promoCodeValid = false;

    if (promoCode) {
      try {
        const promo = await stripe.promotionCodes.list({
          code: promoCode,
          active: true,
          limit: 1,
        });

        if (promo.data.length > 0) {
          discount = [{ promotion_code: promo.data[0].id }];
          promoCodeValid = true;
        }
      } catch {
        promoCodeValid = false;
      }
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      discounts: discount,
      metadata: {
        userId: String(userId),
        listingDocId: String(listingDocId),
        listingTitle: listingTitle ? String(listingTitle) : '',
        promoCode: promoCode || '',
      },
      subscription_data: {
        metadata: {
          userId: String(userId),
          listingDocId: String(listingDocId),
          listingTitle: listingTitle ? String(listingTitle) : '',
          promoCode: promoCode || '',
        },
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=my-listings`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=my-listings`,
    });

    // Logging
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
          promoCode: promoCode || '',
        },
      }
    );

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
      promoCodeApplied: promoCodeValid,
      message: promoCodeValid ? 'Promo code applied successfully' : promoCode ? 'Invalid promo code - full price charged' : undefined
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      await logApiEvent("error", `Subscription checkout failed: ${error.message}`, {
        severity: "error",
        rawMeta: { error: error.message },
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logApiEvent("error", "Subscription checkout failed", {
      severity: "error",
      rawMeta: { error: String(error) },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
