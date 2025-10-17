import { SelectedCategoriesList } from "@/types/pagesTypes";

// lib/url.ts
export function getCompleteImageUrl(path: string) {
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

export type ExpectedError = {
  error: {
    key: string;
    field?: string;
    [k: string]: unknown;
  };
};

// Utility: safely extract Strapi v5 error message
export const getStrapiErrorMessage = (error: ExpectedError): string => {
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
    if (error && typeof error === 'object' && 'error' in error && 'key' in error.error) return error.error.key as string;
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }
  return "An unexpected error occurred";
};

// Basic transliteration for Cyrillic → Latin
const cyrillicMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ы: "y", э: "e",
  ю: "yu", я: "ya", ъ: "", ь: "",
  А: "a", Б: "b", В: "v", Г: "g", Д: "d", Е: "e", Ё: "yo", Ж: "zh", З: "z", И: "i",
  Й: "y", К: "k", Л: "l", М: "m", Н: "n", О: "o", П: "p", Р: "r", С: "s", Т: "t",
  У: "u", Ф: "f", Х: "h", Ц: "ts", Ч: "ch", Ш: "sh", Щ: "sch", Ы: "y", Э: "e",
  Ю: "yu", Я: "ya", Ъ: "", Ь: ""
};

export function slugify(input: string): string {
  if (!input) return "";


  const transliterated = input
    .split("")
    .map((ch) => cyrillicMap[ch] ?? ch)
    .join("");

  return transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/ß/g, "ss")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/đ/g, "d")
    .replace(/ħ/g, "h")
    .replace(/ı/g, "i")
    .replace(/ł/g, "l")
    .replace(/Œ/g, "oe")
    .replace(/©/g, "c")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
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