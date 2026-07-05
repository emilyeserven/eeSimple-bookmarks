import type { InitOptions } from "i18next";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { registerBuiltInNameKeys } from "./lib/builtInNameKeys";
import ja from "./locales/ja.json";

/**
 * The interface locales the app can render in. `"en"` is the source language — its strings live
 * inline as the `t()` **keys** themselves (English-phrase / natural keys), so there is no `en.json`.
 * `"ja"` maps each English phrase → its Japanese translation (see `src/locales/ja.json`).
 */
export const SUPPORTED_LOCALES = ["en", "ja"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** The active-locale fallback used before the interface-language setting resolves. */
export const DEFAULT_LOCALE: AppLocale = "en";

/**
 * i18next configuration shared by the app runtime and tests.
 *
 * English-phrase keys: `t("Save changes")` renders `"Save changes"` verbatim when no translation
 * exists, so untranslated UI looks exactly as it does today (and the existing text assertions /
 * stories pass unchanged). `keySeparator`/`nsSeparator` are disabled so a phrase like
 * `"Settings: Display"` is treated as one flat key rather than a nested path. `fallbackLng: false`
 * makes a missing key resolve to the key itself — i.e. the English source phrase.
 */
export const I18N_OPTIONS: InitOptions = {
  resources: {
    ja: {
      translation: ja,
    },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: false,
  supportedLngs: [...SUPPORTED_LOCALES],
  keySeparator: false,
  nsSeparator: false,
  interpolation: {
    // React already escapes rendered values; double-escaping would corrupt interpolated markup.
    escapeValue: false,
  },
  // An empty translation value should fall through to the key, not render a blank string.
  returnEmptyString: false,
  react: {
    // `ja.json` is bundled and init is synchronous, so there is nothing to await — skip Suspense so
    // components (and tests) never need a boundary around a `t()` call.
    useSuspense: false,
  },
};

// Initialize synchronously: `ja.json` is bundled (a single extra locale), so there is no async
// backend/Suspense to await. Import this module in `main.tsx` before the first render.
void i18next.use(initReactI18next).init(I18N_OPTIONS);

// Anchor the seeded built-in entity names (rendered via the dynamic `builtInName(row)` / `t(row.name)`)
// so `i18n:extract` / `i18n:check-stale` track their phrase keys. A one-off no-op at startup.
registerBuiltInNameKeys(i18next.t);

export default i18next;
