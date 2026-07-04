import type { AppLocale } from "../i18n";

import { useTranslation } from "react-i18next";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../i18n";

/**
 * The active interface locale as a BCP-47 tag (`"en"` / `"ja"`), read from the live i18next
 * instance. Consumed by locale-aware formatting (`lib/datetime.ts`, `lib/languageDisplay.ts`) so
 * dates, times, and `Intl.DisplayNames` output render in the language the UI is showing. Falls back
 * to {@link DEFAULT_LOCALE} for any language i18next reports that the app doesn't support.
 */
export function useAppLocale(): AppLocale {
  const {
    i18n,
  } = useTranslation();
  const lng = i18n.language;
  return (SUPPORTED_LOCALES as readonly string[]).includes(lng) ? (lng as AppLocale) : DEFAULT_LOCALE;
}
