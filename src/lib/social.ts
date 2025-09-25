import crypto from "crypto";

export function derivePassword(provider: string, providerUserId: string, secret?: string) {
  const s = secret || process.env.SOCIAL_AUTH_SECRET || process.env.NEXTAUTH_SECRET || "default-social-secret";
  const h = crypto.createHmac("sha256", s);
  h.update(`${provider}:${providerUserId}`);
  // Keep it reasonably long to satisfy Strapi password policy
  return h.digest("hex").slice(0, 32) + "Aa1!"; // ensure complexity
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
