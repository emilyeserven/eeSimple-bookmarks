/**
 * Shared eeSimple Bookmarks domain types.
 *
 * These are consumed by both the Fastify API (`@eesimple/middleware`) and the React client
 * (`@eesimple/client`) so the wire contract stays in one place.
 */

import type { ConditionMatchField, ConditionMatchOperator, ConditionTree } from "./conditions.js";

export * from "./conditions.js";

/** A tag node in the hierarchical taxonomy. `parentId === null` marks a root tag. */
export interface Tag {
  id: string;
  /** Display name, unique among its siblings. */
  name: string;
  /** Parent tag id, or `null` for a root-level tag. */
  parentId: string | null;
  /** ISO-8601 timestamp of when the tag was created. */
  createdAt: string;
}

/** A tag with its children populated — used to render the taxonomy tree. */
export interface TagNode extends Tag {
  children: TagNode[];
}

/** Lightweight tag shape carried on a bookmark (enough to render and group). */
export type BookmarkTag = Pick<Tag, "id" | "name" | "parentId">;

/** Payload for creating a tag. */
export interface CreateTagInput {
  name: string;
  /** Parent tag id, or `null`/omitted for a root tag. */
  parentId?: string | null;
}

/** Payload for renaming and/or reparenting a tag. `parentId === null` moves it to root. */
export interface UpdateTagInput {
  name?: string;
  parentId?: string | null;
}

/**
 * A site in the built-in "Websites" taxonomy. Every bookmark is auto-linked to one of these by
 * the host of its URL, so bookmarks can be grouped and browsed per site.
 */
export interface Website {
  id: string;
  /** Normalized host (lower-cased, leading `www.` stripped), e.g. `"github.com"`. Unique. */
  domain: string;
  /** Human-friendly site name (defaults to the domain on creation; renamable). */
  siteName: string;
  /** URL-friendly identifier derived from the domain (e.g. `"github"` from `"github.com"`). Unique. */
  slug: string;
  /** ISO-8601 timestamp of when the website was first seen. */
  createdAt: string;
  /** Number of bookmarks associated with this website (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Lightweight website shape carried on a bookmark. */
export type BookmarkWebsite = Pick<Website, "id" | "domain" | "siteName" | "slug">;

/** Payload for manually creating a website in the taxonomy (normally auto-created from URLs). */
export interface CreateWebsiteInput {
  /** Host to register (normalized server-side: lower-cased, leading `www.` stripped). */
  domain: string;
  /** Optional friendly name; defaults to the normalized domain when omitted. */
  siteName?: string;
}

/** Payload for updating a website (rename its site name and/or change its domain). */
export interface UpdateWebsiteInput {
  siteName?: string;
  domain?: string;
}

/** Result of looking up the website for a URL without creating one — powers the form banner. */
export interface WebsiteLookup {
  /** Normalized host of the URL, or `null` when the URL has no usable host. */
  domain: string | null;
  /** Whether a website already exists for that domain. */
  exists: boolean;
  /** The existing website's site name when `exists`, otherwise `null`. */
  siteName: string | null;
}

/**
 * A media type in the built-in "Media Types" taxonomy (Video, Article, Podcast, …). Classifies what
 * a bookmark is; chosen in the form or auto-set from fetched metadata. Built-ins can't be
 * renamed/deleted; users may add their own.
 */
export interface MediaType {
  id: string;
  /** Display name, e.g. `"Video"`. Unique. */
  name: string;
  /** URL-friendly identifier derived from the name (e.g. `"video"`). Unique. */
  slug: string;
  /** Whether this is a seeded built-in (protected from rename/delete). */
  builtIn: boolean;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** ISO-8601 timestamp of when the media type was created. */
  createdAt: string;
  /** Number of bookmarks with this media type (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Lightweight media-type shape carried on a bookmark. */
export type BookmarkMediaType = Pick<MediaType, "id" | "name" | "slug">;

/** Payload for creating a custom media type. */
export interface CreateMediaTypeInput {
  name: string;
  sortOrder?: number;
}

/** Payload for updating a media type (rename and/or reorder). */
export interface UpdateMediaTypeInput {
  name?: string;
  sortOrder?: number;
}

/**
 * A channel in the built-in "YouTube Channels" taxonomy. Bookmarks for a YouTube video are
 * auto-linked to their channel from the video's fetched metadata, so videos can be browsed per
 * channel.
 */
export interface YouTubeChannel {
  id: string;
  /** Stable normalized identifier (the channel's canonical URL/handle path), e.g. `"@veritasium"`. */
  channelKey: string;
  /** Human-friendly channel name; renamable. */
  name: string;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** ISO-8601 timestamp of when the channel was first seen. */
  createdAt: string;
  /** Number of bookmarks associated with this channel (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Lightweight channel shape carried on a bookmark. */
export type BookmarkYouTubeChannel = Pick<YouTubeChannel, "id" | "name" | "slug">;

/** A resolved channel hint passed when creating a bookmark, used to auto-link/auto-create it. */
export interface YouTubeChannelHint {
  /** Stable channel identifier (its canonical URL/handle path). */
  key: string;
  /** Human-friendly channel name. */
  name: string;
}

/** Payload for updating a YouTube channel (rename). */
export interface UpdateYouTubeChannelInput {
  name?: string;
}

/**
 * The image attached to a bookmark. The bytes live in object storage; this carries only what the
 * UI needs to render it. `url` points at the API serving endpoint (it embeds a `?v=` version param
 * so a replaced image busts the browser cache).
 */
export interface BookmarkImage {
  /** Serving URL on the API, e.g. `/api/bookmarks/<id>/image?v=<version>`. */
  url: string;
  /** Pixel width of the stored (already-resized) image. */
  width: number;
  /** Pixel height of the stored (already-resized) image. */
  height: number;
  /** How the image was obtained: a manual upload or the page's auto-fetched `og:image`. */
  source: "upload" | "og";
}

/** A single saved bookmark. */
export interface Bookmark {
  id: string;
  /** The bookmarked URL (http/https), possibly cleaned of tracking/query params. */
  url: string;
  /** Original URL before any cleanup was applied, or `null` when no cleanup was performed. */
  originalUrl: string | null;
  /** Human-friendly title, e.g. "GitHub". */
  title: string;
  /** Optional free-form description. */
  description: string | null;
  /** The image attached to this bookmark, or `null` when none has been set. */
  image: BookmarkImage | null;
  /** Id of the category this bookmark belongs to (always set; the built-in "Default" when unassigned). */
  categoryId: string;
  /** The website this bookmark belongs to (auto-linked by URL host), or `null` when the URL has no host. */
  website: BookmarkWebsite | null;
  /** The media type of this bookmark (Video, Article, …), or `null` when unset. */
  mediaType: BookmarkMediaType | null;
  /** The YouTube channel this bookmark belongs to (auto-linked for YouTube videos), or `null`. */
  youtubeChannel: BookmarkYouTubeChannel | null;
  /** Tags assigned to this bookmark, drawn from the taxonomy. */
  tags: BookmarkTag[];
  /** Number-typed custom property values (includes computed `calculate` results) assigned to this bookmark. */
  numberValues: BookmarkNumberValue[];
  /** Boolean custom property values assigned to this bookmark. */
  booleanValues: BookmarkBooleanValue[];
  /** Date/time custom property values assigned to this bookmark. */
  dateTimeValues: BookmarkDateTimeValue[];
  /** Homepage ordering weight; higher values appear first. */
  priority: number;
  /** ISO-8601 timestamp of when the bookmark was created. */
  createdAt: string;
}

/** Payload for creating a bookmark. */
export interface CreateBookmarkInput {
  url: string;
  /** Original URL before cleanup; omit when no cleanup was applied. */
  originalUrl?: string | null;
  title: string;
  description?: string | null;
  /** Id of the category to assign; omit to fall back to the built-in "Default" category. */
  categoryId?: string;
  /** Ids of tags to assign, drawn from the taxonomy. */
  tagIds?: string[];
  /** Number custom property values to assign (calculate results are computed server-side). */
  numberValues?: BookmarkNumberValue[];
  /** Boolean custom property values to assign. */
  booleanValues?: BookmarkBooleanValue[];
  /** Date/time custom property values to assign. */
  dateTimeValues?: BookmarkDateTimeValue[];
  /** Homepage ordering weight; higher values appear first. */
  priority?: number;
  /** Friendly name for the website when it doesn't exist yet; ignored for existing sites. */
  websiteSiteName?: string;
  /** Id of the media type to assign, or `null` to clear it. Omit to leave unchanged. */
  mediaTypeId?: string | null;
  /**
   * Channel hint for a YouTube video, used to auto-create/link its channel. When omitted for a
   * recognized YouTube URL, the server resolves it from the video's metadata.
   */
  youtubeChannel?: YouTubeChannelHint | null;
}

/** Payload for partially updating a bookmark. */
export type UpdateBookmarkInput = Partial<CreateBookmarkInput>;

/**
 * The kind of a user-defined custom property:
 * - `number` — a single numeric value per bookmark, filtered via a range slider.
 * - `boolean` — a single true/false value per bookmark.
 * - `calculate` — a numeric value derived from other `number` properties (Sum formula);
 *   computed and stored server-side so it filters and sorts like a `number`.
 * - `datetime` — a calendar/clock value (a date, a time, or both; see {@link DateTimeFormat}).
 */
export type CustomPropertyType = "number" | "boolean" | "calculate" | "datetime";

/**
 * How a `number`/`calculate` value is rendered:
 * - `plain` — the number with its optional prefix/unit (the default).
 * - `duration` — the value is a count of seconds, shown as `H:MM:SS` / `M:SS` (e.g. video length).
 */
export type NumberFormat = "plain" | "duration";

/**
 * What a `datetime` property captures (and therefore how its value is entered/encoded):
 * - `date` — a calendar date only, stored as `"YYYY-MM-DD"`.
 * - `time` — a clock time only, stored as 24h `"HH:MM"`.
 * - `datetime` — both, stored as local `"YYYY-MM-DDTHH:MM"` (no timezone).
 *
 * The canonical encodings are chosen so values sort lexicographically.
 */
export type DateTimeFormat = "date" | "time" | "datetime";

/** A user-defined custom property that becomes a dynamic bookmark filter. */
export interface CustomProperty {
  id: string;
  name: string;
  /** URL-friendly identifier derived from `name`; unique across properties. */
  slug: string;
  type: CustomPropertyType;
  /** Whether this is a built-in property (e.g. "Video Length"); built-ins can't be renamed/retyped/deleted. */
  builtIn: boolean;
  /** How a `number`/`calculate` value is displayed; `null` is treated as `"plain"`. */
  numberFormat: NumberFormat | null;
  /** What a `datetime` property captures (`date`/`time`/`datetime`); `null` for non-datetime types. */
  dateTimeFormat: DateTimeFormat | null;
  /** Free-text description of the property, shown as a hint where its field is rendered, or `null`. */
  description: string | null;
  /** Lower bound of a `number`/`calculate` range slider (`null` = no minimum / derive from data). */
  numberMin: number | null;
  /** Upper bound of a `number`/`calculate` range slider (`null` = no maximum / derive from data). */
  numberMax: number | null;
  /** Singular unit label for a `number`/`calculate` value (e.g. `"star"`), or `null`. */
  unitSingular: string | null;
  /** Plural unit label for a `number`/`calculate` value (e.g. `"stars"`), or `null`. */
  unitPlural: string | null;
  /** Prefix shown before a `number`/`calculate` value (e.g. `"$"`), or `null`. */
  valuePrefix: string | null;
  /** Label shown instead of a `number`/`calculate` value of 0 (e.g. `"Free"`), or `null`. */
  zeroLabel: string | null;
  /** Label shown when a `number`/`calculate` value reaches its maximum (e.g. `"Unlimited"`), or `null`. */
  maxLabel: string | null;
  /** For a `calculate` property: ids of the `number` properties summed to produce its value. */
  operandPropertyIds: string[];
  /** Ids of the categories this property is assigned to (zero, one, or many). */
  categoryIds: string[];
  /** When true, the property applies to every category, including ones created later (overrides `categoryIds`). */
  allCategories: boolean;
  /** When true, the property's value can be edited inline from a bookmark card's "More" menu. */
  editableOnCard: boolean;
  /** When true, the field shows in the main bookmark form; otherwise it lives under Advanced. Only applies when not `hiddenFromForm`. */
  showInForm: boolean;
  /** When true, the property's field is hidden from the bookmark form entirely (neither main nor Advanced). */
  hiddenFromForm: boolean;
  /** When true, the property's value is shown on bookmark cards in listings. */
  showInListings: boolean;
  /** When false, the property is globally inactive: hidden from filters, conditions, category assignment, and the bookmark form. */
  enabled: boolean;
  createdAt: string;
}

/** Payload for creating a custom property. */
export interface CreateCustomPropertyInput {
  name: string;
  type: CustomPropertyType;
  /** How a `number`/`calculate` value is displayed. Defaults to `"plain"`. */
  numberFormat?: NumberFormat | null;
  /** What a `datetime` property captures (`date`/`time`/`datetime`). Required for `datetime`. */
  dateTimeFormat?: DateTimeFormat | null;
  description?: string | null;
  numberMin?: number | null;
  numberMax?: number | null;
  unitSingular?: string | null;
  unitPlural?: string | null;
  valuePrefix?: string | null;
  zeroLabel?: string | null;
  maxLabel?: string | null;
  /** For a `calculate` property: ids of the `number` properties to sum (at least two). */
  operandPropertyIds?: string[];
  /** Ids of categories to assign this property to. Omit to leave unassigned. */
  categoryIds?: string[];
  /** When true, the property applies to every category, including ones created later. Defaults to false. */
  allCategories?: boolean;
  /** When true, the property's value can be edited from a bookmark card's "More" menu. Defaults to false. */
  editableOnCard?: boolean;
  /** When true, the field shows in the main bookmark form; otherwise it lives under Advanced. Only applies when not `hiddenFromForm`. */
  showInForm?: boolean;
  /** When true, the property's field is hidden from the bookmark form entirely. Defaults to false. */
  hiddenFromForm?: boolean;
  /** When true, the property's value is shown on bookmark cards in listings. Defaults to true. */
  showInListings?: boolean;
  /** When false, the property is globally inactive. Defaults to true. */
  enabled?: boolean;
}

/** Payload for updating a custom property. Its `type` is immutable. */
export type UpdateCustomPropertyInput = Partial<Omit<CreateCustomPropertyInput, "type">>;

/**
 * Whether a property is assigned to a given category. A property with `allCategories` set applies to
 * every category (including ones created after it); otherwise it applies only to its `categoryIds`.
 */
export function propertyAppliesToCategory(
  property: Pick<CustomProperty, "allCategories" | "categoryIds">,
  categoryId: string,
): boolean {
  return property.allCategories || property.categoryIds.includes(categoryId);
}

/** A number custom property value carried on a bookmark. */
export interface BookmarkNumberValue {
  propertyId: string;
  value: number;
}

/** A boolean custom property value carried on a bookmark. */
export interface BookmarkBooleanValue {
  propertyId: string;
  value: boolean;
}

/**
 * A date/time custom property value carried on a bookmark. The `value` is the canonical string
 * encoding for the property's {@link DateTimeFormat} (`"YYYY-MM-DD"`, `"HH:MM"`, or
 * `"YYYY-MM-DDTHH:MM"`).
 */
export interface BookmarkDateTimeValue {
  propertyId: string;
  value: string;
}

/**
 * A category groups custom properties and owns each bookmark assigned to it.
 * Properties may belong to zero, one, or many categories; each category carries an
 * optional Lucide icon shown in the sidebar.
 */
export interface Category {
  id: string;
  name: string;
  /** URL-friendly identifier derived from the name (e.g. `"recipes"`); unique across categories. */
  slug: string;
  /** Optional free-form description. */
  description: string | null;
  /** Name of a Lucide icon (e.g. `"Star"`), or `null` for the default icon. */
  icon: string | null;
  /** Whether this is a built-in category (the "Default"); built-ins cannot be renamed or deleted. */
  builtIn: boolean;
  /** Whether bookmarks in this category appear on the homepage. */
  isHomepage: boolean;
  createdAt: string;
}

/** Payload for creating a category. */
export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  icon?: string | null;
  isHomepage?: boolean;
}

/** Payload for partially updating a category. */
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

/** Payload for replacing a category's enabled root-tag allowlist (empty = all roots enabled). */
export interface UpdateCategoryRootTagsInput {
  tagIds: string[];
}

/** A category's default custom-property values, applied to new bookmarks added to it. */
export interface CategoryPropertyDefaults {
  /** Default number/calculate property values (calculate defaults are ignored on save). */
  numberValues: BookmarkNumberValue[];
  /** Default boolean property values. */
  booleanValues: BookmarkBooleanValue[];
}

/** Payload for replacing a category's default custom-property values. */
export type UpdateCategoryDefaultsInput = CategoryPropertyDefaults;

/** @deprecated Use {@link ConditionMatchField}. Retained for existing references. */
export type AutofillField = ConditionMatchField;

/** @deprecated Use {@link ConditionMatchOperator}. Retained for existing references. */
export type AutofillOperator = ConditionMatchOperator;

/**
 * A rule that prefills the Add-Bookmark form: when a bookmark matches the rule's `conditions`,
 * the rule's category, tags, and custom-property values are suggested in the form.
 */
export interface AutofillRule {
  id: string;
  /** Friendly label shown in the settings list. */
  name: string;
  /** URL-friendly identifier derived from the name (e.g. `"github-recipes"` from `"GitHub Recipes"`). Unique. */
  slug: string;
  /** Optional free-form description. */
  description: string | null;
  /** The match predicate tree describing when this rule applies. */
  conditions: ConditionTree;
  /** Category to assign, or `null` to leave the category unchanged. */
  setCategoryId: string | null;
  /** Tag ids to apply, drawn from the taxonomy. */
  tagIds: string[];
  /** Number custom-property values to apply. */
  numberValues: BookmarkNumberValue[];
  /** Boolean custom-property values to apply. */
  booleanValues: BookmarkBooleanValue[];
  /** Lower sorts first; later (higher) rules win for single-valued targets when several match. */
  sortOrder: number;
  createdAt: string;
}

/** Payload for creating an autofill rule. */
export interface CreateAutofillRuleInput {
  name: string;
  description?: string | null;
  conditions: ConditionTree;
  setCategoryId?: string | null;
  tagIds?: string[];
  numberValues?: BookmarkNumberValue[];
  booleanValues?: BookmarkBooleanValue[];
  sortOrder?: number;
}

/** Payload for partially updating an autofill rule. */
export type UpdateAutofillRuleInput = Partial<CreateAutofillRuleInput>;

/**
 * The single, global Homepage filter: the condition tree that decides which bookmarks appear on
 * the homepage. An empty tree selects no bookmarks.
 */
export interface HomepageFilter {
  conditions: ConditionTree;
}

/** Payload for replacing the homepage filter. */
export type UpdateHomepageFilterInput = HomepageFilter;

/** A named, ordered section on the homepage with its own condition filter. */
export interface HomepageSection {
  id: string;
  title: string;
  description: string | null;
  conditions: ConditionTree;
  sortOrder: number;
  createdAt: string;
}

/** A homepage section together with the bookmarks that match its filter. */
export interface HomepageSectionBookmarks {
  section: HomepageSection;
  bookmarks: Bookmark[];
}

/** Payload for creating a homepage section. */
export interface CreateHomepageSectionInput {
  title: string;
  description?: string | null;
  conditions: ConditionTree;
  sortOrder?: number;
}

/** Payload for partially updating a homepage section. */
export type UpdateHomepageSectionInput = Partial<CreateHomepageSectionInput>;

/**
 * Result of fetching metadata for a bookmark URL (`GET /api/fetch-metadata`). Always carries the
 * page title; for recognized YouTube video URLs it also carries the channel, duration, and
 * thumbnail pulled from YouTube's public oEmbed + watch page.
 */
export interface FetchMetadataResult {
  /** Cleaned page/video title, or `null` when none could be read. */
  title: string | null;
  /** Whether the URL was recognized as a YouTube video. */
  isYouTube: boolean;
  /** The video's channel (YouTube only), or `null`. `key` is the stable id used to link/create it. */
  channel: { name: string;
    url: string | null;
    key: string | null; } | null;
  /** The video's length in whole seconds (YouTube only), or `null`. */
  durationSeconds: number | null;
  /** A preview/thumbnail image URL (YouTube only), or `null`. */
  thumbnailUrl: string | null;
}

/** Standard error shape returned by the API. */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
