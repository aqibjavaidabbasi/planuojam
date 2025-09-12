import {defineRouting} from 'next-intl/routing';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/config/i18n';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: SUPPORTED_LOCALES,

  // Used when no locale matches
  defaultLocale: DEFAULT_LOCALE,

  // Always show the locale prefix in URLs
  localePrefix: 'always',

  //locale detection
  localeDetection: false
});