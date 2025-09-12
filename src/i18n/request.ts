import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/config/i18n';

export default getRequestConfig(async ({requestLocale}) => {
  // For other paths, verify the locale
  const requested = await Promise.resolve(requestLocale);
  const locale = hasLocale(SUPPORTED_LOCALES, requested) ? requested : DEFAULT_LOCALE;

  // Load translation messages for the resolved locale
  let messages: Record<string, unknown> = {};
  
  try {
    messages = (await import(`../app/messages/${locale}.json`)).default;
  } catch (error) {
    console.warn(`Failed to load messages for locale: ${locale}`, error);
    
    // // Only try fallback if we're not already on the default locale
    if (locale !== DEFAULT_LOCALE) {
      try {
        messages = (await import(`../app/messages/${DEFAULT_LOCALE}.json`)).default;
        console.log(`Loaded fallback messages for locale: ${DEFAULT_LOCALE}`);
      } catch (fallbackError) {
        console.error(`Failed to load fallback messages`, fallbackError);
      }
    }
  }

  // Explicitly set the locale in the messages object
  messages._locale = locale;

  return {
    locale,
    messages
  };
});