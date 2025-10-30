import { NextRequest } from "next/server";
import { getAppBaseUrl } from "@/lib/social";
import { API_URL } from "@/services/api";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const base = getAppBaseUrl(req as unknown as Request);
    const code = req.nextUrl.searchParams.get("code");
    const stateRaw = req.nextUrl.searchParams.get("state");
    const state = stateRaw ? JSON.parse(decodeURIComponent(stateRaw)) : {};
    const locale: string = state.locale || "en";
    const mode: 'login' | 'register' = state.mode || 'login';
    const serviceType: string | undefined = state.serviceType || undefined;
    const redirect: string | undefined = state.redirect || undefined;

    if (!code) return new Response("Missing code", { status: 400 });

    const clientId = process.env.FACEBOOK_CLIENT_ID as string;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET as string;
    const redirectUri = `${base}/api/auth/facebook/callback`;

    if (!clientId || !clientSecret) {
      return new Response("Missing Facebook OAuth envs", { status: 500 });
    }

    // Exchange code for token
    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
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
    const userUrl = new URL("https://graph.facebook.com/me");
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        mode,
        serviceType: serviceType || null,
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
