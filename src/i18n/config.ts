/**
 * i18n configuration for RouterForge.
 *
 * Notes on naming fixes from the original requirements:
 * - "البرتقالية" was ambiguous; treated as Portuguese (pt).
 * - "الهندسة" was ambiguous; treated as Hindi (hi).
 * RTL locales: ar (Arabic), he (Hebrew), fa (Persian).
 */

export const locales = [
  'en',
  'fr',
  'de',
  'es',
  'pt',
  'ru',
  'vi',
  'zh',
  'hi',
  'bn',
  'ms',
  'ja',
  'ko',
  'ar',
  'he',
  'fa',
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const rtlLocales: readonly Locale[] = ['ar', 'he', 'fa'] as const;

export function isRtl(locale: string): boolean {
  return (rtlLocales as readonly string[]).includes(locale);
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const localeLabels: Record<Locale, { native: string; english: string; flag: string }> = {
  en: { native: 'English', english: 'English', flag: '🇺🇸' },
  fr: { native: 'Français', english: 'French', flag: '🇫🇷' },
  de: { native: 'Deutsch', english: 'German', flag: '🇩🇪' },
  es: { native: 'Español', english: 'Spanish', flag: '🇪🇸' },
  pt: { native: 'Português', english: 'Portuguese', flag: '🇵🇹' },
  ru: { native: 'Русский', english: 'Russian', flag: '🇷🇺' },
  vi: { native: 'Tiếng Việt', english: 'Vietnamese', flag: '🇻🇳' },
  zh: { native: '简体中文', english: 'Chinese (Simplified)', flag: '🇨🇳' },
  hi: { native: 'हिन्दी', english: 'Hindi', flag: '🇮🇳' },
  bn: { native: 'বাংলা', english: 'Bengali', flag: '🇧🇩' },
  ms: { native: 'Bahasa Melayu', english: 'Malay', flag: '🇲🇾' },
  ja: { native: '日本語', english: 'Japanese', flag: '🇯🇵' },
  ko: { native: '한국어', english: 'Korean', flag: '🇰🇷' },
  ar: { native: 'العربية', english: 'Arabic', flag: '🇸🇦' },
  he: { native: 'עברית', english: 'Hebrew', flag: '🇮🇱' },
  fa: { native: 'فارسی', english: 'Persian', flag: '🇮🇷' },
};
