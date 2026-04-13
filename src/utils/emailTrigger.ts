/**
 * Client-side helper to trigger email notifications via the Next.js API route.
 */
export async function triggerNotificationEmail(
  type: 'booking_provider' | 'message' | 'subscription' | 'inquiry',
  to: string,
  data: Record<string, unknown>,
  subject?: string,
  locale?: string,
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    
    const response = await fetch(`${appUrl}/api/email/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        to,
        subject,
        data,
        locale: locale || 'en',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn(`Failed to trigger ${type} email:`, err);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error triggering ${type} email:`, error);
    return false;
  }
}
