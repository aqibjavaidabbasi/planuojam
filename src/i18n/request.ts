import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  console.log("Request locale:", requestLocale);
  // Make sure we have a string value for locale
  const resolvedLocale = String(await requestLocale);
  const locale: string = hasLocale(routing.locales, resolvedLocale)
    ? resolvedLocale
    : routing.defaultLocale;

  console.log("Resolved locale:", locale);
  console.log("locale", locale)

  // Load translation messages for the resolved locale
  let messages: Record<string, unknown> = {};
  try {
    messages = (await import(`../app/messages/${locale}.json`)).default;
  } catch {
    // If the messages for the requested locale are not found,
    // try to load the default locale messages
    if (locale !== routing.defaultLocale) {
      try {
        messages = (await import(`../app/messages/${routing.defaultLocale}.json`)).default;
      } catch {
        // If no messages file is found, leave as empty
      }
    }
  }

  return {
    locale,
    messages
  };
});