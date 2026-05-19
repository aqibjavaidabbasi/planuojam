import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logApiEvent } from '@/utils/subscriptionLogger';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
type PromotionCodeWithCoupon = Stripe.PromotionCode & { coupon?: string | Stripe.Coupon };

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
      promoCodeId,
    } = await req.json();

    if (!userId || !stripePriceId || !listingDocId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, stripePriceId, listingDocId' },
        { status: 400 }
      );
    }

    console.log('[subscription-checkout] request received', {
      userId,
      listingDocId,
      stripePriceId,
      hasPromoCode: Boolean(promoCode),
      promoCode: promoCode || '',
      promoCodeId: promoCodeId || '',
    });

    // Resolve promotion code. If it cannot be resolved, checkout continues at full price.
    let discount: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    let promoCodeValid = false;
    let resolvedPromoCodeId = '';

    if (promoCodeId || promoCode) {
      try {
        if (promoCodeId) {
          const promo = await stripe.promotionCodes.retrieve(String(promoCodeId)) as PromotionCodeWithCoupon;
          console.log('[subscription-checkout] promotion code retrieved by id', {
            promoCodeId: promo.id,
            code: promo.code,
            active: promo.active,
            couponId: typeof promo.coupon === 'string' ? promo.coupon : promo.coupon?.id,
          });

          if (promo.active) {
            discount = [{ promotion_code: promo.id }];
            resolvedPromoCodeId = promo.id;
            promoCodeValid = true;
          }
        }

        if (!promoCodeValid && promoCode) {
          const promo = await stripe.promotionCodes.list({
            code: String(promoCode).trim(),
            active: true,
            limit: 1,
          });

          console.log('[subscription-checkout] promotion code lookup by code', {
            promoCode,
            resultCount: promo.data.length,
            firstPromoId: promo.data[0]?.id || '',
            firstPromoActive: promo.data[0]?.active,
          });

          if (promo.data.length > 0) {
            discount = [{ promotion_code: promo.data[0].id }];
            resolvedPromoCodeId = promo.data[0].id;
            promoCodeValid = true;
          }
        }
      } catch (promoError) {
        console.warn('[subscription-checkout] promo resolution failed; continuing without discount', {
          promoCode: promoCode || '',
          promoCodeId: promoCodeId || '',
          error: promoError instanceof Error ? promoError.message : String(promoError),
        });
        promoCodeValid = false;
        discount = undefined;
      }
    }

    const createSession = async (sessionDiscounts?: Stripe.Checkout.SessionCreateParams.Discount[]) => {
      return stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        discounts: sessionDiscounts,
        metadata: {
          userId: String(userId),
          listingDocId: String(listingDocId),
          listingTitle: listingTitle ? String(listingTitle) : '',
          promoCode: promoCode || '',
          promoCodeId: resolvedPromoCodeId,
        },
        subscription_data: {
          metadata: {
            userId: String(userId),
            listingDocId: String(listingDocId),
            listingTitle: listingTitle ? String(listingTitle) : '',
            promoCode: promoCode || '',
            promoCodeId: resolvedPromoCodeId,
          },
        },
        success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=my-listings`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=my-listings`,
      });
    };

    // Create Checkout Session. If Stripe rejects the resolved discount, retry silently without it.
    let session: Stripe.Checkout.Session;
    try {
      session = await createSession(discount);
    } catch (checkoutError) {
      if (discount) {
        console.warn('[subscription-checkout] checkout rejected discount; retrying without discount', {
          promoCode: promoCode || '',
          promoCodeId: resolvedPromoCodeId,
          error: checkoutError instanceof Error ? checkoutError.message : String(checkoutError),
        });
        discount = undefined;
        promoCodeValid = false;
        session = await createSession(undefined);
      } else {
        throw checkoutError;
      }
    }

    console.log('[subscription-checkout] checkout session created', {
      sessionId: session.id,
      listingDocId,
      promoCode: promoCode || '',
      promoCodeId: resolvedPromoCodeId,
      promoCodeApplied: promoCodeValid,
      discountsRequested: discount?.length || 0,
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
          promoCodeId: resolvedPromoCodeId,
          promoCodeApplied: promoCodeValid,
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
