import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { randomBytes } from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const STRAPI_API_URL = process.env.NEXT_PUBLIC_API_URL!;
const STRAPI_AUTH_HEADERS = {
  Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
};

type SellerInvoiceDetailEntry = {
  companyName?: string;
  address?: string;
  companyId?: string;
  vatNumber?: string;
};

type BuyerInvoiceInformationEntry = {
  companyName?: string;
  companyId?: string;
  companyVAT?: string;
  companyAddress?: string;
  contactPerson?: string;
  individualName?: string;
  individualSurname?: string;
  registrationAddress?: string;
};

type StrapiUserEntry = {
  id?: number;
  documentId?: string;
  username?: string;
  email?: string;
  invoiceCustomerType?: "individual" | "company" | null;
};

type StrapiListingEntry = {
  title?: string;
};

function createPublicInvoiceToken() {
  return randomBytes(24).toString("hex");
}

function getPublicAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function buildPublicInvoiceUrl(publicToken: string) {
  return `${getPublicAppUrl()}/en/invoice/${publicToken}`;
}

async function fetchStrapiJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: STRAPI_AUTH_HEADERS,
      cache: "no-store",
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function buildPromotionInvoiceNumber(paymentIntentId: string) {
  return `PROMO-${paymentIntentId.slice(-8).toUpperCase()}`;
}

async function createPromotionInvoice(params: {
  intent: Stripe.PaymentIntent;
  userId: string;
  listingDocumentId: string;
  listingTitle?: string;
  promotionStars: string;
  promotionDays: string;
  amount: number;
}) {
  const {
    intent,
    userId,
    listingDocumentId,
    listingTitle,
    promotionStars,
    promotionDays,
    amount,
  } = params;

  const invoiceId = `promotion_${intent.id}`;

  const existingInvoice = await fetchStrapiJson<{ data?: Array<{ id: number }> }>(
    `${STRAPI_API_URL}/api/invoices?filters[stripeInvoiceId][$eq]=${encodeURIComponent(invoiceId)}`,
  );

  if (Array.isArray(existingInvoice?.data) && existingInvoice.data.length > 0) {
    console.warn("Promotion invoice already exists:", invoiceId);
    return;
  }

  const paymentDate = new Date();
  const daysInt = Math.max(1, parseInt(String(promotionDays), 10) || 1);
  const starsInt = Math.max(0, parseInt(String(promotionStars), 10) || 0);
  const periodEnd = new Date(Date.UTC(
    paymentDate.getUTCFullYear(),
    paymentDate.getUTCMonth(),
    paymentDate.getUTCDate(),
  ));
  periodEnd.setUTCDate(periodEnd.getUTCDate() + daysInt - 1);

  const [sellerInvoiceDetail, listingResponse, userResponse, buyerInvoiceInformation] = await Promise.all([
    fetchStrapiJson<{ data?: SellerInvoiceDetailEntry }>(
      `${STRAPI_API_URL}/api/seller-invoice-detail`,
    ),
    fetchStrapiJson<{ data?: StrapiListingEntry }>(
      `${STRAPI_API_URL}/api/listings/${listingDocumentId}?populate=*`,
    ),
    fetchStrapiJson<StrapiUserEntry>(`${STRAPI_API_URL}/api/users/${encodeURIComponent(String(userId))}`),
    fetchStrapiJson<{ data?: BuyerInvoiceInformationEntry[] }>(
      `${STRAPI_API_URL}/api/buyer-invoice-informations?filters[users_permissions_user][id][$eq]=${encodeURIComponent(String(userId))}`,
    ),
  ]);

  const sellerSnapshot = sellerInvoiceDetail?.data || {};
  const buyerSnapshot = buyerInvoiceInformation?.data?.[0] || {};
  const resolvedListingTitle = listingResponse?.data?.title || listingTitle || null;
  const buyerCustomerType = userResponse?.invoiceCustomerType || null;
  const individualFullName = [
    buyerSnapshot.individualName,
    buyerSnapshot.individualSurname,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
  const buyerName =
    individualFullName ||
    buyerSnapshot.contactPerson ||
    userResponse?.username ||
    null;
  const buyerAddress =
    buyerSnapshot.registrationAddress ||
    buyerSnapshot.companyAddress ||
    null;

  const publicToken = createPublicInvoiceToken();
  const hostedUrl = buildPublicInvoiceUrl(publicToken);

  const createInvoiceRes = await fetch(`${STRAPI_API_URL}/api/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...STRAPI_AUTH_HEADERS,
    },
    body: JSON.stringify({
      data: {
        stripeInvoiceId: invoiceId,
        invoiceNumber: buildPromotionInvoiceNumber(intent.id),
        invoiceType: "promotion",
        promotionStars: starsInt,
        promotionDays: daysInt,
        amount,
        currency: intent.currency,
        invoiceStatus: "paid",
        hostedUrl,
        periodStart: paymentDate.toISOString(),
        periodEnd: periodEnd.toISOString(),
        publicToken,
        buyerName,
        buyerEmail: userResponse?.email || null,
        buyerAddress,
        buyerCustomerType,
        buyerIndividualName: buyerSnapshot.individualName || null,
        buyerIndividualSurname: buyerSnapshot.individualSurname || null,
        buyerRegistrationAddress: buyerSnapshot.registrationAddress || null,
        buyerCompanyName: buyerSnapshot.companyName || null,
        buyerCompanyId: buyerSnapshot.companyId || null,
        buyerCompanyVAT: buyerSnapshot.companyVAT || null,
        buyerCompanyAddress: buyerSnapshot.companyAddress || null,
        buyerContactPerson: buyerSnapshot.contactPerson || null,
        listingTitle: resolvedListingTitle,
        SubscriptionTitle: null,
        sellerCompanyName: sellerSnapshot.companyName || null,
        sellerAddress: sellerSnapshot.address || null,
        sellerCompanyId: sellerSnapshot.companyId || null,
        sellerVatNumber: sellerSnapshot.vatNumber || null,
        userDocumentId: userResponse?.documentId || null,
        listingDocId: listingDocumentId,
      },
    }),
  });

  if (!createInvoiceRes.ok) {
    const err = await createInvoiceRes.json().catch(() => ({}));
    console.warn("Failed to create promotion invoice:", err);
    return;
  }

  const recipientEmail = userResponse?.email;
  const invoiceNumber = buildPromotionInvoiceNumber(intent.id);
  if (recipientEmail) {
    try {
      console.log("Sending promotion invoice email to:", recipientEmail);
      await fetch(`${getPublicAppUrl()}/api/email/notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "invoice",
          to: recipientEmail,
          subject: `Your invoice ${invoiceNumber} is ready`,
          locale: "en",
          data: {
            username: buyerName || recipientEmail,
            invoiceNumber,
            invoiceUrl: hostedUrl,
          },
        }),
      });
    } catch (emailErr) {
      console.warn("Failed to send promotion invoice email:", emailErr);
    }
  }
}

// Ensure Node.js runtime for Stripe's SDK compatibility
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Read the raw text body for Stripe signature verification
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  console.log("promotion webhook triggered successfully")

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

  console.log("event type --->", event.type);

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

        let transactionAlreadyRecorded = false;

        // Idempotency: skip transaction create if it already exists, but still allow
        // promotion invoice creation below in case an older webhook run created only
        // the transaction.
        try {
          const url = `${STRAPI_API_URL}/api/transactions?filters[transactionChargeId][$eq]=${encodeURIComponent(intent.id)}`;
          const checkRes = await fetch(url, {
            headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
          });
          const checkJson = await checkRes.json().catch(() => ({}));
          if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
            console.warn("Transaction already recorded:", intent.id);
            transactionAlreadyRecorded = true;
          }
        } catch (e) {
          console.warn("Idempotency check errored, continuing:", e);
        }

        // Determine starsPurchased based on purpose/metadata
        const starsPurchasedInt = (purpose === 'promotion' && promotionStars)
          ? parseInt(String(promotionStars))
          : 0;

        if (!transactionAlreadyRecorded) {
          // Save Transaction to Strapi (conform to schema)
          const res = await fetch(`${STRAPI_API_URL}/api/transactions`, {
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
        }

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
            const promoRes = await fetch(`${STRAPI_API_URL}/api/promotions`, {
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
              const starRes = await fetch(`${STRAPI_API_URL}/api/star-usage-logs`, {
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

            await createPromotionInvoice({
              intent,
              userId: String(userId),
              listingDocumentId: String(listingDocumentId),
              listingTitle: listingTitle ? String(listingTitle) : undefined,
              promotionStars: String(promotionStars),
              promotionDays: String(promotionDays),
              amount,
            });
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
