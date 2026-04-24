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
    "http://localhost:3000"
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
              const userRes = await fetch(`${STRAPI_API_URL}/api/users/${userId}`, {
                headers: STRAPI_AUTH_HEADERS,
              });
              const user = await userRes.json();
              
              if (user && user.email) {
                const listingTitle = responseData?.data?.title || "Your Listing";
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://planuojam.lt';
                
                await fetch(`${appUrl}/api/email/notification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'subscription',
                    to: user.email,
                    subject: 'Your listing is now active!',
                    locale: user.preferredLanguage || 'en',
                    data: {
                      username: user.username || user.email,
                      listingTitle,
                    }
                  })
                });
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
        console.log("Ignored invoice.payment_succeeded (handled by invoice.paid)");
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

        // Idempotency check: see if invoice already exists
        try {
          const checkUrl = `${STRAPI_API_URL}/api/invoices?filters[stripeInvoiceId][$eq]=${encodeURIComponent(invoice.id)}`;
          const checkRes = await fetch(checkUrl, {
            headers: STRAPI_AUTH_HEADERS,
          });
          const checkJson = await checkRes.json().catch(() => ({}));
          if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
            console.warn("Invoice already exists in Strapi:", invoice.id);
            break; // Skip creation
          }
        } catch (e) {
          console.warn("Invoice idempotency check failed:", e);
        }

        // Find subscription in Strapi to link
        const findSubUrl = `${STRAPI_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
        const findSubRes = await fetch(findSubUrl, {
          headers: STRAPI_AUTH_HEADERS,
        });
        const findSubJson = await findSubRes.json().catch(() => ({} as { data?: StrapiSubscriptionEntry[] }));

        if (!Array.isArray(findSubJson?.data) || findSubJson.data.length === 0) {
          console.warn("Subscription not found for finalized invoice:", subscriptionId);
          break;
        }

        const subscriptionEntry = findSubJson.data[0] as StrapiSubscriptionEntry;
        const subscriptionDocId = subscriptionEntry.documentId;
        const listingDocId = subscriptionEntry.listingDocId || null;
        const userId =
          typeof subscriptionEntry.users_permissions_user === "object"
            ? subscriptionEntry.users_permissions_user?.id
            : subscriptionEntry.users_permissions_user;

        const invoiceWithCustomerDetails = invoice as InvoiceWithCustomerDetails;
        const publicToken = createPublicInvoiceToken();
        const hostedUrl = buildPublicInvoiceUrl(publicToken);

        const [sellerInvoiceDetail, listingResponse, userResponse] = await Promise.all([
          fetchStrapiJson<{ data?: SellerInvoiceDetailEntry }>(
            `${STRAPI_API_URL}/api/seller-invoice-detail`
          ),
          listingDocId
            ? fetchStrapiJson<{ data?: StrapiListingEntry }>(
                `${STRAPI_API_URL}/api/listings/${listingDocId}?populate=*`
              )
            : Promise.resolve(null),
          userId
            ? fetchStrapiJson<StrapiUserEntry>(`${STRAPI_API_URL}/api/users/${userId}`)
            : Promise.resolve(null),
        ]);

        const sellerSnapshot = sellerInvoiceDetail?.data || {};
        const listingTitle = listingResponse?.data?.title || null;
        const buyerName =
          userResponse?.username || invoiceWithCustomerDetails.customer_name || null;
        const buyerEmail =
          userResponse?.email || invoiceWithCustomerDetails.customer_email || null;
        const buyerAddress = formatStripeAddress(invoiceWithCustomerDetails.customer_address);
        const subscriptionTitle =
          invoice.lines?.data?.[0]?.description || listingTitle || "Subscription";

        // Create invoice in Strapi
        const createInvoiceRes = await fetch(`${STRAPI_API_URL}/api/invoices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...STRAPI_AUTH_HEADERS,
          },
          body: JSON.stringify({
            data: {
              stripeInvoiceId: invoice.id,
              invoiceNumber: invoice.number || null,
              subscriptions: [subscriptionDocId],
              amount: parseFloat((invoice.total / 100).toFixed(2)),
              currency: invoice.currency,
              invoiceStatus: invoice.status || "open",
              hostedUrl,
              periodStart: new Date(invoice.period_start * 1000).toISOString(),
              periodEnd: new Date(invoice.period_end * 1000).toISOString(),
              publicToken,
              buyerName,
              buyerEmail,
              buyerAddress,
              listingTitle,
              SubscriptionTitle: subscriptionTitle,
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
            stripeEventId: event.id,
            rawMeta: { invoiceId: invoice.id, error: errData },
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
        
        // Find subscription in Strapi
        const findUrl = `${STRAPI_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
        const findRes = await fetch(findUrl, {
          headers: STRAPI_AUTH_HEADERS,
        });
        const findJson = await findRes.json().catch(() => ({}));

        if (!Array.isArray(findJson?.data) || findJson.data.length === 0) {
          console.warn("Subscription not found for invoice:", subscriptionId);
          break;
        }

        const subscription = findJson.data[0];
        const subscriptionDocId = subscription.documentId;
        const userId = subscription.users_permissions_user?.id || subscription.users_permissions_user;
        const listingDocId = subscription.listingDocId;

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
              userId,
              listingDocId,
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
              userId,
              listingDocId,
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
