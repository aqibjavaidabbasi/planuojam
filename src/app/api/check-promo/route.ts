import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logApiEvent } from '@/utils/subscriptionLogger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
type PromotionCodeWithCoupon = Stripe.PromotionCode & { coupon?: string | Stripe.Coupon };

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const normalizedCode = typeof code === 'string' ? code.trim() : '';

    console.log('[check-promo] validation request received', {
      hasCode: Boolean(normalizedCode),
      code: normalizedCode,
    });

    if (!normalizedCode) {
      console.warn('[check-promo] missing promotion code');
      return NextResponse.json(
        { error: 'Promotion code is required' },
        { status: 400 }
      );
    }

    // Look up promotion code by code
    const promo = await stripe.promotionCodes.list({
      code: normalizedCode,
      active: true,
      limit: 1,
    });

    const firstPromo = promo.data[0] as PromotionCodeWithCoupon | undefined;

    console.log('[check-promo] Stripe promotion code lookup completed', {
      code: normalizedCode,
      resultCount: promo.data.length,
      firstPromoId: firstPromo?.id || '',
      firstPromoActive: firstPromo?.active,
      firstCouponId: firstPromo?.coupon
        ? typeof firstPromo.coupon === 'string'
          ? firstPromo.coupon
          : firstPromo.coupon.id
        : '',
    });

    if (promo.data.length === 0) {
      await logApiEvent(
        "error",
        `Invalid promo code: ${normalizedCode}`,
        { severity: "info", rawMeta: { code: normalizedCode } }
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
      `Valid promo code: ${normalizedCode}`,
      { severity: "info", rawMeta: { code: normalizedCode, promoId: promotionCode.id } }
    );

    console.log('[check-promo] promotion code validated', {
      code: normalizedCode,
      promoId: promotionCode.id,
      couponId: couponDetails?.id,
      percentOff: couponDetails?.percent_off,
      amountOff: couponDetails?.amount_off,
      duration: couponDetails?.duration,
    });

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
