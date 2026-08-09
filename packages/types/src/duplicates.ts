/**
 * Duplicates manager — whole-collection duplicate detection and merge. The Settings → Advanced →
 * Duplicates page runs an on-demand scan (`GET /api/duplicates`) that groups bookmarks in three
 * confidence tiers (same URL/page, shared media identity, same normalized title) and merges a
 * group into one survivor (`POST /api/duplicates/merge`) with per-field value picks. The pure
 * grouping-key helpers live here so the per-URL add-form check and the whole-collection scan
 * share one predicate.
 */

import type { WebsiteParamRule } from "./index.js";

/** Group kinds in confidence order; `same-title` is the lower-confidence "possible duplicates" tier. */
export const DUPLICATE_GROUP_KINDS = ["same-url", "same-page", "shared-identity", "same-title"] as const;

export type DuplicateGroupKind = typeof DUPLICATE_GROUP_KINDS[number];

/** Bookmark columns whose shared non-empty value marks two bookmarks as the same item (see #1072). */
export const DUPLICATE_IDENTITY_FIELDS = ["isbn", "plexRatingKey", "kavitaSeriesId", "feedUrl"] as const;

export type DuplicateIdentityField = typeof DUPLICATE_IDENTITY_FIELDS[number];

/** A member of a duplicate group, as listed by the scan. */
export interface DuplicateGroupMember {
  id: string;
  url: string | null;
  title: string;
  createdAt: string;
}

/** A set of bookmarks the scan considers duplicates of one another. */
export interface DuplicateGroup {
  kind: DuplicateGroupKind;
  /** Stable grouping key (page key / identity value / normalized title) — usable as a list key. */
  key: string;
  /** Which identity column matched; set only on `shared-identity` groups. */
  identityField?: DuplicateIdentityField;
  /** Sorted `createdAt` ascending, so the oldest member is the natural default survivor. */
  members: DuplicateGroupMember[];
}

/** Response of `GET /api/duplicates`. */
export interface DuplicateScanResult {
  /** High-confidence groups: `same-url`, `same-page`, and `shared-identity`. */
  groups: DuplicateGroup[];
  /** The lower-confidence `same-title` tier, listed separately as "possible duplicates". */
  possibleGroups: DuplicateGroup[];
  scannedCount: number;
}

/**
 * Scalar bookmark columns a merge choice may pick — the single source the merge body schema and
 * the client field picker both derive from. Maintenance columns (`linkCheck*`,
 * `imageAutoGrabError`, `migrationSource`, timestamps) are deliberately absent.
 */
export const MERGE_SCALAR_FIELDS = [
  "url",
  "originalUrl",
  "secondaryUrl",
  "title",
  "description",
  "priority",
  "imageDisplayPreference",
  "categoryId",
  "websiteId",
  "mediaTypeId",
  "youtubeChannelId",
  "newsletterId",
  "importId",
  "kavitaSeriesId",
  "kavitaLibraryId",
  "kavitaSeriesName",
  "plexRatingKey",
  "plexItemType",
  "plexItemTitle",
  "isbn",
  "year",
  "wikidataId",
  "wikipediaLinkEn",
  "wikipediaLinkLocal",
  "feedUrl",
  "itunesId",
  "itunesUrl",
  "spotifyUrl",
  "pocketCastsUuid",
  "pocketCastsUrl",
  "defaultLinkProvider",
] as const;

export type MergeScalarField = typeof MERGE_SCALAR_FIELDS[number];

/**
 * Body of `POST /api/duplicates/merge`. `fieldChoices` maps a field to the *member bookmark id*
 * whose stored value wins — the server re-reads the authoritative value from that row, so a merge
 * is always a pick, never an arbitrary edit. An omitted field keeps the survivor's own value.
 * Associations (tags, people, images, property values, …) are unioned automatically.
 */
export interface MergeBookmarksInput {
  survivorId: string;
  loserIds: string[];
  fieldChoices: Partial<Record<MergeScalarField, string>>;
}

/** Minimum normalized-title length for the `same-title` tier — shorter titles are too collision-prone. */
const MIN_TITLE_KEY_LENGTH = 4;

/**
 * Title-tier grouping key: lower-cased, whitespace-collapsed, trimmed. Returns `null` when the
 * normalized title is under {@link MIN_TITLE_KEY_LENGTH} characters (excluded from the tier).
 */
export function normalizeTitleKey(title: string): string | null {
  const key = title.toLowerCase().replace(/\s+/g, " ").trim();
  return key.length < MIN_TITLE_KEY_LENGTH ? null : key;
}

/**
 * The most-specific param rule matching a URL path: longest `pathSuffix` wins among rules whose
 * suffix matches (`""` matches any path; `matchMode` defaults to `"suffix"`). `null` when none match.
 */
export function mostSpecificParamRule(
  rules: readonly WebsiteParamRule[],
  pathname: string,
): WebsiteParamRule | null {
  return rules
    .filter(rule => rule.pathSuffix === "" || (
      rule.matchMode === "contains"
        ? pathname.includes(rule.pathSuffix)
        : pathname.endsWith(rule.pathSuffix)
    ))
    .sort((a, b) => b.pathSuffix.length - a.pathSuffix.length)[0] ?? null;
}

/**
 * URL-tier grouping key: `origin + pathname`, extended with the matched rule's identity-param
 * values (in rule order, missing params coalesced to `""`) so e.g. two YouTube watch URLs group
 * only when their `?v=` matches. `null` when the URL doesn't parse.
 */
export function bookmarkPageKey(url: string, rule: WebsiteParamRule | null): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return null;
  }
  const base = parsed.origin + parsed.pathname;
  if (!rule) return base;
  const paramValues = rule.params.map(p => `${p}=${parsed.searchParams.get(p) ?? ""}`);
  return `${base}?${paramValues.join("&")}`;
}
