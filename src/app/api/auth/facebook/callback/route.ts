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

    const clientId = process.env.FACEBOOK_CLIENT_ID as string;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET as string;
    const redirectUri = `${base}/api/auth/facebook/callback`;

    if (!clientId || !clientSecret) {
      return new Response("Missing Facebook OAuth envs", { status: 500 });
    }

    // Exchange code for token
    const tokenUrl = new URL("https://graph.facebook.com/v23.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("client_secret", clientSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString(), { method: "GET" });
    if (!tokenRes.ok) {
      const finalRedirect = `${base}/${locale}/auth/callback`;
      const url = new URL(finalRedirect);
      url.searchParams.set("error", "INTERNAL_ERROR");
      if (redirect) url.searchParams.set("redirect", redirect);
      return Response.redirect(url.toString(), 302);
    }
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token as string;

    // Get user info
    const userUrl = new URL("https://graph.facebook.com/v23.0/me");
    userUrl.searchParams.set("fields", "id,name,email,picture");
    userUrl.searchParams.set("access_token", accessToken);
    const userRes = await fetch(userUrl.toString());

    if (!userRes.ok) {
      const finalRedirect = `${base}/${locale}/auth/callback`;
      const url = new URL(finalRedirect);
      url.searchParams.set("error", "INTERNAL_ERROR");
      if (redirect) url.searchParams.set("redirect", redirect);
      return Response.redirect(url.toString(), 302);
    }

    const profile = await userRes.json();
    const providerUserId = profile.id as string;
    const email = (profile.email as string) || "";
    const name = (profile.name as string) || email || "user";

    if (!email) {
      // Many Facebook accounts don't have email permission; require it
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
        authProvider: 'facebook',
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
        url.searchParams.set("social", "facebook");
        url.searchParams.set("email", email);
        if (redirect) url.searchParams.set("redirect", redirect);
        const res = NextResponse.redirect(url.toString(), 302);
        res.cookies.set(SOCIAL_TICKET_COOKIE, signSocialTicket({
          email, name, providerUserId, authProvider: 'facebook',
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
    const { jwt } = await exchangeRes.json();

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
