/**
 * Shared "Entity Name" types + display/sort/slug helpers.
 *
 * An entity (a bookmark or taxonomy term) may carry MULTIPLE names, each labelled by a language —
 * e.g. a Japanese primary title alongside an English title. This generalizes the current single
 * `name`/`title` + optional `romanizedName` model (see `romanized.ts`, which these helpers will
 * eventually replace — it stays untouched until the cleanup issue). One row per owner is flagged
 * `isPrimary` and mirrors the owner's denormalized base `name`/`title` column; the English-language
 * row is preferred as the slug source so slugs stay ASCII/readable even for a non-Latin primary.
 *
 * This module is pure so it runs unchanged in the Fastify API and the browser.
 */

/**
 * The owner entities an `entity_names` row can attach to. Mirrors the middleware's
 * `ENTITY_NAME_OWNER_TYPES`; the polymorphic association is keyed by `(ownerType, ownerId)` with no
 * FK on `ownerId` (the same trade `language_usages` / `taxonomy_images` make). The single edit
 * point when adding or removing a target entity.
 */
export const ENTITY_NAME_OWNER_TYPES = [
  "bookmark",
  "category",
  "tag",
  "mediaType",
  "genreMood",
  "location",
  "person",
  "group",
  "book",
  "podcast",
  "movie",
  "tvShow",
  "episode",
  "album",
  "track",
] as const;
export type EntityNameOwnerType = typeof ENTITY_NAME_OWNER_TYPES[number];

/** A single language-labelled name for an owner entity, denormalized for display. */
export interface EntityName {
  /** The association row id. */
  id: string;
  language: {
    id: string;
    name: string;
    slug: string;
    isoCode: string | null;
  };
  /** The name/title text in that language. */
  value: string;
  /** Exactly one row per owner is the primary; it mirrors the owner's base name/title column. */
  isPrimary: boolean;
  sortOrder: number;
}

/** Convenience alias for the array carried on a hydrated `Bookmark`. */
export type BookmarkEntityName = EntityName;

/** One entry in a replace-all `PUT /api/entity-names/:ownerType/:ownerId` request. */
export interface UpdateEntityNameEntry {
  languageId: string;
  value: string;
  isPrimary?: boolean;
}

/** A primary label and an optional de-emphasized secondary label to render after it. */
export interface EntityDisplayNames {
  primary: string;
  secondary: string | null;
}

/** A language reference to prefer, matched by row id and/or ISO 639-1 code. */
export interface PreferredLanguage {
  id?: string | null;
  isoCode?: string | null;
}

/** Whether an entity name is in the preferred language (matched by id first, then ISO code). */
function matchesLanguage(name: EntityName, preferred: PreferredLanguage): boolean {
  if (preferred.id && name.language.id === preferred.id) return true;
  const iso = preferred.isoCode?.toLowerCase();
  return iso != null && iso.length > 0 && name.language.isoCode?.toLowerCase() === iso;
}

/**
 * Decide which of an entity's names to show. The primary is the name in `preferredLanguage` when one
 * is present, else the `isPrimary` name, else `base`. The secondary is the "other" canonical name —
 * the primary/base name — rendered de-emphasized after the primary when it differs from the chosen
 * primary. When no `preferredLanguage` match is found (there is no interface-language setting yet, so
 * this is the common case today), the secondary falls back to "the most useful other name": an
 * English-tagged name if one exists, else the first other name, so a romanized/alternate name still
 * shows even with no explicit preference — generalizing `orderRomanized` (romanized.ts) for the
 * multi-language model while keeping today's always-show-a-secondary behavior stable.
 */
export function resolveDisplayNames(
  names: EntityName[],
  preferredLanguage: PreferredLanguage | null | undefined,
  base: string,
): EntityDisplayNames {
  const preferred = preferredLanguage
    ? names.find(name => matchesLanguage(name, preferredLanguage))
    : undefined;
  const primaryRow = names.find(name => name.isPrimary);
  const canonical = primaryRow?.value ?? base;
  const primary = preferred?.value ?? canonical;
  if (canonical && canonical !== primary) {
    return {
      primary,
      secondary: canonical,
    };
  }
  const others = names.filter(name => name.value !== primary);
  const englishOther = others.find(name => name.language.isoCode?.toLowerCase() === "en");
  const fallback = englishOther ?? others[0];
  return {
    primary,
    secondary: fallback ? fallback.value : null,
  };
}

/**
 * The string to sort an entity by. Sorts by the preferred-language name when present, else the
 * primary name, else `base` (so entries lacking a preferred-language name still sort sanely).
 * Generalizes `romanizedSortKey`.
 */
export function nameSortKey(
  names: EntityName[],
  base: string,
  preferredLanguage?: PreferredLanguage | null,
): string {
  const preferred = preferredLanguage
    ? names.find(name => matchesLanguage(name, preferredLanguage))
    : undefined;
  if (preferred) return preferred.value;
  const primaryRow = names.find(name => name.isPrimary);
  return primaryRow?.value ?? base;
}

/**
 * The string to derive an entity's slug from: the English-language name row (ISO 639-1 `en`) when
 * present and non-empty, else `baseName`. Keeps slugs ASCII/readable even when the primary name is
 * non-Latin. Generalizes the Locations `locationSlugSource` (which preferred the romanized form).
 */
export function slugSourceFromNames(names: EntityName[], baseName: string): string {
  const english = names.find(
    name => name.language.isoCode?.toLowerCase() === "en" && name.value.trim().length > 0,
  );
  return english ? english.value : baseName;
}

/**
 * Bridges the gap between the legacy `name`/`romanizedName` scalar pair and the new `entity_names`
 * model while a row's `entity_names` haven't been backfilled yet (the migration is a separate,
 * independently-timed issue). Returns `names` unchanged when it already carries rows; otherwise
 * synthesizes a single non-primary row from `legacyRomanized` (or an empty array when there's no
 * legacy value either), so display resolution degrades to exactly today's romanized-pair behavior
 * until the real rows exist, and automatically prefers the real rows the moment they do.
 */
export function namesWithLegacyFallback(
  names: EntityName[] | null | undefined,
  legacyRomanized: string | null | undefined,
): EntityName[] {
  if (names && names.length > 0) return names;
  if (!legacyRomanized || legacyRomanized.trim().length === 0) return [];
  return [{
    id: "legacy-romanized",
    language: {
      id: "legacy-romanized",
      name: "Romanized",
      slug: "romanized",
      isoCode: null,
    },
    value: legacyRomanized,
    isPrimary: false,
    sortOrder: 0,
  }];
}
