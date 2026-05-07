const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://planuojam.lt";

export function getEmailUrl(path: string) {
  const baseUrl = APP_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}
