import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/constants/config";

export { SUPPORTED_LOCALES, DEFAULT_LOCALE };

// Locale message loader — used by useTranslation patterns
export async function getMessages(locale: string) {
  const safeLocale = (SUPPORTED_LOCALES as readonly string[]).includes(locale)
    ? locale
    : DEFAULT_LOCALE;
  try {
    return (await import(`../i18n/messages/${safeLocale}.json`)).default;
  } catch {
    return (await import(`../i18n/messages/en.json`)).default;
  }
}

