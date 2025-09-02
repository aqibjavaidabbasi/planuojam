import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Load translation messages for the resolved locale
  let messages: Record<string, unknown> = {};
  try {
    messages = (await import(`../app/messages/${locale}.json`)).default;
  } catch {
    // If no messages file is found, leave as empty to surface a clear error downstream
  }

  return {
    locale,
    messages
  };
});