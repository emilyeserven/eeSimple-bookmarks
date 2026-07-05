/**
 * Shared "Translation Source" types.
 *
 * A {@link TranslationSource} is a user-managed vocabulary entry describing *how* a language's
 * translation/script on an item was produced — e.g. "AI generated", "Fan-translated",
 * "Professionally translated". A {@link LanguageUsage} row may optionally carry one; it is purely
 * human-authored expressiveness and is never autofilled.
 *
 * Mirrors {@link LanguageUsageLevel} but flat — there is no `kind` grouping. This module is pure so
 * it runs unchanged in the Fastify API and the browser.
 */

/** A user-managed translation-source vocabulary entry. */
export interface TranslationSource {
  id: string;
  name: string;
  slug: string;
  /** Seeded built-ins can't be renamed or deleted; users may add custom ones. */
  builtIn: boolean;
  sortOrder: number;
  createdAt: string;
  /** How many language-usage associations currently reference this source. Computed server-side. */
  usageCount: number;
}

export interface CreateTranslationSourceInput {
  name: string;
  sortOrder?: number;
}

export interface UpdateTranslationSourceInput {
  name?: string;
  sortOrder?: number;
}

/** Built-in translation sources seeded on boot — the starting vocabulary. */
export const BUILT_IN_TRANSLATION_SOURCE_NAMES = [
  "AI generated",
  "User-translated",
  "Fan-translated",
  "Professionally translated",
] as const;
