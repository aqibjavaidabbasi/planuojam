import { NextRequest, NextResponse } from "next/server";
import { verifySocialTicket, socialAuthHeaders, SOCIAL_TICKET_COOKIE } from "@/lib/social";
import { API_URL } from "@/services/api";

export const runtime = 'nodejs';

// Finishes a social signup: the identity comes from the signed cookie the OAuth
// callback set, the account type comes from the form. The client never gets to
// say which email it is registering.
export async function POST(req: NextRequest) {
  const ticket = verifySocialTicket(req.cookies.get(SOCIAL_TICKET_COOKIE)?.value);
  if (!ticket) {
    return NextResponse.json({ error: 'SOCIAL_SESSION_EXPIRED' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const isProvider = body?.role === 'provider';
  const serviceType = isProvider ? (body?.serviceType || null) : null;
  const phone = isProvider ? String(body?.phone || '').trim() : null;
  const preferredLanguage = body?.preferredLanguage || null;

  if (isProvider && !serviceType) {
    return NextResponse.json({ error: 'SERVICE_REQUIRED' }, { status: 400 });
  }
  if (isProvider && (!phone || phone.length < 6)) {
    return NextResponse.json({ error: 'PHONE_REQUIRED' }, { status: 400 });
  }

  const exchangeRes = await fetch(`${API_URL}/api/social-auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...socialAuthHeaders() },
    body: JSON.stringify({
      email: ticket.email,
      name: ticket.name,
      mode: 'register',
      serviceType,
      phone,
      preferredLanguage,
      providerUserId: ticket.providerUserId,
      authProvider: ticket.authProvider,
    }),
  });

  if (!exchangeRes.ok) {
    const text = await exchangeRes.text();
    let error = 'INTERNAL_ERROR';
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) error = String(parsed.error).toUpperCase();
    } catch {}
    return NextResponse.json({ error }, { status: exchangeRes.status });
  }

  const { jwt } = await exchangeRes.json();
  const res = NextResponse.json({ jwt });
  res.cookies.delete(SOCIAL_TICKET_COOKIE);
  return res;
}
