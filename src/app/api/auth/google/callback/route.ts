import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl, safeLocale, signSocialTicket, socialAuthHeaders, SOCIAL_TICKET_COOKIE } from "@/lib/social";
import { API_URL } from "@/services/api";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const base = getAppBaseUrl(req as unknown as Request);
    const code = req.nextUrl.searchParams.get("code");
    const stateRaw = req.nextUrl.searchParams.get("state");
    const state = stateRaw ? JSON.parse(decodeURIComponent(stateRaw)) : {};
    const locale: string = safeLocale(state.locale);
    const mode: 'login' | 'register' = state.mode || 'login';
    const serviceType: string | undefined = state.serviceType || undefined;
    const phone: string | undefined = state.phone || undefined;
    const redirect: string | undefined = state.redirect || undefined;

    if (!code) return new Response("Missing code", { status: 400 });

    const clientId = process.env.GOOGLE_CLIENT_ID as string;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
    const redirectUri = `${base}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return new Response("Missing Google OAuth envs", { status: 500 });
    }

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const finalRedirect = `${base}/${locale}/auth/callback`;
      const url = new URL(finalRedirect);
      url.searchParams.set("error", "INTERNAL_ERROR");
      if (redirect) url.searchParams.set("redirect", redirect);
      return Response.redirect(url.toString(), 302);
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token as string;
    // Fetch user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
      const finalRedirect = `${base}/${locale}/auth/callback`;
      const url = new URL(finalRedirect);
      url.searchParams.set("error", "INTERNAL_ERROR");
      if (redirect) url.searchParams.set("redirect", redirect);
      return Response.redirect(url.toString(), 302);
    }
    
    const profile = await userRes.json();
    const providerUserId = profile.sub as string;
    const email = (profile.email as string) || "";
    const name = (profile.name as string) || email || "user";

    if (!email) {
      // Require email for Strapi local auth
      const fallback = `/${locale}/auth/login?error=missing_email`;
      return Response.redirect(new URL(fallback, base).toString(), 302);
    }

    // Call Strapi custom endpoint for passwordless social login/register
    const exchangeRes = await fetch(`${API_URL}/api/social-auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...socialAuthHeaders() },
      body: JSON.stringify({
        email,
        name,
        mode,
        serviceType: serviceType || null,
        phone: phone || null,
        providerUserId,
        authProvider: 'google',
      }),
    });
    if (!exchangeRes.ok) {
      const text = await exchangeRes.text();
      let code = 'INTERNAL_ERROR';
      try {
        const parsed = JSON.parse(text);
        if (parsed?.error) code = String(parsed.error).toUpperCase();
      } catch {}
      // First social login with no account yet. Carry the provider-verified identity
      // forward in a signed, httpOnly cookie so /auth/register can finish the signup
      // with one form submit -- no second trip through the provider.
      if (code === 'USER_NOT_FOUND') {
        const url = new URL(`${base}/${locale}/auth/register`);
        url.searchParams.set("social", "google");
        url.searchParams.set("email", email);
        if (redirect) url.searchParams.set("redirect", redirect);
        const res = NextResponse.redirect(url.toString(), 302);
        res.cookies.set(SOCIAL_TICKET_COOKIE, signSocialTicket({
          email, name, providerUserId, authProvider: 'google',
        }), {
          httpOnly: true,
          sameSite: 'lax',
          secure: base.startsWith('https'),
          path: '/',
          maxAge: 900,
        });
        return res;
      }
      const finalRedirect = `${base}/${locale}/auth/callback`;
      const url = new URL(finalRedirect);
      url.searchParams.set("error", code);
      if (redirect) url.searchParams.set("redirect", redirect);
      return Response.redirect(url.toString(), 302);
    }

    const exchangeJson = await exchangeRes.json();
    const { jwt } = exchangeJson;

    const finalRedirect = `${base}/${locale}/auth/callback`;
    const url = new URL(finalRedirect);
    if (jwt) url.searchParams.set("jwt", jwt);
    if (redirect) url.searchParams.set("redirect", redirect);
    return Response.redirect(url.toString(), 302);
  } catch {
    const base = getAppBaseUrl(req as unknown as Request);
    const finalRedirect = `${base}/auth/callback`;
    const url = new URL(finalRedirect);
    url.searchParams.set("error", "INTERNAL_ERROR");
    return Response.redirect(url.toString(), 302);
  }
}
