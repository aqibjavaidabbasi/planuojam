import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { logWebhookEvent } from "@/utils/subscriptionLogger";

type WebhookSubscription = Stripe.Subscription & {
  current_period_end?: number;
  cancel_at_period_end?: boolean;
};

type WebhookInvoice = Stripe.Invoice & {
  subscription?: string | null | { id: string };
};

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

  console.log("event type:::::::::::::::::::::::::::::::::::::::::::", event.type, event.data)
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
          const checkUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
          const checkRes = await fetch(checkUrl, {
            headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
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
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
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
                  `${process.env.NEXT_PUBLIC_API_URL}/api/subscription-transactions`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
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
          const listingUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/listings/${listingDocId}`;
          
          const updateRes = await fetch(listingUrl, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
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
              const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
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
        const findUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
        const findRes = await fetch(findUrl, {
          headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
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
              const listingUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/listings/${listingDocId}`;
              const publishRes = await fetch(listingUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
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
        const findUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
        const findRes = await fetch(findUrl, {
          headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
        });
        const findJson = await findRes.json().catch(() => ({}));

        if (!Array.isArray(findJson?.data) || findJson.data.length === 0) {
          console.warn("Subscription not found for deletion:", subscriptionId);
          break;
        }

        const existingSubscription = findJson.data[0];
        const documentId = existingSubscription.documentId;

        const updateRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/${documentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
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
            const listingUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/listings/${listingDocId}`;
            const draftRes = await fetch(listingUrl, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
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
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription?.id || null);

        await logWebhookEvent("webhook_received", `Received invoice.finalized webhook`, {
          severity: "info",
          stripeEventId: event.id,
          rawMeta: { invoiceId: invoice.id, subscriptionId },
        });

        if (!subscriptionId) break;

        // Idempotency check: see if invoice already exists
        try {
          const checkUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/invoices?filters[stripeInvoiceId][$eq]=${encodeURIComponent(invoice.id)}`;
          const checkRes = await fetch(checkUrl, {
            headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
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
        const findSubUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
        const findSubRes = await fetch(findSubUrl, {
          headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
        });
        const findSubJson = await findSubRes.json().catch(() => ({}));

        if (!Array.isArray(findSubJson?.data) || findSubJson.data.length === 0) {
          console.warn("Subscription not found for finalized invoice:", subscriptionId);
          break;
        }

        const subscriptionDocId = findSubJson.data[0].documentId;

        // Create invoice in Strapi
        const createInvoiceRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
          },
          body: JSON.stringify({
            data: {
              stripeInvoiceId: invoice.id,
              invoiceNumber: invoice.number || null,
              subscriptions: [subscriptionDocId],
              amount: parseFloat((invoice.total / 100).toFixed(2)),
              currency: invoice.currency,
              invoiceStatus: "open",
              hostedUrl: invoice.hosted_invoice_url || null,
              pdfUrl: invoice.invoice_pdf || null,
              periodStart: new Date(invoice.period_start * 1000).toISOString(),
              periodEnd: new Date(invoice.period_end * 1000).toISOString(),
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
        // Extract subscription ID - it can be a string or null for non-subscription invoices
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription?.id || null);
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
        
        // Skip initial subscription creation invoices - those are handled by checkout.session.completed
        if (billingReason === 'subscription_create') {
          break;
        }

        // Check if transaction already exists (idempotency)
        try {
          const checkUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/subscription-transactions?filters[invoiceId][$eq]=${encodeURIComponent(invoice.id)}`;
          const checkRes = await fetch(checkUrl, {
            headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
          });
          const checkJson = await checkRes.json().catch(() => ({}));
          if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
            console.warn("Transaction already recorded:", invoice.id);
            return NextResponse.json({ received: true });
          }
        } catch (e) {
          console.warn("Transaction idempotency check failed:", e);
        }

        // Find subscription in Strapi
        const findUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
        const findRes = await fetch(findUrl, {
          headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
        });
        const findJson = await findRes.json().catch(() => ({}));

        if (!Array.isArray(findJson?.data) || findJson.data.length === 0) {
          console.warn("Subscription not found for invoice:", subscriptionId);
          break;
        }

        const subscription = findJson.data[0];
        const subscriptionDocId = subscription.documentId;

        // Create transaction record
        const transactionRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subscription-transactions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
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
                  pdfUrl: invoice.invoice_pdf,
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
          
          const userId = subscription.users_permissions_user?.id || subscription.users_permissions_user;
          const listingDocId = subscription.listingDocId;
          
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
          
          // Ensure listing stays published on successful renewal
          try {
            const listingUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/listings/${listingDocId}`;
            const publishRes = await fetch(listingUrl, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
              },
              body: JSON.stringify({
                data: {
                  listingStatus: "published",
                },
              }),
            });

            if (publishRes.ok) {
              console.log("Listing kept published after renewal:", listingDocId);
              await logWebhookEvent("listing_published", `Listing kept published after renewal: ${listingDocId}`, {
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
            const checkUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/invoices?filters[stripeInvoiceId][$eq]=${encodeURIComponent(invoice.id)}`;
            const checkRes = await fetch(checkUrl, {
              headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
            });
            const checkJson = await checkRes.json().catch(() => ({}));
            
            if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
              const invoiceDocId = checkJson.data[0].documentId;
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${invoiceDocId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
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
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as WebhookInvoice;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription?.id || null);

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
          const checkUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/subscription-transactions?filters[invoiceId][$eq]=${encodeURIComponent(invoice.id)}`;
          const checkRes = await fetch(checkUrl, {
            headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
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
        const findUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions?filters[stripeSubscriptionId][$eq]=${encodeURIComponent(subscriptionId)}`;
        const findRes = await fetch(findUrl, {
          headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
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
          `${process.env.NEXT_PUBLIC_API_URL}/api/subscription-transactions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
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
            const listingUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/listings/${listingDocId}`;
            const draftRes = await fetch(listingUrl, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
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
            const checkUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/invoices?filters[stripeInvoiceId][$eq]=${encodeURIComponent(invoice.id)}`;
            const checkRes = await fetch(checkUrl, {
              headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
            });
            const checkJson = await checkRes.json().catch(() => ({}));
            
            if (Array.isArray(checkJson?.data) && checkJson.data.length > 0) {
              const invoiceDocId = checkJson.data[0].documentId;
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${invoiceDocId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
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
