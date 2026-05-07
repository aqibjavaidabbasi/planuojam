import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { randomBytes } from "crypto";
import { logWebhookEvent } from "@/utils/subscriptionLogger";

type WebhookSubscription = Stripe.Subscription & {
  current_period_end?: number;
  cancel_at_period_end?: boolean;
};

type WebhookInvoice = Stripe.Invoice & {
  subscription?: string | null | { id: string };
};

type InvoiceWithParent = Stripe.Invoice & {
  parent?: {
    subscription_details?: {
      subscription?: string | null;
    };
  };
};

type InvoiceLineWithParent = Stripe.InvoiceLineItem & {
  parent?: {
    subscription_item_details?: {
      subscription?: string | null;
    };
  };
};

type InvoiceLineWithPrice = Stripe.InvoiceLineItem & {
  price?: {
    recurring?: {
      interval?: string | null;
    } | null;
  } | null;
};

type InvoiceWithCustomerDetails = Stripe.Invoice & {
  customer_name?: string | null;
  customer_email?: string | null;
  customer_address?: Stripe.Address | null;
};

type StrapiSubscriptionEntry = {
  documentId: string;
  listingDocId?: string;
  users_permissions_user?: number | { id?: number; documentId?: string } | null;
};

type StrapiUserEntry = {
  id?: number;
  documentId?: string;
  username?: string;
  email?: string;
  preferredLanguage?: string | null;
  invoiceCustomerType?: "individual" | "company" | null;
};

type StrapiListingEntry = {
  title?: string;
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

type NotificationPayload = {
  type: "subscription" | "invoice";
  to: string;
  subject: string;
  locale?: string | null;
  data: Record<string, unknown>;
  stripeEventId?: string;
  rawMeta?: Record<string, unknown>;
};

type SubscriptionInvoiceResult = {
  invoiceDocumentId?: string;
  invoiceNumber: string;
  hostedUrl: string;
  buyerEmail?: string | null;
  userEmail?: string | null;   // registered account email — used for notifications
  username?: string | null;
  locale?: string | null;
  created: boolean;
  subscriptionDocId?: string;
  userId?: number | string | null;
  listingDocId?: string | null;
};

const STRAPI_API_URL = process.env.NEXT_PUBLIC_API_URL!;
const STRAPI_AUTH_HEADERS = {
  Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
};

function createPublicInvoiceToken() {
  return randomBytes(24).toString("hex");
}

function getPublicAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://planuojam.lt"
  ).replace(/\/$/, "");
}

function buildPublicInvoiceUrl(publicToken: string) {
  return `${getPublicAppUrl()}/en/invoice/${publicToken}`;
}

function formatStripeAddress(address?: Stripe.Address | null) {
  if (!address) return null;

  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

async function fetchStrapiJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: STRAPI_AUTH_HEADERS,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function normalizeEmailLocale(locale?: string | null) {
  const normalized = (locale || "en").toLowerCase().split("-")[0];
  return ["en", "lt", "ru", "pl", "et"].includes(normalized) ? normalized : "en";
}

function normalizeSubscriptionInterval(interval?: string | null) {
  return interval === "month" || interval === "year" || interval === "one_time"
    ? interval
    : null;
}

function getSubscriptionSubject(locale?: string | null) {
  const subjects: Record<string, string> = {
    en: "Your listing is now active!",
    lt: "J\u016bs\u0173 skelbimas dabar aktyvus!",
    ru: "\u0412\u0430\u0448\u0435 \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u0435 \u0442\u0435\u043f\u0435\u0440\u044c \u0430\u043a\u0442\u0438\u0432\u043d\u043e!",
    pl: "Twoje og\u0142oszenie jest ju\u017c aktywne!",
    et: "Teie kuulutus on n\u00fc\u00fcd aktiivne!",
  };

  return subjects[normalizeEmailLocale(locale)];
}

function getInvoiceSubject(invoiceNumber: string, locale?: string | null) {
  const subjects: Record<string, string> = {
    en: `Your invoice ${invoiceNumber} is ready`,
    lt: `J\u016bs\u0173 s\u0105skaita ${invoiceNumber} paruo\u0161ta`,
    ru: `\u0412\u0430\u0448 \u0441\u0447\u0435\u0442 ${invoiceNumber} \u0433\u043e\u0442\u043e\u0432`,
    pl: `Twoja faktura ${invoiceNumber} jest gotowa`,
    et: `Teie arve ${invoiceNumber} on valmis`,
  };

  return subjects[normalizeEmailLocale(locale)];
}

async function sendAppNotification({
  type,
  to,
  subject,
  locale,
  data,
  stripeEventId,
  rawMeta,
}: NotificationPayload) {
  const url = `${getPublicAppUrl()}/api/email/notification`;
  console.log(`sendAppNotification: type=${type}, to=${to}, url=${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        to,
        subject,
        locale: normalizeEmailLocale(locale),
        data,
      }),
    });
    const responseBody = await response.text().catch(() => "");

    if (!response.ok) {
      console.error(`Failed to send ${type} email:`, response.status, responseBody);
      await logWebhookEvent("error", `Failed to send ${type} email`, {
        severity: "error",
        stripeEventId,
        rawMeta: {
          to,
          url,
          status: response.status,
          responseBody,
          ...rawMeta,
        },
      });
      return false;
    }

    await logWebhookEvent("webhook_received", `${type} email sent`, {
      severity: "info",
      stripeEventId,
      rawMeta: { to, responseBody, ...rawMeta },
    });
    return true;
  } catch (error) {
    console.error(`Error sending ${type} email:`, error);
    await logWebhookEvent("error", `Error sending ${type} email`, {
      severity: "error",
      stripeEventId,
      rawMeta: { to, url, error: String(error), ...rawMeta },
    });
    return false;
  }
}

async function createOrGetSubscriptionInvoice(
  invoice: WebhookInvoice,
  subscriptionId: string,
  stripeEventId: string,
  statusOverride?: string
): Promise<SubscriptionInvoiceResult | null> {
  const findSubUrl = `${STRAPI_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}&populate[users_permissions_user][fields][0]=id&populate[users_permissions_user][fields][1]=documentId`;
  const findSubRes = await fetch(findSubUrl, {
    headers: STRAPI_AUTH_HEADERS,
  });
  const findSubJson = await findSubRes.json().catch(() => ({} as { data?: StrapiSubscriptionEntry[] }));

  let subscriptionEntry: StrapiSubscriptionEntry;

  if (!Array.isArray(findSubJson?.data) || findSubJson.data.length === 0) {
    // Stripe invoice events often arrive before checkout.session.completed has been processed.
    // Recover by fetching the subscription from Stripe and creating the Strapi record on the fly.
    console.warn("Subscription not found in Strapi, recovering from Stripe:", subscriptionId);
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId) as WebhookSubscription;
      const metaUserId = stripeSub.metadata?.userId;
      const metaListingDocId = stripeSub.metadata?.listingDocId;

      if (!metaUserId || !metaListingDocId) {
        console.warn("Stripe subscription missing userId/listingDocId metadata:", subscriptionId);
        await logWebhookEvent("error", `Subscription metadata missing for invoice: ${invoice.id}`, {
          severity: "warning",
          stripeEventId,
          rawMeta: { invoiceId: invoice.id, subscriptionId },
        });
        return null;
      }

      const createSubRes = await fetch(`${STRAPI_API_URL}/api/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...STRAPI_AUTH_HEADERS },
        body: JSON.stringify({
          data: {
            listingDocId: metaListingDocId,
            users_permissions_user: metaUserId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: stripeSub.items.data[0]?.price.id,
            stripeCustomerId: stripeSub.customer as string,
            subscriptionStatus: stripeSub.status,
            currentPeriodEnd: stripeSub.current_period_end
              ? new Date(stripeSub.current_period_end * 1000).toISOString()
              : new Date().toISOString(),
            autoRenew: !stripeSub.cancel_at_period_end,
          },
        }),
      });

      if (createSubRes.ok) {
        const createSubJson = await createSubRes.json().catch(() => ({}));
        console.log("Recovered: created Strapi subscription on-the-fly:", subscriptionId);
        subscriptionEntry = {
          documentId: createSubJson?.data?.documentId ?? "",
          listingDocId: metaListingDocId,
          users_permissions_user: isNaN(Number(metaUserId)) ? (metaUserId as unknown as number) : Number(metaUserId),
        } as StrapiSubscriptionEntry;
      } else {
        // Creation may have failed due to a concurrent duplicate — retry the fetch
        const retryRes = await fetch(findSubUrl, { headers: STRAPI_AUTH_HEADERS });
        const retryJson = await retryRes.json().catch(() => ({} as { data?: StrapiSubscriptionEntry[] }));
        if (Array.isArray(retryJson?.data) && retryJson.data.length > 0) {
          console.log("Found Strapi subscription on retry:", subscriptionId);
          subscriptionEntry = retryJson.data[0] as StrapiSubscriptionEntry;
        } else {
          console.warn("Could not create or find Strapi subscription:", subscriptionId);
          await logWebhookEvent("error", `Subscription not found for invoice: ${invoice.id}`, {
            severity: "warning",
            stripeEventId,
            rawMeta: { invoiceId: invoice.id, subscriptionId },
          });
          return null;
        }
      }
    } catch (recoverErr) {
      console.warn("Failed to recover subscription from Stripe:", recoverErr);
      await logWebhookEvent("error", `Subscription not found for invoice: ${invoice.id}`, {
        severity: "warning",
        stripeEventId,
        rawMeta: { invoiceId: invoice.id, subscriptionId },
      });
      return null;
    }
  } else {
    subscriptionEntry = findSubJson.data[0] as StrapiSubscriptionEntry;
  }
  const subscriptionDocId = subscriptionEntry.documentId;
  const listingDocId = subscriptionEntry.listingDocId || null;
  const userId =
    typeof subscriptionEntry.users_permissions_user === "object"
      ? subscriptionEntry.users_permissions_user?.id
      : subscriptionEntry.users_permissions_user;

  const [existingInvoice, listingResponse, userResponse, buyerInvoiceInformation, sellerInvoiceDetail] = await Promise.all([
    fetchStrapiJson<{ data?: Array<{ documentId?: string; invoiceNumber?: string | null; hostedUrl?: string | null }> }>(
      `${STRAPI_API_URL}/api/invoices?filters[stripeInvoiceId][$eq]=${encodeURIComponent(invoice.id)}`
    ),
    listingDocId
      ? fetchStrapiJson<{ data?: StrapiListingEntry }>(
          `${STRAPI_API_URL}/api/listings/${listingDocId}?populate=*`
        )
      : Promise.resolve(null),
    userId
      ? fetchStrapiJson<StrapiUserEntry>(`${STRAPI_API_URL}/api/users/${userId}`)
      : Promise.resolve(null),
    userId
      ? fetchStrapiJson<{ data?: BuyerInvoiceInformationEntry[] }>(
          `${STRAPI_API_URL}/api/buyer-invoice-informations?filters[users_permissions_user][id][$eq]=${encodeURIComponent(String(userId))}`
        )
      : Promise.resolve(null),
    fetchStrapiJson<{ data?: SellerInvoiceDetailEntry }>(
      `${STRAPI_API_URL}/api/seller-invoice-detail`
    ),
  ]);

  const invoiceNumber = invoice.number || invoice.id;
  const existing = existingInvoice?.data?.[0];

  if (existing?.documentId) {
    if (statusOverride && statusOverride !== invoice.status) {
      await fetch(`${STRAPI_API_URL}/api/invoices/${existing.documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...STRAPI_AUTH_HEADERS,
        },
        body: JSON.stringify({
          data: { invoiceStatus: statusOverride },
        }),
      });
    }

    return {
      invoiceDocumentId: existing.documentId,
      invoiceNumber: existing.invoiceNumber || invoiceNumber,
      hostedUrl: existing.hostedUrl || buildPublicInvoiceUrl(createPublicInvoiceToken()),
      buyerEmail: userResponse?.email || null,
      userEmail: userResponse?.email || null,
      username: userResponse?.username || userResponse?.email || null,
      locale: userResponse?.preferredLanguage || null,
      created: false,
      subscriptionDocId,
      userId,
      listingDocId,
    };
  }

  const invoiceWithCustomerDetails = invoice as InvoiceWithCustomerDetails;
  const publicToken = createPublicInvoiceToken();
  const hostedUrl = buildPublicInvoiceUrl(publicToken);
  const sellerSnapshot = sellerInvoiceDetail?.data || {};
  const buyerSnapshot = buyerInvoiceInformation?.data?.[0] || {};
  const listingTitle = listingResponse?.data?.title || null;
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
    invoiceWithCustomerDetails.customer_name ||
    null;
  const buyerEmail =
    userResponse?.email || invoiceWithCustomerDetails.customer_email || null;
  const buyerAddress =
    buyerSnapshot.registrationAddress ||
    buyerSnapshot.companyAddress ||
    formatStripeAddress(invoiceWithCustomerDetails.customer_address);
  const firstInvoiceLine = invoice.lines?.data?.[0] as InvoiceLineWithPrice | undefined;
  const subscriptionTitle =
    firstInvoiceLine?.description || listingTitle || "Subscription";
  const subscriptionInterval = normalizeSubscriptionInterval(
    firstInvoiceLine?.price?.recurring?.interval,
  );
  const periodStart = invoice.period_start || invoice.created;
  const periodEnd = invoice.period_end || invoice.created;

  const createInvoiceRes = await fetch(`${STRAPI_API_URL}/api/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...STRAPI_AUTH_HEADERS,
    },
    body: JSON.stringify({
      data: {
        stripeInvoiceId: invoice.id,
        invoiceNumber,
        invoiceType: "subscription",
        subscriptions: [subscriptionDocId],
        amount: parseFloat(((invoice.total || invoice.amount_paid || 0) / 100).toFixed(2)),
        currency: invoice.currency,
        invoiceStatus: statusOverride || invoice.status || "open",
        hostedUrl,
        periodStart: new Date(periodStart * 1000).toISOString(),
        periodEnd: new Date(periodEnd * 1000).toISOString(),
        publicToken,
        buyerName,
        buyerEmail,
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
        listingTitle,
        SubscriptionTitle: subscriptionTitle,
        subscriptionInterval,
        sellerCompanyName: sellerSnapshot.companyName || null,
        sellerAddress: sellerSnapshot.address || null,
        sellerCompanyId: sellerSnapshot.companyId || null,
        sellerVatNumber: sellerSnapshot.vatNumber || null,
        userDocumentId: userResponse?.documentId || null,
        listingDocId,
      },
    }),
  });

  if (!createInvoiceRes.ok) {
    const errData = await createInvoiceRes.json().catch(() => ({}));
    console.error("Failed to create Invoice in Strapi:", errData);
    await logWebhookEvent("error", `Failed to create Invoice: ${invoice.id}`, {
      severity: "error",
      stripeEventId,
      rawMeta: { invoiceId: invoice.id, subscriptionId, error: errData },
    });
    return null;
  }

  const createInvoiceJson = await createInvoiceRes.json().catch(() => ({}));
  await logWebhookEvent("payment_succeeded", `Invoice created: ${invoice.id}`, {
    severity: "info",
    stripeEventId,
    rawMeta: { invoiceId: invoice.id, subscriptionId, invoiceNumber },
  });

  return {
    invoiceDocumentId: createInvoiceJson?.data?.documentId,
    invoiceNumber,
    hostedUrl,
    buyerEmail,
    userEmail: userResponse?.email || null,
    username: userResponse?.username || userResponse?.email || buyerName,
    locale: userResponse?.preferredLanguage || null,
    created: true,
    subscriptionDocId,
    userId,
    listingDocId,
  };
}

function extractSubscriptionId(invoice: WebhookInvoice): string | null {
  console.log(`[extractSubscriptionId] Extracting for invoice: ${invoice.id}`);
  
  // 1. Direct field (best case)
  if (typeof invoice.subscription === "string") {
    console.log(`[extractSubscriptionId] Found direct string subscription: ${invoice.subscription}`);
    return invoice.subscription;
  }

  if (
    invoice.subscription &&
    typeof invoice.subscription === "object" &&
    "id" in invoice.subscription
  ) {
    console.log(`[extractSubscriptionId] Found object subscription with id: ${invoice.subscription.id}`);
    return invoice.subscription.id;
  }

  // 2. New Stripe structure (typed safely)
  const invoiceWithParent = invoice as InvoiceWithParent;
  const parentSub = invoiceWithParent.parent?.subscription_details?.subscription;

  if (typeof parentSub === "string") {
    console.log(`[extractSubscriptionId] Found parent details subscription: ${parentSub}`);
    return parentSub;
  }

  // 3. Fallback: line items
  const line = invoice.lines?.data?.[0] as (InvoiceLineWithParent & { subscription?: string | { id: string } }) | undefined;

  if (!line) {
    console.log(`[extractSubscriptionId] No line items found.`);
    return null;
  }

  if (typeof line.subscription === "string") {
    console.log(`[extractSubscriptionId] Found line item subscription string: ${line.subscription}`);
    return line.subscription;
  }

  if (
    line.subscription &&
    typeof line.subscription === "object" &&
    "id" in line.subscription
  ) {
    console.log(`[extractSubscriptionId] Found line item subscription object id: ${line.subscription.id}`);
    return line.subscription.id;
  }

  const nestedLineSub = line.parent?.subscription_item_details?.subscription;

  if (typeof nestedLineSub === "string") {
    console.log(`[extractSubscriptionId] Found nested line parent subscription: ${nestedLineSub}`);
    return nestedLineSub;
  }

  console.log(`[extractSubscriptionId] Could not find subscription ID anywhere in invoice.`);
  return null;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    await logWebhookEvent("error", "Missing stripe-signature header on subscription webhook", {
      severity: "error",
    });
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET!,
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Subscription webhook signature verification failed:", err.message);
      await logWebhookEvent("error", `Webhook signature verification failed: ${err.message}`, {
        severity: "error",
        rawMeta: { error: err.message },
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    console.error("Subscription webhook signature verification failed:", err);
    await logWebhookEvent("error", "Webhook signature verification failed", {
      severity: "error",
      rawMeta: { error: String(err) },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {

        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log("checkout.session.completed received:", session.id, "mode:", session.mode);
        await logWebhookEvent("webhook_received", `Received checkout.session.completed webhook`, {
          severity: "info",
          stripeEventId: event.id,
          rawMeta: { sessionId: session.id, mode: session.mode },
        });
        
        // Only handle subscription checkouts
        if (session.mode !== 'subscription') {
          break;
        }

        const userId = session.metadata?.userId;
        const listingDocId = session.metadata?.listingDocId;
        const subscriptionId = session.subscription as string;

        if (!userId || !listingDocId || !subscriptionId) {
          console.warn('Missing metadata in checkout session:', session.id);
          await logWebhookEvent("error", `Missing metadata in checkout session: ${session.id}`, {
            severity: "warning",
            stripeEventId: event.id,
            rawMeta: { sessionId: session.id, metadata: session.metadata },
          });
          break;
        }

        // Retrieve the subscription to get price details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as WebhookSubscription;
        const priceId = subscription.items.data[0]?.price.id;

        // Check if subscription already exists (idempotency)
        let subscriptionAlreadyExists = false;
        try {
          const checkUrl = `${STRAPI_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
          const checkRes = await fetch(checkUrl, {
            headers: STRAPI_AUTH_HEADERS,
          });
          const checkJson = await checkRes.json().catch(() => ({}));
          if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
            console.warn("Subscription already exists:", subscriptionId);
            subscriptionAlreadyExists = true;
          }
        } catch (e) {
          console.warn("Subscription idempotency check failed:", e);
        }

        // Only create subscription if it doesn't exist, but always try to publish listing
        if (!subscriptionAlreadyExists) {
          // Create subscription record in Strapi
          const res = await fetch(`${STRAPI_API_URL}/api/subscriptions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...STRAPI_AUTH_HEADERS,
            },
            body: JSON.stringify({
              data: {
                listingDocId,
                users_permissions_user: userId,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                stripeCustomerId: subscription.customer as string,
                subscriptionStatus: subscription.status,
                currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : new Date().toISOString(),
                autoRenew: !subscription.cancel_at_period_end,
              },
            }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error("Failed to create subscription in Strapi:", errorData);
            await logWebhookEvent("error", `Failed to create subscription in Strapi: ${subscriptionId}`, {
              severity: "error",
              userId,
              listingDocId,
              stripeEventId: event.id,
              rawMeta: { subscriptionId, errorData },
            });
          } else {
            const subscriptionData = await res.json();
            const subscriptionDocId = subscriptionData?.data?.documentId;            
            // Log successful subscription creation
            await logWebhookEvent("subscription_created", `Subscription created: ${subscriptionId}`, {
              severity: "info",
              userId,
              listingDocId,
              stripeEventId: event.id,
              rawMeta: { subscriptionId, subscriptionDocId, priceId },
            });
            
            // Create initial transaction record for the first payment
            if (subscriptionDocId && session.amount_total) {
              try {
                const transactionRes = await fetch(
                  `${STRAPI_API_URL}/api/subscription-transactions`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...STRAPI_AUTH_HEADERS,
                    },
                    body: JSON.stringify({
                      data: {
                        subscription: subscriptionDocId,
                        invoiceId: session.invoice as string || `checkout_${session.id}`,
                        amount: (session.amount_total / 100).toFixed(2),
                        currency: session.currency || 'usd',
                        transactionStatus: "paid",
                        invoiceDate: new Date().toISOString(),
                        rawData: {
                          checkoutSessionId: session.id,
                          paymentStatus: session.payment_status,
                        },
                      },
                    }),
                  }
                );

                if (!transactionRes.ok) {
                  const errorData = await transactionRes.json().catch(() => ({}));
                  console.error("Failed to create initial transaction:", errorData);
                  await logWebhookEvent("error", `Failed to create initial transaction for checkout: ${session.id}`, {
                    severity: "error",
                    userId,
                    listingDocId,
                    stripeEventId: event.id,
                    rawMeta: { sessionId: session.id, errorData },
                  });
                } else {
                  await logWebhookEvent("payment_succeeded", `Initial payment succeeded for subscription: ${subscriptionId}`, {
                    severity: "info",
                    userId,
                    listingDocId,
                    stripeEventId: event.id,
                    rawMeta: { 
                      subscriptionId, 
                      amount: (session.amount_total / 100).toFixed(2),
                      currency: session.currency,
                    },
                  });
                }
              } catch (e) {
                console.error("Error creating initial transaction:", e);
              }
            }
          }
        } else {
          console.log("Subscription already exists, skipping creation but will publish listing");
        }
        
        // ALWAYS try to publish the listing, regardless of whether subscription already existed
        try {
          const listingUrl = `${STRAPI_API_URL}/api/listings/${listingDocId}`;
          
          const updateRes = await fetch(listingUrl, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...STRAPI_AUTH_HEADERS,
            },
            body: JSON.stringify({
              data: {
                listingStatus: "published",
              },
            }),
          });

          if (!updateRes.ok) {
            const responseText = await updateRes.text().catch(() => 'Unable to read response');
            let updateError = {};
            try {
              updateError = JSON.parse(responseText);
            } catch {
              updateError = { message: responseText };
            }
            console.error("Failed to publish listing:", listingDocId);
            console.error("Status:", updateRes.status, updateRes.statusText);
            console.error("Error details:", updateError);
            await logWebhookEvent("error", `Failed to publish listing: ${listingDocId}`, {
              severity: "error",
              userId,
              listingDocId,
              stripeEventId: event.id,
              rawMeta: { updateError, status: updateRes.status, statusText: updateRes.statusText },
            });
          } else {
            console.log("Listing published successfully:", listingDocId);
            const responseData = await updateRes.json().catch(() => null);
            await logWebhookEvent("listing_published", `Listing published after subscription: ${listingDocId}`, {
              severity: "info",
              userId,
              listingDocId,
              stripeEventId: event.id,
              rawMeta: { subscriptionId, strapiResponse: responseData },
            });

            // SEND EMAIL NOTIFICATION
            try {
              console.log("Fetching user for subscription email, userId:", userId);
              const userRes = await fetch(`${STRAPI_API_URL}/api/users/${userId}`, {
                headers: STRAPI_AUTH_HEADERS,
              });
              console.log("User fetch status:", userRes.status);
              const user = await userRes.json();
              console.log("User fetch result email:", user?.email, "username:", user?.username);

              if (user && user.email) {
                const listingTitle = responseData?.data?.title || "Your Listing";
                console.log("Sending subscription email to:", user.email, "listing:", listingTitle);

                await sendAppNotification({
                  type: "subscription",
                  to: user.email,
                  subject: getSubscriptionSubject(user.preferredLanguage),
                  locale: user.preferredLanguage || "en",
                  stripeEventId: event.id,
                  rawMeta: { subscriptionId, listingDocId },
                  data: {
                    username: user.username || user.email,
                    listingTitle,
                  },
                });
              } else {
                console.warn("Subscription email skipped: user has no email. userId:", userId, "user:", JSON.stringify(user));
              }
            } catch (emailErr) {
              console.error("Subscription email trigger failed:", emailErr);
            }
          }
        } catch (e) {
          console.error("Error publishing listing:", e);
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as WebhookSubscription;
        const subscriptionId = subscription.id;

        // Log webhook received
        await logWebhookEvent("webhook_received", `Received customer.subscription.updated webhook`, {
          severity: "info",
          stripeEventId: event.id,
          rawMeta: { subscriptionId, status: subscription.status },
        });

        // Find existing subscription in Strapi
        const findUrl = `${STRAPI_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
        const findRes = await fetch(findUrl, {
          headers: STRAPI_AUTH_HEADERS,
        });
        const findJson = await findRes.json().catch(() => ({}));

        if (!Array.isArray(findJson?.data) || findJson.data.length === 0) {
          console.warn("Subscription not found for update:", subscriptionId);
          break;
        }

        const existingSubscription = findJson.data[0];
        const documentId = existingSubscription.documentId;

        // Update subscription status
        const updateRes = await fetch(
          `${STRAPI_API_URL}/api/subscriptions/${documentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...STRAPI_AUTH_HEADERS,
            },
            body: JSON.stringify({
              data: {
                subscriptionStatus: subscription.status,
                currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : new Date().toISOString(),
                autoRenew: !subscription.cancel_at_period_end,
              },
            }),
          }
        );

        if (!updateRes.ok) {
          const errorData = await updateRes.json().catch(() => ({}));
          console.error("Failed to update subscription in Strapi:", errorData);
          await logWebhookEvent("error", `Failed to update subscription: ${subscriptionId}`, {
            severity: "error",
            stripeEventId: event.id,
            rawMeta: { subscriptionId, errorData },
          });
        } else {          
          const userId = existingSubscription.users_permissions_user?.id || existingSubscription.users_permissions_user;
          const listingDocId = existingSubscription.listingDocId;
          
          await logWebhookEvent("subscription_updated", `Subscription updated: ${subscriptionId}`, {
            severity: "info",
            userId,
            listingDocId,
            stripeEventId: event.id,
            rawMeta: { 
              subscriptionId, 
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });
          
          // If subscription was reactivated (cancel_at_period_end changed from true to false)
          // and status is active, ensure listing is published
          if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
            try {
              const listingDocId = existingSubscription.listingDocId;
              const listingUrl = `${STRAPI_API_URL}/api/listings/${listingDocId}`;
              const publishRes = await fetch(listingUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...STRAPI_AUTH_HEADERS,
                },
                body: JSON.stringify({
                  data: {
                    listingStatus: "published",
                  },
                }),
              });

              if (publishRes.ok) {
                await logWebhookEvent("subscription_reactivated", `Subscription reactivated: ${subscriptionId}`, {
                  severity: "info",
                  userId,
                  listingDocId,
                  stripeEventId: event.id,
                  rawMeta: { subscriptionId },
                });
                await logWebhookEvent("listing_published", `Listing re-published after reactivation: ${listingDocId}`, {
                  severity: "info",
                  userId,
                  listingDocId,
                  stripeEventId: event.id,
                  rawMeta: { subscriptionId },
                });
              }
            } catch (e) {
              console.error("Error re-publishing listing:", e);
            }
          }
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as WebhookSubscription;
        const subscriptionId = subscription.id;

        // Log webhook received
        await logWebhookEvent("webhook_received", `Received customer.subscription.deleted webhook`, {
          severity: "info",
          stripeEventId: event.id,
          rawMeta: { subscriptionId },
        });

        // Find and update subscription status to canceled
        const findUrl = `${STRAPI_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
        const findRes = await fetch(findUrl, {
          headers: STRAPI_AUTH_HEADERS,
        });
        const findJson = await findRes.json().catch(() => ({}));

        if (!Array.isArray(findJson?.data) || findJson.data.length === 0) {
          console.warn("Subscription not found for deletion:", subscriptionId);
          break;
        }

        const existingSubscription = findJson.data[0];
        const documentId = existingSubscription.documentId;

        const updateRes = await fetch(
          `${STRAPI_API_URL}/api/subscriptions/${documentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...STRAPI_AUTH_HEADERS,
            },
            body: JSON.stringify({
              data: {
                subscriptionStatus: "canceled",
                autoRenew: false,
              },
            }),
          }
        );

        if (!updateRes.ok) {
          const errorData = await updateRes.json().catch(() => ({}));
          console.error("Failed to mark subscription as canceled:", errorData);
          await logWebhookEvent("error", `Failed to cancel subscription: ${subscriptionId}`, {
            severity: "error",
            stripeEventId: event.id,
            rawMeta: { subscriptionId, errorData },
          });
        } else {          
          const userId = existingSubscription.users_permissions_user?.id || existingSubscription.users_permissions_user;
          const listingDocId = existingSubscription.listingDocId;
          
          await logWebhookEvent("subscription_canceled", `Subscription canceled: ${subscriptionId}`, {
            severity: "info",
            userId,
            listingDocId,
            stripeEventId: event.id,
            rawMeta: { subscriptionId },
          });
          
          // Set listing back to draft when subscription is actually canceled
          try {
            const listingUrl = `${STRAPI_API_URL}/api/listings/${listingDocId}`;
            const draftRes = await fetch(listingUrl, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...STRAPI_AUTH_HEADERS,
              },
              body: JSON.stringify({
                data: {
                  listingStatus: "draft",
                },
              }),
            });

            if (!draftRes.ok) {
              const draftError = await draftRes.json().catch(() => ({}));
              console.error("Failed to set listing to draft:", listingDocId, draftError);
              await logWebhookEvent("error", `Failed to unpublish listing: ${listingDocId}`, {
                severity: "error",
                userId,
                listingDocId,
                stripeEventId: event.id,
                rawMeta: { draftError },
              });
            } else {
              await logWebhookEvent("listing_unpublished", `Listing unpublished after cancellation: ${listingDocId}`, {
                severity: "info",
                userId,
                listingDocId,
                stripeEventId: event.id,
                rawMeta: { subscriptionId },
              });
            }
          } catch (e) {
            console.error("Error setting listing to draft:", e);
          }
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as WebhookInvoice;
        const subscriptionId = extractSubscriptionId(invoice);
        const billingReason = invoice.billing_reason;

        await logWebhookEvent("webhook_received", `Received invoice.payment_succeeded webhook`, {
          severity: "info",
          stripeEventId: event.id,
          rawMeta: { invoiceId: invoice.id, subscriptionId, billingReason },
        });

        if (!subscriptionId) break;

        const createdInvoice = await createOrGetSubscriptionInvoice(
          invoice,
          subscriptionId,
          event.id,
          "paid"
        );

        if (createdInvoice?.created && createdInvoice.userEmail) {
          await sendAppNotification({
            type: "invoice",
            to: createdInvoice.userEmail!,
            subject: getInvoiceSubject(createdInvoice.invoiceNumber, createdInvoice.locale),
            locale: createdInvoice.locale || "en",
            stripeEventId: event.id,
            rawMeta: { invoiceId: invoice.id, subscriptionId },
            data: {
              username: createdInvoice.username || createdInvoice.userEmail,
              invoiceNumber: createdInvoice.invoiceNumber,
              invoiceUrl: createdInvoice.hostedUrl,
            },
          });
        }

        break;
      }

      case "invoice.finalized": {
        const invoice = event.data.object as WebhookInvoice;
        const subscriptionId = extractSubscriptionId(invoice);

        await logWebhookEvent("webhook_received", `Received invoice.finalized webhook`, {
          severity: "info",
          stripeEventId: event.id,
          rawMeta: { invoiceId: invoice.id, subscriptionId },
        });

        if (!subscriptionId) break;

        const createdInvoice = await createOrGetSubscriptionInvoice(
          invoice,
          subscriptionId,
          event.id
        );

        if (createdInvoice?.created && createdInvoice.userEmail) {
          await sendAppNotification({
            type: "invoice",
            to: createdInvoice.userEmail!,
            subject: getInvoiceSubject(createdInvoice.invoiceNumber, createdInvoice.locale),
            locale: createdInvoice.locale || "en",
            stripeEventId: event.id,
            rawMeta: { invoiceId: invoice.id, subscriptionId },
            data: {
              username: createdInvoice.username || createdInvoice.userEmail,
              invoiceNumber: createdInvoice.invoiceNumber,
              invoiceUrl: createdInvoice.hostedUrl,
            },
          });
        }

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as WebhookInvoice;        
        const subscriptionId = extractSubscriptionId(invoice);
        const billingReason = invoice.billing_reason;

        // Log webhook received
        await logWebhookEvent("webhook_received", `Received invoice.paid webhook`, {
          severity: "info",
          stripeEventId: event.id,
          rawMeta: { invoiceId: invoice.id, subscriptionId, billingReason },
        });

        if (!subscriptionId) {
          break;
        }

        // createOrGetSubscriptionInvoice handles the case where the subscription
        // isn't in Strapi yet (race with checkout.session.completed) by recovering
        // directly from Stripe and creating the record on the fly.
        const createdInvoice = await createOrGetSubscriptionInvoice(
          invoice,
          subscriptionId,
          event.id,
          "paid"
        );

        if (!createdInvoice) break;

        const subscriptionDocId = createdInvoice.subscriptionDocId;
        const userId = createdInvoice.userId;
        const listingDocId = createdInvoice.listingDocId;

        if (createdInvoice.created && createdInvoice.userEmail) {
          await sendAppNotification({
            type: "invoice",
            to: createdInvoice.userEmail!,
            subject: getInvoiceSubject(createdInvoice.invoiceNumber, createdInvoice.locale),
            locale: createdInvoice.locale || "en",
            stripeEventId: event.id,
            rawMeta: { invoiceId: invoice.id, subscriptionId },
            data: {
              username: createdInvoice.username || createdInvoice.userEmail,
              invoiceNumber: createdInvoice.invoiceNumber,
              invoiceUrl: createdInvoice.hostedUrl,
            },
          });
        }

        // Skip initial subscription creation invoices for transaction - those are handled by checkout.session.completed
        let shouldCreateTransaction = billingReason !== 'subscription_create';

        if (shouldCreateTransaction) {
          // Check if transaction already exists (idempotency)
          try {
            const checkUrl = `${STRAPI_API_URL}/api/subscription-transactions?filters[invoiceId][$eq]=${encodeURIComponent(invoice.id)}`;
            const checkRes = await fetch(checkUrl, {
              headers: STRAPI_AUTH_HEADERS,
            });
            const checkJson = await checkRes.json().catch(() => ({}));
            if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
              console.warn("Transaction already recorded:", invoice.id);
              shouldCreateTransaction = false; // Transaction already exists
            }
          } catch (e) {
            console.warn("Transaction idempotency check failed:", e);
          }
        }

        if (shouldCreateTransaction) {
          // Create transaction record
          const transactionRes = await fetch(
            `${STRAPI_API_URL}/api/subscription-transactions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...STRAPI_AUTH_HEADERS,
              },
              body: JSON.stringify({
                data: {
                  subscription: subscriptionDocId,
                  invoiceId: invoice.id,
                  amount: (invoice.amount_paid / 100).toFixed(2),
                  currency: invoice.currency,
                  transactionStatus: "paid",
                  invoiceDate: new Date(invoice.created * 1000).toISOString(),
                  rawData: {
                    invoiceNumber: invoice.number,
                    hostedInvoiceUrl: invoice.hosted_invoice_url,
                  },
                },
              }),
            }
          );

          if (!transactionRes.ok) {
            const errorData = await transactionRes.json().catch(() => ({}));
            console.error("Failed to create subscription transaction:", errorData);
            await logWebhookEvent("error", `Failed to create transaction for invoice: ${invoice.id}`, {
              severity: "error",
              stripeEventId: event.id,
              rawMeta: { invoiceId: invoice.id, subscriptionId, errorData },
            });
          } else {
            console.log("Subscription transaction created:", invoice.id);
            await logWebhookEvent("payment_succeeded", `Payment succeeded for invoice: ${invoice.id}`, {
              severity: "info",
              userId: userId ?? undefined,
              listingDocId: listingDocId ?? undefined,
              stripeEventId: event.id,
              rawMeta: {
                invoiceId: invoice.id,
                subscriptionId,
                amount: (invoice.amount_paid / 100).toFixed(2),
                currency: invoice.currency,
              },
            });
          }
        }

        // Always ensure listing stays published (important for reactivations) and Invoice is marked paid
        try {
          const listingUrl = `${STRAPI_API_URL}/api/listings/${listingDocId}`;
          const publishRes = await fetch(listingUrl, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...STRAPI_AUTH_HEADERS,
            },
            body: JSON.stringify({
              data: {
                listingStatus: "published",
              },
            }),
          });

          if (publishRes.ok) {
            console.log("Listing kept published after successful payment:", listingDocId);
            await logWebhookEvent("listing_published", `Listing kept published after successful payment: ${listingDocId}`, {
              severity: "info",
              userId: userId ?? undefined,
              listingDocId: listingDocId ?? undefined,
              stripeEventId: event.id,
              rawMeta: { subscriptionId, invoiceId: invoice.id },
            });
          }
        } catch (e) {
          console.error("Error keeping listing published:", e);
        }

        // In addition to transaction, update the actual Invoice status to paid
        try {
          const checkUrl = `${STRAPI_API_URL}/api/invoices?filters[stripeInvoiceId][$eq]=${encodeURIComponent(invoice.id)}`;
          const checkRes = await fetch(checkUrl, {
            headers: STRAPI_AUTH_HEADERS,
          });
          const checkJson = await checkRes.json().catch(() => ({}));
          
          if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
            const invoiceDocId = checkJson.data[0].documentId;
            await fetch(`${STRAPI_API_URL}/api/invoices/${invoiceDocId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...STRAPI_AUTH_HEADERS,
              },
              body: JSON.stringify({
                data: {
                  invoiceStatus: "paid",
                },
              }),
            });
          }
        } catch (e) {
          console.error("Error updating invoice status to paid:", e);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as WebhookInvoice;
        const subscriptionId = extractSubscriptionId(invoice);

        // Log webhook received
        await logWebhookEvent("webhook_received", `Received invoice.payment_failed webhook`, {
          severity: "warning",
          stripeEventId: event.id,
          rawMeta: { invoiceId: invoice.id, subscriptionId },
        });

        if (!subscriptionId) {
          console.log("Invoice not related to subscription, skipping");
          break;
        }

        // Check if failed transaction already exists
        try {
          const checkUrl = `${STRAPI_API_URL}/api/subscription-transactions?filters[invoiceId][$eq]=${encodeURIComponent(invoice.id)}`;
          const checkRes = await fetch(checkUrl, {
            headers: STRAPI_AUTH_HEADERS,
          });
          const checkJson = await checkRes.json().catch(() => ({}));
          if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
            console.warn("Failed transaction already recorded:", invoice.id);
            return NextResponse.json({ received: true });
          }
        } catch (e) {
          console.warn("Failed transaction idempotency check failed:", e);
        }

        // Find subscription in Strapi
        const findUrl = `${STRAPI_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
        const findRes = await fetch(findUrl, {
          headers: STRAPI_AUTH_HEADERS,
        });
        const findJson = await findRes.json().catch(() => ({}));

        if (!Array.isArray(findJson?.data) || findJson.data.length === 0) {
          console.warn("Subscription not found for failed invoice:", subscriptionId);
          break;
        }

        const subscription = findJson.data[0];
        const subscriptionDocId = subscription.documentId;

        // Create failed transaction record
        const transactionRes = await fetch(
          `${STRAPI_API_URL}/api/subscription-transactions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...STRAPI_AUTH_HEADERS,
            },
            body: JSON.stringify({
              data: {
                subscription: subscriptionDocId,
                invoiceId: invoice.id,
                amount: (invoice.amount_due / 100).toFixed(2),
                currency: invoice.currency,
                transactionStatus: "failed",
                invoiceDate: new Date(invoice.created * 1000).toISOString(),
                rawData: {
                  attemptCount: invoice.attempt_count,
                  nextPaymentAttempt: invoice.next_payment_attempt
                    ? new Date(invoice.next_payment_attempt * 1000).toISOString()
                    : null,
                },
              },
            }),
          }
        );

        if (!transactionRes.ok) {
          const errorData = await transactionRes.json().catch(() => ({}));
          console.error("Failed to create failed transaction record:", errorData);
          await logWebhookEvent("error", `Failed to record failed payment for invoice: ${invoice.id}`, {
            severity: "error",
            stripeEventId: event.id,
            rawMeta: { invoiceId: invoice.id, subscriptionId, errorData },
          });
        } else {
          console.log("Failed transaction recorded:", invoice.id);
          
          const userId = subscription.users_permissions_user?.id || subscription.users_permissions_user;
          const listingDocId = subscription.listingDocId;
          
          await logWebhookEvent("payment_failed", `Payment failed for invoice: ${invoice.id}`, {
            severity: "warning",
            userId,
            listingDocId,
            stripeEventId: event.id,
            rawMeta: { 
              invoiceId: invoice.id,
              subscriptionId,
              amount: (invoice.amount_due / 100).toFixed(2),
              currency: invoice.currency,
              attemptCount: invoice.attempt_count,
            },
          });
          
          // Set listing to draft on payment failure
          try {
            const listingUrl = `${STRAPI_API_URL}/api/listings/${listingDocId}`;
            const draftRes = await fetch(listingUrl, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...STRAPI_AUTH_HEADERS,
              },
              body: JSON.stringify({
                data: {
                  listingStatus: "draft",
                },
              }),
            });

            if (!draftRes.ok) {
              const draftError = await draftRes.json().catch(() => ({}));
              console.error("Failed to set listing to draft after payment failure:", listingDocId, draftError);
              await logWebhookEvent("error", `Failed to unpublish listing after payment failure: ${listingDocId}`, {
                severity: "error",
                userId,
                listingDocId,
                stripeEventId: event.id,
                rawMeta: { draftError },
              });
            } else {
              console.log("Listing set to draft after payment failure:", listingDocId);
              await logWebhookEvent("listing_unpublished", `Listing unpublished after payment failure: ${listingDocId}`, {
                severity: "warning",
                userId,
                listingDocId,
                stripeEventId: event.id,
                rawMeta: { subscriptionId, invoiceId: invoice.id },
              });
            }
          } catch (e) {
            console.error("Error setting listing to draft:", e);
          }
          
          // In addition to transaction, update the actual Invoice status to failed
          try {
            const checkUrl = `${STRAPI_API_URL}/api/invoices?filters[stripeInvoiceId][$eq]=${encodeURIComponent(invoice.id)}`;
            const checkRes = await fetch(checkUrl, {
              headers: STRAPI_AUTH_HEADERS,
            });
            const checkJson = await checkRes.json().catch(() => ({}));
            
            if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
              const invoiceDocId = checkJson.data[0].documentId;
              await fetch(`${STRAPI_API_URL}/api/invoices/${invoiceDocId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...STRAPI_AUTH_HEADERS,
                },
                body: JSON.stringify({
                  data: {
                    invoiceStatus: "failed",
                  },
                }),
              });
            }
          } catch (e) {
            console.error("Error updating invoice status to failed:", e);
          }
        }

        break;
      }

      default:
        console.log(`Unhandled subscription event type: ${event.type}`);
        await logWebhookEvent("webhook_received", `Unhandled subscription event type: ${event.type}`, {
          severity: "info",
          stripeEventId: event.id,
        });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error handling subscription webhook:", err);
    await logWebhookEvent("error", `Unexpected error handling webhook: ${err instanceof Error ? err.message : String(err)}`, {
      severity: "critical",
      rawMeta: { 
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
