export function getListingPath(slug: string, locale?: string): string {
  if (!slug) return '#';
  return locale ? `/${locale}/listing/${slug}` : `/listing/${slug}`;
}

export function getListingEditPath(slug: string, locale?: string): string {
  if (!slug) return '#';
  return locale ? `/${locale}/listing/${slug}/edit` : `/listing/${slug}/edit`;
}
