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
        const stripeCustomerId = intent.customer;
        const userId = intent.metadata?.app_user_id;
        const starsBought = intent.metadata?.stars_bought;
        const amount = intent.amount_received / 100;

        // Idempotency: skip if transaction already exists
        try {
          const checkRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/transactions?filters[transactionChargeId][$eq]=${encodeURIComponent(intent.id)}`,
            {
              headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
            }
          );
          const checkJson = await checkRes.json().catch(() => ({}));
          if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
            console.warn("Transaction already recorded, skipping create and user update.", intent.id);
            return NextResponse.json({ received: true });
          }
        } catch (e) {
          console.warn("Transaction idempotency check failed, proceeding:", e);
        }

        // Save to Strapi
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
              starsPurchased: parseInt(starsBought || "0"),
              transactionStatus: "success",
              transactionDate: new Date().toISOString(),
            },
          }),
        });
        await res.json().catch(() => ({}));

        // Star accumulation: fetch current totalStars and add starsBought
        if (userId) {
          const userGet = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
          });
          const userData = await userGet.json().catch(() => ({}));
          const currentStars = Number(userData?.totalStars ?? 0);
          const addStars = parseInt(starsBought || "0");
          const newTotal = currentStars + (isNaN(addStars) ? 0 : addStars);

          // Also update the user's stars or balance in Strapi
          const user = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
          },
          body: JSON.stringify({
            stripeCustomerId: typeof stripeCustomerId === "string" ? stripeCustomerId : undefined,
            totalStars: newTotal,
          }),
          });
          await user.json().catch(() => ({}));

          // Create a star-usage-log entry for crediting stars into the account
          if (!isNaN(addStars) && addStars > 0) {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/star-usage-logs`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
                },
                body: JSON.stringify({
                  data: {
                    starsUsed: addStars,
                    type: "credit",
                    usedAt: new Date().toISOString(),
                    users_permissions_user: userId,
                    // Optional: listing / promotion left null for pure credit events
                  },
                }),
              });
            } catch (e) {
              console.warn("Failed to create star-usage-log (credit)", e);
            }
          }
        } else {
          console.warn("No userId provided in PaymentIntent metadata; skipping star update.");
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

       const res= await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
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
