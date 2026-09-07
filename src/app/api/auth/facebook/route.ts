import { NextRequest } from "next/server";
import { getAppBaseUrl, safeLocale } from "@/lib/social";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const base = getAppBaseUrl(req as unknown as Request);
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const locale = safeLocale(req.nextUrl.searchParams.get("locale"));
  const mode = req.nextUrl.searchParams.get("mode") || "login";
  const serviceType = req.nextUrl.searchParams.get("serviceType") || "";
  const phone = req.nextUrl.searchParams.get("phone") || "";
  const redirect = req.nextUrl.searchParams.get("redirect") || "";

  if (!clientId) {
    return new Response("Missing FACEBOOK_CLIENT_ID", { status: 500 });
  }

  const redirectUri = `${base}/api/auth/facebook/callback`;
  const state = encodeURIComponent(JSON.stringify({ locale, mode, serviceType, phone, redirect }));
  const authUrl = new URL("https://www.facebook.com/v23.0/dialog/oauth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "email,public_profile");
  authUrl.searchParams.set("state", state);
  // Facebook silently omits a permission the user previously declined and will not
  // ask again unless we explicitly re-request it, which would otherwise strand
  // anyone who unchecked "email" on the missing-email error forever.
  if (req.nextUrl.searchParams.get("rerequest")) {
    authUrl.searchParams.set("auth_type", "rerequest");
  }

  return Response.redirect(authUrl.toString(), 302);
}
