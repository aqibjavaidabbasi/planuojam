import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logApiEvent } from '@/utils/subscriptionLogger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Promotion code is required' },
        { status: 400 }
      );
    }

    // Look up promotion code by code
    const promo = await stripe.promotionCodes.list({
      code: code.trim(),
      active: true,
      limit: 1,
    });

    if (promo.data.length === 0) {
      await logApiEvent(
        "error",
        `Invalid promo code: ${code}`,
        { severity: "info", rawMeta: { code } }
      );
      
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired promotion code'
      });
    }

    const promotionCode = promo.data[0];
    
    // Get coupon details from the promotion code
    // The coupon object is already included in the promotion code from the list operation
    const couponDetails = (promotionCode as Stripe.PromotionCode & { coupon: Stripe.Coupon }).coupon;

    await logApiEvent(
      "listing_published",
      `Valid promo code: ${code}`,
      { severity: "info", rawMeta: { code, promoId: promotionCode.id } }
    );

    return NextResponse.json({
      valid: true,
      details: {
        id: promotionCode.id,
        code: promotionCode.code,
        coupon: couponDetails,
        maxRedemptions: promotionCode.max_redemptions,
        timesRedeemed: promotionCode.times_redeemed,
        expiresAt: promotionCode.expires_at,
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await logApiEvent("error", `Promo validation failed: ${errorMessage}`, {
      severity: "error",
      rawMeta: { error: errorMessage }
    });

    return NextResponse.json(
      { error: 'Failed to validate promotion code' },
      { status: 500 }
    );
  }
}
