import { SelectedCategoriesList } from "@/types/pagesTypes";

// lib/url.ts
export function getCompleteImageUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  return `${base}/${path.replace(/^\/+/, "")}`; // safe absolute URL
}


export function filterUniqueCategoriesByParent(data: SelectedCategoriesList) {
  // Deduplicate based on category.documentId and filter by parentCategory.parent.name
  return data.categoryListItem.filter(
    (item, index, self) =>
      // Keep first occurrence of documentId
      index ===
        self.findIndex(
          (t) => t.category.documentId === item.category.documentId
        ) &&
      // Match parent category name
      item.category.parentCategory?.name === data.parentCategory.parent.name
  );
}

// Utility: safely extract Strapi v5 error message
export const getStrapiErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.response && typeof errorObj.response === 'object') {
      const response = errorObj.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (data.error && typeof data.error === 'object') {
          const errorData = data.error as Record<string, unknown>;
          if (typeof errorData.message === 'string') {
            return errorData.message;
          }
        }
      }
    }
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }
  return "An unexpected error occurred";
};

export function slugify(input: string): string {
  if (!input) return "";

  return input
    .normalize("NFKD") // split accented characters into base + diacritic
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/ß/g, "ss") // German sharp S
    .replace(/æ/g, "ae") // Latin ligature
    .replace(/ø/g, "o")
    .replace(/đ/g, "d")
    .replace(/ħ/g, "h")
    .replace(/ı/g, "i")
    .replace(/ł/g, "l")
    .replace(/Œ/g, "oe")
    .replace(/©/g, "c")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // keep only alphanumerics, replace others with `-`
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .replace(/-{2,}/g, "-"); // collapse multiple dashes
}

// Generate a short alphanumeric string suitable for appending to slugs
// Uses crypto.getRandomValues when available for better randomness; falls back to Math.random.
export function shortId(length: number = 6): string {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      // Map bytes to base36 [0-9a-z]
      return Array.from(bytes, (b) => (b % 36).toString(36)).join('');
    }
  // Fallback
  return Math.random().toString(36).slice(2, 2 + length);
}