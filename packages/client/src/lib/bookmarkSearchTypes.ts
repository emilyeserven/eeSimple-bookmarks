import type { BookmarkSort } from "./bookmarkSort";
import type { SectionEntryType } from "@eesimple/types";

/**
 * URL-persisted filter state shared by the search pages (the Bookmarks page and each
 * category page). `num` holds `[lo, hi]` ranges keyed by number/calculate property id;
 * `bool` holds required boolean values keyed by boolean property id. TanStack Router's
 * default search serializer round-trips these nested objects/arrays.
 */
export interface BookmarkSearch {
  /**
   * Restrict to bookmarks whose tag is one of these ids (empty/absent = all tags). The server
   * expands each id to its full subtree for inclusion; exclusion ("exclude" mode) is client-side
   * with exact matching only (no subtree expansion).
   */
  tags?: string[];
  /** Filter bookmarks by tag: "has" = has any tag, "missing" = no tags, "exclude" = does not have the selected tags. */
  tagPresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks whose category is one of these ids (empty/absent = all categories). */
  categories?: string[];
  /** Filter bookmarks by category: "has" = has a category, "missing" = none, "exclude" = does not have the selected categories. */
  categoryPresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks whose media type is one of these ids (empty/absent = all media types). */
  mediaTypes?: string[];
  /** Filter bookmarks by media type: "has" = has a media type, "missing" = none, "exclude" = does not have the selected media types. */
  mediaTypePresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks whose YouTube channel is one of these ids (empty/absent = all channels). */
  youtubeChannels?: string[];
  /** Filter bookmarks by YouTube channel: "has" = has any, "missing" = none, "exclude" = does not have the selected channels. */
  youtubeChannelPresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks whose website is one of these ids (empty/absent = all websites). */
  websites?: string[];
  /** Filter bookmarks by website: "has" = has any, "missing" = none, "exclude" = does not have the selected websites. */
  websitePresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks that have a relationship of one of these type ids (empty/absent = all). */
  relationshipTypes?: string[];
  /** Restrict to bookmarks with a language usage whose language is one of these ids (empty/absent = all). */
  languageUsageLanguages?: string[];
  /** Restrict to bookmarks with a language usage whose usage level is one of these ids (empty/absent = all). */
  languageUsageLevels?: string[];
  /**
   * Restrict to bookmarks with at least one location whose place type is one of these normalized
   * slugs (empty/absent = all place types). Matched against `location.placeType` via
   * {@link placeTypeKey} — a bookmark can carry several locations, so this is an "any match" filter
   * like tags, not a 1:1 id comparison.
   */
  placeTypes?: string[];
  /** Filter bookmarks by place type: "has" = has any location with a place type, "missing" = none, "exclude" = does not have the selected place types. */
  placeTypePresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks whose person list overlaps with these ids (empty/absent = all). */
  people?: string[];
  /** Filter bookmarks by person: "has" = has any, "missing" = none, "exclude" = does not have the selected people. */
  peoplePresence?: "has" | "missing" | "exclude";
  /**
   * Restrict to bookmarks carrying at least one of these Genres & Moods ids (empty/absent = all).
   * A bookmark can carry several, so this is an "any match" filter like place types, not a 1:1 id
   * comparison.
   */
  genreMoods?: string[];
  /** Filter bookmarks by Genres & Moods: "has" = has any, "missing" = none, "exclude" = does not have the selected entries. */
  genreMoodPresence?: "has" | "missing" | "exclude";
  num?: Record<string, [number, number]>;
  bool?: Record<string, boolean>;
  /** `[from, to]` date/time range bounds (canonical strings, either `null`) keyed by property id. */
  date?: Record<string, [string | null, string | null]>;
  /** Filter bookmarks by property value presence: "has" = has a value, "missing" = no value, "exclude" = does not have the selected choices values (choices properties only). */
  presence?: Record<string, "has" | "missing" | "exclude">;
  /** Filter bookmarks by selected choices values keyed by property id. In default (include) mode a bookmark passes if any selected value matches; in "exclude" presence mode a bookmark passes if it has none of the selected values. */
  choices?: Record<string, string[]>;
  /** Filter bookmarks by whether they have any sections entries ("has"), none ("missing"), or do not have the selected section types ("exclude"). */
  sectionsPresence?: "has" | "missing" | "exclude";
  /** Filter bookmarks to those with at least one section entry of one of these types (OR semantics). In "exclude" sectionsPresence mode, bookmarks must have none of these types. */
  sectionTypes?: SectionEntryType[];
  /**
   * Filter bookmarks by whether they carry any Plex/Kavita/ISBN/podcast-feed identity (see #1072):
   * "has" = at least one identity field is set, "missing" = none are.
   */
  mediaSourcePresence?: "has" | "missing";
  /**
   * Exact-match media-source identity filters — not surfaced as sidebar pickers (there's no
   * taxonomy of values to choose from), only set via the "N bookmarks share this item" deep link
   * on the bookmark detail page. At most one is meaningfully set at a time.
   */
  plexRatingKey?: string;
  kavitaSeriesId?: number;
  isbn?: string;
  feedUrl?: string;
  /**
   * Filter bookmarks by whether their website has an extension-fill rule targeting a bookmark field:
   * "fillable" = has fillable fields at all (`Bookmark.hasAnyFillableField`, filled or not),
   * "has" = has an *unfilled* fillable field / something left to fill (`Bookmark.hasFillableFields`),
   * "missing" = nothing left to fill (`!Bookmark.hasFillableFields`). "has" keeps its original
   * meaning so existing URLs / saved filters stay valid.
   */
  fillableFieldsPresence?: "has" | "fillable" | "missing";
  /** Active sort order (primary + optional secondary dimension, or a random shuffle). Absent = server's default `createdAt DESC` order. */
  sort?: BookmarkSort;
}

/** A single owner's language-usage association, reduced to the two ids the filter compares against. */
export interface OwnerLanguageUsage {
  languageId: string;
  usageLevelId: string;
}

/** The exact-match media-source identity fields a deep link can target (see {@link withMediaSourceMatch}). */
export type MediaSourceMatchField = "plexRatingKey" | "kavitaSeriesId" | "isbn" | "feedUrl";
