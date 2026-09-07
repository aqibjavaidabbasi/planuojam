import crypto from "crypto";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/config/i18n";

export function derivePassword(provider: string, providerUserId: string, secret?: string) {
  const s = secret || process.env.SOCIAL_AUTH_SECRET || process.env.NEXTAUTH_SECRET || "default-social-secret";
  const h = crypto.createHmac("sha256", s);
  h.update(`${provider}:${providerUserId}`);
  // Keep it reasonably long to satisfy Strapi password policy
  return h.digest("hex").slice(0, 32) + "Aa1!"; // ensure complexity
}

// Production serves only the locales in SUPPORTED_LOCALES; any other prefix 404s
// (middleware rewrites /en/x -> /lt/en/x). Never build a redirect from an unvalidated locale.
export function safeLocale(maybe?: string | null) {
  return maybe && SUPPORTED_LOCALES.includes(maybe) ? maybe : DEFAULT_LOCALE;
}

export const SOCIAL_TICKET_COOKIE = "pending_social";
const TICKET_TTL_MS = 15 * 60 * 1000;

export type SocialTicket = {
  email: string;
  name: string;
  providerUserId: string;
  authProvider: string;
  exp: number;
};

// Fails closed on purpose: signing identity tickets with a hardcoded fallback would
// let anyone forge one and register (or take over) any email address.
function ticketSecret() {
  const s = process.env.SOCIAL_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("SOCIAL_AUTH_SECRET (or NEXTAUTH_SECRET) must be set to sign social signup tickets");
  return s;
}

// The provider-verified identity, signed so it survives the redirect to /auth/register
// without the browser being able to edit it. Never trust an email the client sends back.
export function signSocialTicket(t: Omit<SocialTicket, "exp">) {
  const body = Buffer.from(JSON.stringify({ ...t, exp: Date.now() + TICKET_TTL_MS })).toString("base64url");
  const sig = crypto.createHmac("sha256", ticketSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySocialTicket(token?: string | null): SocialTicket | null {
  const [body, sig] = (token || "").split(".");
  if (!body || !sig) return null;
  let expected: string;
  try {
    expected = crypto.createHmac("sha256", ticketSecret()).update(body).digest("base64url");
  } catch {
    return null;
  }
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const t = JSON.parse(Buffer.from(body, "base64url").toString()) as SocialTicket;
    return t.exp > Date.now() ? t : null;
  } catch {
    return null;
  }
}

// Shared secret proving a /social-auth/exchange call came from this app and not
// straight off the internet. Inert until SOCIAL_AUTH_SECRET is set on both sides.
export function socialAuthHeaders(): Record<string, string> {
  const s = process.env.SOCIAL_AUTH_SECRET;
  return s ? { "x-social-auth-secret": s } : {};
}

export function getAppBaseUrl(request: Request) {
  // Prefer explicit env var for production, fallback to request origin
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export function safeRedirectTo(defaultPath: string, maybeUrl?: string | null) {
  if (!maybeUrl) return defaultPath;
  try {
    const u = new URL(maybeUrl);
    // Only allow same-origin redirects
    const allowed = process.env.NEXT_PUBLIC_APP_URL || `${u.protocol}//${u.host}`;
    if (maybeUrl.startsWith(allowed)) return maybeUrl;
    return defaultPath;
  } catch {
    return defaultPath;
  }
}
