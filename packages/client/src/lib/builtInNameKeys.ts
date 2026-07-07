import type { TFunction } from "i18next";

/**
 * Extraction anchors for seeded built-in entity names.
 *
 * Built-in names are rendered via `builtInName(row, t)` / `t(row.name)` with a **dynamic** key, which
 * `pnpm i18n:extract` and `i18n:check-stale` can't see. This module lists each seeded name as a
 * literal `t("…")` call so both tools track the phrase keys (extract seeds an English placeholder in
 * `ja.json`; check-stale counts them as referenced). It is intentionally never invoked at runtime.
 *
 * Keep in sync with the seed source of truth in the middleware:
 *   - media types        → `BUILT_IN_MEDIA_TYPES` in `packages/middleware/src/services/mediaTypes.ts`
 *   - usage levels       → `BUILT_IN_LEVELS` in `packages/middleware/src/services/languageUsageLevels.ts`
 *   - card rule          → the `"Default"` rule in `packages/middleware/src/services/cardDisplayRules.ts`
 *   - relationship types → `BUILT_IN_RELATIONSHIP_TYPES` in `packages/middleware/src/services/relationshipTypes.ts`
 *   - group types        → `DEFAULT_GROUP_TYPES` in `packages/middleware/src/services/groupTypes.ts`
 *   - translation sources → `BUILT_IN_TRANSLATION_SOURCE_NAMES` in `packages/types/src/translationSources.ts`
 *
 * Language names are NOT listed here — they render via `Intl.DisplayNames` (see `languageName`), so
 * the 52 seeded language names need no catalog entries.
 */
export function registerBuiltInNameKeys(t: TFunction): void {
  void [
    // Media types
    t("Video"),
    t("Video Game"),
    t("Audio"),
    t("Podcast"),
    t("Music"),
    t("Interview"),
    t("Document"),
    t("Article"),
    t("Image"),
    t("Book"),
    t("Website/App"),
    t("Social Media Post"),
    t("Franchise"),
    t("Other"),
    // Language usage levels (availability)
    t("Dub"),
    t("Subtitles"),
    t("Explanations"),
    t("Primary Language"),
    // Language usage levels (proficiency)
    t("Native"),
    t("Fluent"),
    t("Conversational"),
    t("Learning"),
    // Card display rule
    t("Default"),
    // Relationship types
    t("Similar"),
    t("Parent/child"),
    t("Opposite"),
    t("About"),
    // Group types
    t("Company"),
    t("Podcast, Multi-Host"),
    t("Doujin Circle"),
    t("Creator Collaborative"),
    // Translation sources
    t("AI generated"),
    t("User-translated"),
    t("Fan-translated"),
    t("Professionally translated"),
  ];
}
