// lib/getAlternates.ts
export function getAlternates(
  localizations: { locale: string; slug: string }[],
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "",
  defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en"
): Record<string, string> {
  const base = baseUrl.replace(/\/$/, ""); // drop trailing slash
  const langs = localizations.reduce<Record<string, string>>((acc, loc) => {
    const locale = String(loc.locale);
    // build absolute URL but keep it safe if base is empty
    const path = `/${locale}/${loc.slug}`.replace(/\/+/g, "/");
    acc[locale] = base ? `${base}${path}` : path;
    return acc;
  }, {});

  // Ensure x-default points to default locale (or first available)
  langs["x-default"] = langs[defaultLocale] || Object.values(langs)[0] || (base ? `${base}/${defaultLocale}` : `/${defaultLocale}`);

  return langs;
}
