import type { Language } from "@eesimple/types";
import type { TFunction } from "i18next";

import { useTranslation } from "react-i18next";

import { useAppLocale } from "@/hooks/useAppLocale";
import { languageDisplayName } from "@/lib/languageDisplay";

/**
 * Seeded built-in entity names (media types, usage levels, the "Default" card rule, …) are stored as
 * **English data** in Postgres — matching, uniqueness, and server-side search are all keyed on them,
 * so the DB value must stay English. These helpers translate them **only at render**, gated on the
 * row's `builtIn` (or `isDefault`) flag; user-created rows are shown verbatim.
 *
 * Invariant: never feed a translated name back to the server or use it for matching/uniqueness — this
 * is display-only. Comboboxes over built-ins pass `searchAlias: row.name` (the English name) so a
 * translated label still matches an English-typed query.
 */

/** Translate a built-in row's name; return a user row's name unchanged. */
export function builtInName(row: { name: string;
  builtIn?: boolean; }, t: TFunction): string {
  return row.builtIn ? t(row.name) : row.name;
}

/** Hook form: returns a `builtInName` bound to the active `t`, so callers re-render on locale change. */
export function useBuiltInName(): (row: { name: string;
  builtIn?: boolean; }) => string {
  const {
    t,
  } = useTranslation();
  return row => builtInName(row, t);
}

/**
 * Display name for a `Language` row. Built-ins with an ISO code render via `Intl.DisplayNames` in the
 * active locale (so the 52 seeded language names need no catalog entries); custom languages and rows
 * without a code fall back to the stored `name`.
 */
export function languageName(
  language: Pick<Language, "name" | "isoCode" | "builtIn">,
  locale: string,
): string {
  return language.builtIn && language.isoCode
    ? languageDisplayName(language.isoCode, locale)
    : language.name;
}

/** Hook form of {@link languageName}, bound to the active interface locale. */
export function useLanguageName(): (language: Pick<Language, "name" | "isoCode" | "builtIn">) => string {
  const locale = useAppLocale();
  return language => languageName(language, locale);
}
