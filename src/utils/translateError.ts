// Translator type compatible with next-intl's t function.
// Keep it minimal to avoid parameter contravariance issues during assignment.
export type Translator = (key: string) => string;

/**
 * Translate an Error or unknown into a localized message.
 * If the message starts with "Errors.", it will be looked up in the Errors namespace via tErrors.
 * Otherwise, returns the original message or a provided i18n fallback via t(fallbackKey).
 */
export function translateError(
  t: Translator,
  tErrors: Translator,
  err: unknown,
  fallbackKey: string = 'Errors.Api.generic'
): string {
  // Prefer messages coming from Error
  const msg = typeof err === 'object' && err instanceof Error
    ? err.message
    : typeof err === 'string'
      ? err
      : '';

  if (typeof msg === 'string' && msg.startsWith('Errors.')) {
    const subKey = msg.replace(/^Errors\./, '');
    return tErrors(subKey);
  }

  if (msg) return msg;
  // Fall back to i18n default
  // Allow caller to pass full path; if it starts with Errors., strip for tErrors
  if (fallbackKey.startsWith('Errors.')) {
    return tErrors(fallbackKey.replace(/^Errors\./, ''));
  }
  return t(fallbackKey);
}
