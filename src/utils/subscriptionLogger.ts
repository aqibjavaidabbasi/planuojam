/**
 * Subscription Logger Utility
 * Creates logs in Strapi for subscription-related events
 */

export type SubscriptionEventType =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_canceled"
  | "subscription_reactivated"
  | "payment_succeeded"
  | "payment_failed"
  | "listing_published"
  | "listing_unpublished"
  | "webhook_received"
  | "error";

export type SubscriptionEventSource =
  | "stripe_webhook"
  | "api_endpoint"
  | "admin_action"
  | "system";

export type LogSeverity = "info" | "warning" | "error" | "critical";

export interface SubscriptionLogData {
  subscriptionEventType: SubscriptionEventType;
  subscriptionEventSource: SubscriptionEventSource;
  message: string;
  severity?: LogSeverity;
  userId?: string | number;
  listingDocId?: string;
  stripeEventId?: string;
  rawMeta?: Record<string, unknown>;
}

/**
 * Creates a subscription log entry in Strapi
 * @param logData - The log data to record
 * @returns Promise<boolean> - Returns true if log was created successfully
 */
export async function createSubscriptionLog(
  logData: SubscriptionLogData
): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiToken = process.env.STRAPI_API_TOKEN;

    if (!apiUrl || !apiToken) {
      console.error("Missing API URL or token for subscription logging");
      return false;
    }

    const payload: Record<string, unknown> = {
      subscriptionEventType: logData.subscriptionEventType,
      subscriptionEventSource: logData.subscriptionEventSource,
      message: logData.message,
      severity: logData.severity || "info",
    };

    // Add optional fields if provided
    if (logData.userId) {
      payload.users_permissions_user = logData.userId;
    }
    if (logData.listingDocId) {
      payload.listingDocId = logData.listingDocId;
    }
    if (logData.stripeEventId) {
      payload.stripeEventId = logData.stripeEventId;
    }
    if (logData.rawMeta) {
      payload.rawMeta = logData.rawMeta;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(`${apiUrl}/api/subscription-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ data: payload }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to create subscription log:", errorData);
      return false;
    }

    return true;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn("Subscription logging timed out (Strapi unreachable), skipping log.");
      return false;
    }
    console.error("Error creating subscription log:", error);
    return false;
  }
}

/**
 * Helper function to log webhook events
 */
export async function logWebhookEvent(
  eventType: SubscriptionEventType,
  message: string,
  options?: {
    severity?: LogSeverity;
    userId?: string | number;
    listingDocId?: string;
    stripeEventId?: string;
    rawMeta?: Record<string, unknown>;
  }
): Promise<boolean> {
  return createSubscriptionLog({
    subscriptionEventType: eventType,
    subscriptionEventSource: "stripe_webhook",
    message,
    severity: options?.severity,
    userId: options?.userId,
    listingDocId: options?.listingDocId,
    stripeEventId: options?.stripeEventId,
    rawMeta: options?.rawMeta,
  });
}

/**
 * Helper function to log API endpoint events
 */
export async function logApiEvent(
  eventType: SubscriptionEventType,
  message: string,
  options?: {
    severity?: LogSeverity;
    userId?: string | number;
    listingDocId?: string;
    rawMeta?: Record<string, unknown>;
  }
): Promise<boolean> {
  return createSubscriptionLog({
    subscriptionEventType: eventType,
    subscriptionEventSource: "api_endpoint",
    message,
    severity: options?.severity,
    userId: options?.userId,
    listingDocId: options?.listingDocId,
    rawMeta: options?.rawMeta,
  });
}

/**
 * Helper function to log system events
 */
export async function logSystemEvent(
  eventType: SubscriptionEventType,
  message: string,
  options?: {
    severity?: LogSeverity;
    userId?: string | number;
    listingDocId?: string;
    rawMeta?: Record<string, unknown>;
  }
): Promise<boolean> {
  return createSubscriptionLog({
    subscriptionEventType: eventType,
    subscriptionEventSource: "system",
    message,
    severity: options?.severity,
    userId: options?.userId,
    listingDocId: options?.listingDocId,
    rawMeta: options?.rawMeta,
  });
}
