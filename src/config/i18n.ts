export const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en';
export const SUPPORTED_LOCALES = (process.env.NEXT_PUBLIC_SUPPORTED_LOCALES || 'en').split(',').map(l => l.trim());
// Human-readable labels for locales
export const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  lt: 'Lietuvių',
  ru: 'Russian'
};

// Convenience: options for selects based on supported locales
export const LOCALE_OPTIONS = SUPPORTED_LOCALES.map(code => ({
  code,
  label: LOCALE_LABELS[code] ?? code.toUpperCase()
}));
