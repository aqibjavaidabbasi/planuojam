import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logApiEvent } from '@/utils/subscriptionLogger';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { subscriptionId, cancelAtPeriodEnd = true } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required field: subscriptionId' },
        { status: 400 }
      );
    }

    // Cancel the subscription in Stripe
    let subscription: Stripe.Subscription;
    
    if (cancelAtPeriodEnd) {
      // Cancel at period end (recommended - user keeps access until end of billing period)
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    }

    // Update subscription in Strapi
    const findUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
    const findRes = await fetch(findUrl, {
      headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
    });
    const findJson = await findRes.json().catch(() => ({}));

    if (Array.isArray(findJson?.data) && findJson.data.length > 0) {
      const existingSubscription = findJson.data[0];
      const documentId = existingSubscription.documentId;
      const userId = existingSubscription.users_permissions_user?.id || existingSubscription.users_permissions_user;
      const listingDocId = existingSubscription.listingDocId;

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/${documentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
          },
          body: JSON.stringify({
            data: {
              subscriptionStatus: subscription.status,
              autoRenew: false,
            },
          }),
        }
      );

      // Log the cancellation
      await logApiEvent(
        "subscription_canceled",
        `Subscription ${cancelAtPeriodEnd ? 'scheduled for cancellation' : 'canceled immediately'}: ${subscriptionId}`,
        {
          severity: "info",
          userId,
          listingDocId,
          rawMeta: {
            subscriptionId,
            cancelAtPeriodEnd,
            status: subscription.status,
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Subscription cancellation error:', error.message);
      await logApiEvent("error", `Subscription cancellation failed: ${error.message}`, {
        severity: "error",
        rawMeta: { error: error.message },
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error('Subscription cancellation error:', error);
    await logApiEvent("error", "Subscription cancellation failed", {
      severity: "error",
      rawMeta: { error: String(error) },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
