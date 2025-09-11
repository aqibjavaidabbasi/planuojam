import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/config/i18n';

export default getRequestConfig(async ({requestLocale}) => {
  // Force the default locale for root path and unsupported locales
  const pathname = typeof window !== 'undefined' 
    ? window.location.pathname 
    : '/';
    
  // If we're at the root path or have an unsupported locale, use default
  if (pathname === '/' || !(await requestLocale)) {
    return {
      locale: DEFAULT_LOCALE,
      messages: (await import(`../app/messages/${DEFAULT_LOCALE}.json`)).default
    };
  }
  
  // For other paths, verify the locale
  const requested = await Promise.resolve(requestLocale);
  const locale = hasLocale(SUPPORTED_LOCALES, requested) ? requested : DEFAULT_LOCALE;
  
  console.log('Default locale:', DEFAULT_LOCALE);
  console.log('Requested locale:', requested);
  console.log('Final locale:', locale);

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