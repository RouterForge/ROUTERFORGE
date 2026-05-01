import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale, type Locale } from './config';

// Deep-merge two plain message objects (locale overrides fallback).
function deepMerge<T extends Record<string, any>>(base: T, override: Partial<T>): T {
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const key of Object.keys(override ?? {})) {
    const bv = (base as any)?.[key];
    const ov = (override as any)[key];
    if (
      bv &&
      ov &&
      typeof bv === 'object' &&
      typeof ov === 'object' &&
      !Array.isArray(bv) &&
      !Array.isArray(ov)
    ) {
      out[key] = deepMerge(bv, ov);
    } else if (ov !== undefined) {
      out[key] = ov;
    }
  }
  return out;
}

async function loadMessages(locale: Locale) {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch {
    return {};
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = requested && isLocale(requested) ? requested : defaultLocale;

  const english = (await import(`../../messages/${defaultLocale}.json`)).default;
  const localized = locale === defaultLocale ? {} : await loadMessages(locale);
  const messages = deepMerge(english, localized);

  return {
    locale,
    messages,
    timeZone: 'UTC',
    now: new Date(),
  };
});
