import { NextRequest } from "next/server";
import { getAppBaseUrl } from "@/lib/social";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const base = getAppBaseUrl(req as unknown as Request);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const locale = req.nextUrl.searchParams.get("locale") || "en";
  const mode = req.nextUrl.searchParams.get("mode") || "login";
  const serviceType = req.nextUrl.searchParams.get("serviceType") || "";
  const phone = req.nextUrl.searchParams.get("phone") || "";
  const redirect = req.nextUrl.searchParams.get("redirect") || "";

  if (!clientId) {
    return new Response("Missing GOOGLE_CLIENT_ID", { status: 500 });
  }

  const redirectUri = `${base}/api/auth/google/callback`;
  
  const state = encodeURIComponent(JSON.stringify({ locale, mode, serviceType, phone, redirect }));
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("state", state);

  return Response.redirect(authUrl.toString());
}
