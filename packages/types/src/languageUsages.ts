/**
 * Shared "Language Usage" types.
 *
 * A {@link LanguageUsageLevel} is a user-managed vocabulary entry describing *how* a language is used
 * on an item — grouped by {@link LanguageUsageKind}: `availability` levels (Dub, Subtitles,
 * Explanations…) qualify content, `proficiency` levels (Native, Fluent, Learning…) qualify people.
 *
 * A {@link LanguageUsage} associates a language + a usage level (+ optional note) with an owner
 * entity (a bookmark, movie, TV show, website, YouTube channel, or person). The association is
 * denormalized for display (it carries the language's and level's names/slugs).
 *
 * This module is pure so it runs unchanged in the Fastify API and the browser.
 */

/** Which group a usage level belongs to — content availability vs. a person's proficiency. */
export type LanguageUsageKind = "availability" | "proficiency";

/**
 * The owner entities a {@link LanguageUsage} can attach to. Mirrors the middleware's
 * `LANGUAGE_USAGE_OWNER_TYPES`; the polymorphic association is keyed by `(ownerType, ownerId)`.
 */
export const LANGUAGE_USAGE_OWNER_TYPES = ["bookmark", "movie", "tvShow", "website", "youtubeChannel", "person"] as const;
export type LanguageUsageOwnerType = typeof LANGUAGE_USAGE_OWNER_TYPES[number];

/** A user-managed usage-level vocabulary entry. */
export interface LanguageUsageLevel {
  id: string;
  name: string;
  slug: string;
  kind: LanguageUsageKind;
  /** Seeded built-ins can't be renamed or deleted; users may add custom ones. */
  builtIn: boolean;
  sortOrder: number;
  createdAt: string;
  /** How many associations currently reference this level. Computed server-side. */
  usageCount: number;
}

export interface CreateLanguageUsageLevelInput {
  name: string;
  kind: LanguageUsageKind;
  sortOrder?: number;
}

/** `kind` is immutable after creation (like a place type's identity), so it isn't patchable. */
export interface UpdateLanguageUsageLevelInput {
  name?: string;
  sortOrder?: number;
}

/** A language + usage-level association, denormalized for display. */
export interface LanguageUsage {
  /** The association row id. */
  id: string;
  language: {
    id: string;
    name: string;
    slug: string;
    isoCode: string | null;
  };
  level: {
    id: string;
    name: string;
    slug: string;
    kind: LanguageUsageKind;
  };
  note: string | null;
}

/** Convenience alias for the array carried on a hydrated `Bookmark`. */
export type BookmarkLanguageUsage = LanguageUsage;

/** One entry in a replace-all `PUT /api/language-usages/:ownerType/:ownerId` request. */
export interface UpdateLanguageUsageEntry {
  languageId: string;
  usageLevelId: string;
  note?: string | null;
}

/**
 * A distinct (language, usage-level) pairing derived from all `language_usages` rows across every
 * owner type, with how many associations use it. Powers the Language Usage Levels overview, which
 * groups these pairs by either the level or the language.
 */
export interface LanguageUsageAssociation {
  language: {
    id: string;
    name: string;
    slug: string;
  };
  level: {
    id: string;
    name: string;
    slug: string;
    kind: LanguageUsageKind;
  };
  /** How many association rows carry this exact language + level pairing. */
  count: number;
}
