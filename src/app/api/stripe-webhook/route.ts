import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Ensure Node.js runtime for Stripe's SDK compatibility
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Read the raw text body for Stripe signature verification
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Extract PaymentIntent
  const intent = event.data.object as Stripe.PaymentIntent;

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        // Payment succeeded
        const userId = intent.metadata?.app_user_id;
        const purpose = intent.metadata?.purpose; // 'buy_stars' | 'promotion'
        const listingDocumentId = intent.metadata?.listing_document_id;
        const listingTitle = intent.metadata?.listing_title;
        const promotionStars = intent.metadata?.promotion_stars;
        const promotionDays = intent.metadata?.promotion_days;
        const amount = intent.amount_received / 100;

        // Idempotency: skip if transaction already exists
        try {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/transactions?filters[transactionChargeId][$eq]=${encodeURIComponent(intent.id)}`;
          const checkRes = await fetch(url, {
            headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
          });
          const checkJson = await checkRes.json().catch(() => ({}));
          if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
            console.warn("Transaction already recorded:", intent.id);
            return NextResponse.json({ received: true });
          }
        } catch (e) {
          console.warn("Idempotency check errored, continuing:", e);
        }

        // Determine starsPurchased based on purpose/metadata
        const starsPurchasedInt = (purpose === 'promotion' && promotionStars)
          ? parseInt(String(promotionStars))
          : 0;

        // Save Transaction to Strapi (conform to schema)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
          },
          body: JSON.stringify({
            data: {
              users_permissions_user: userId,
              transactionChargeId: intent.id,
              amount,
              starsPurchased: starsPurchasedInt,
              transactionStatus: "success",
              transactionDate: new Date().toISOString(),
            },
          }),
        });
        await res.json();

        // If this payment was for a promotion checkout, create the promotion now
        if (
          purpose === 'promotion' &&
          userId &&
          listingDocumentId &&
          promotionStars &&
          promotionDays
        ) {
          try {
            // Compute inclusive end date: startDate + (days - 1)
            const startDate = new Date();
            const startDateStr = startDate.toISOString().slice(0, 10); // YYYY-MM-DD
            const daysInt = parseInt(String(promotionDays));
            const end = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
            end.setUTCDate(end.getUTCDate() + Math.max(0, daysInt - 1));
            const endDateStr = end.toISOString().slice(0, 10); // YYYY-MM-DD

            // Create promotion in Strapi according to schema (use listingDocumentId)
            const promoRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/promotions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
              },
              body: JSON.stringify({
                data: {
                  startDate: startDateStr,
                  endDate: endDateStr,
                  promotionStatus: "ongoing",
                  maxStarsLimit: parseInt(String(promotionStars)),
                  listingDocumentId: String(listingDocumentId),
                  userDocId: String(userId),
                  starsUsed: 0,
                  clicksReceived: 0,
                  listingTitle: listingTitle ? String(listingTitle) : undefined,
                },
              }),
            });
            // Ignore non-200 but log
            let createdPromotionId: number | undefined;
            if (!promoRes.ok) {
              const err = await promoRes.json().catch(() => ({}));
              console.warn("Failed to create promotion after payment:", err);
            } else {
              const promoJson = await promoRes.json().catch(() => ({}));
              createdPromotionId = Number(promoJson?.data?.id ?? promoJson?.id);
            }

            // Create a star-usage-log entry to credit stars for this promotion purchase (use listingDocumentId)
            try {
              const starRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/star-usage-logs`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
                },
                body: JSON.stringify({
                  data: {
                    starsUsed: parseInt(String(promotionStars)),
                    type: "credit",
                    usedAt: new Date().toISOString(),
                    users_permissions_user: String(userId),
                    listingDocumentId: String(listingDocumentId),
                    promotion: createdPromotionId,
                    listingTitle: listingTitle ? String(listingTitle) : undefined,
                  },
                }),
              });
              await starRes.json();
            } catch (e) {
              console.warn("Failed to create star-usage-log (promotion credit)", e);
            }
          } catch (e) {
            console.warn("Promotion creation request failed:", e);
          }
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const userId = intent.metadata?.app_user_id;
        const amount = intent.amount / 100;

        // Idempotency: skip if failed transaction already exists
        try {
          const checkRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/transactions?filters[transactionChargeId][$eq]=${encodeURIComponent(intent.id)}`,
            {
              headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
            }
          );
          const checkJson = await checkRes.json().catch(() => ({}));
          if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
            console.warn("Failed transaction already recorded, skipping create.", intent.id);
            return NextResponse.json({ received: true });
          }
        } catch (e) {
          console.warn("Transaction idempotency check (failed) errored, proceeding:", e);
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
          },
          body: JSON.stringify({
            data: {
              users_permissions_user: userId,
              transactionChargeId: intent.id,
              amount,
              starsPurchased: 0,
              transactionStatus: "failed",
              transactionDate: new Date().toISOString(),
            },
          }),
        });
        await res.json().catch(() => ({}));
        break;
      }

      default:
        console.warn(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error handling webhook:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
