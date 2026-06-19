/**
 * Shared eeSimple Bookmarks domain types.
 *
 * These are consumed by both the Fastify API (`@eesimple/middleware`) and the React client
 * (`@eesimple/client`) so the wire contract stays in one place.
 */

import type { ConditionMatchField, ConditionMatchOperator, ConditionTree } from "./conditions.js";

export * from "./conditions.js";
export * from "./youtube.js";

/** A tag node in the hierarchical taxonomy. `parentId === null` marks a root tag. */
export interface Tag {
  id: string;
  /** Display name, unique among its siblings. */
  name: string;
  /** URL-friendly identifier derived from the name; unique across all tags. */
  slug: string;
  /** Parent tag id, or `null` for a root-level tag. */
  parentId: string | null;
  /** ISO-8601 timestamp of when the tag was created. */
  createdAt: string;
  /**
   * Distinct bookmarks carrying this tag or any of its descendants (populated by list endpoints).
   */
  bookmarkCount?: number;
  /**
   * Distinct bookmarks carrying this tag but none of its descendants — i.e. the "parent only"
   * bucket surfaced as a "No Child" entry. Equals {@link bookmarkCount} for leaf tags.
   */
  ownBookmarkCount?: number;
}

/** A tag with its children populated — used to render the taxonomy tree. */
export interface TagNode extends Tag {
  children: TagNode[];
}

/** Lightweight tag shape carried on a bookmark (enough to render and group). */
export type BookmarkTag = Pick<Tag, "id" | "name" | "slug" | "parentId">;

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
/**
 * A path-scoped query-param whitelist for a website. When a website has any rules, the URL
 * canonicalizer keeps only the `params` of the longest-matching rule for the URL's path and strips
 * everything else (and strips all params when the site has rules but none match the path).
 */
export interface WebsiteParamRule {
  /** Path suffix the rule matches (e.g. `"/watch"`, `"/playlist"`); `""` matches any path. */
  pathSuffix: string;
  /** Query params kept on a matching path; all others are stripped. */
  params: string[];
}

/**
 * A verified shortened-link domain that resolves to a website (e.g. `youtu.be` → `youtube.com`).
 * Bookmarks on the short domain are associated with the parent site.
 */
export interface ShortenedLink {
  /** Normalized short domain that resolves to this site, e.g. `"youtu.be"`. */
  domain: string;
  /**
   * Expansion template, e.g. `"https://www.youtube.com/watch?v={id}"`. Tokens: `{id}` = first path
   * segment of the short URL, `{path}` = pathname without the leading slash. `null` = no rule yet.
   */
  expandTo: string | null;
  /** When `true`, never expand — keep the short URL and always nudge to use the long link. */
  keepShortened: boolean;
}

export interface Website {
  id: string;
  /** Normalized host (lower-cased, leading `www.` stripped), e.g. `"github.com"`. Unique. */
  domain: string;
  /** Human-friendly site name (defaults to the domain on creation; renamable). */
  siteName: string;
  /** URL-friendly identifier derived from the domain (e.g. `"github"` from `"github.com"`). Unique. */
  slug: string;
  /** Whether this is a seeded built-in (e.g. youtube.com); protected from rename/delete. */
  builtIn: boolean;
  /** Verified shortened-link domains that resolve to this site (e.g. `youtu.be`). */
  shortenedLinks: ShortenedLink[];
  /** Path-scoped query-param whitelist applied when canonicalizing this site's URLs. */
  paramRules: WebsiteParamRule[];
  /** ISO-8601 timestamp of when the website was first seen. */
  createdAt: string;
  /** Number of bookmarks associated with this website (populated by list endpoints). */
  bookmarkCount?: number;
  /**
   * Serving URL for the site's favicon (with a `?v=` cache-buster), or `null` when none is stored.
   * Auto-captured on first sighting and re-grabbable from the listing. Populated by list/get endpoints.
   */
  imageUrl?: string | null;
}

/** Lightweight website shape carried on a bookmark. */
export type BookmarkWebsite = Pick<Website, "id" | "domain" | "siteName" | "slug">;

/** Payload for manually creating a website in the taxonomy (normally auto-created from URLs). */
export interface CreateWebsiteInput {
  /** Host to register (normalized server-side: lower-cased, leading `www.` stripped). */
  domain: string;
  /** Optional friendly name; defaults to the normalized domain when omitted. */
  siteName?: string;
  /** Optional verified shortened-link domains that resolve to this site. */
  shortenedLinks?: ShortenedLink[];
  /** Optional path-scoped query-param whitelist. */
  paramRules?: WebsiteParamRule[];
}

/** Payload for updating a website (rename its site name and/or change its domain). */
export interface UpdateWebsiteInput {
  siteName?: string;
  domain?: string;
  shortenedLinks?: ShortenedLink[];
  paramRules?: WebsiteParamRule[];
}

/** Result of looking up the website for a URL without creating one — powers the form banner. */
export interface WebsiteLookup {
  /** Normalized host of the URL, resolved through a verified shortened link to the parent site. */
  domain: string | null;
  /** Whether a website already exists for that domain. */
  exists: boolean;
  /** The existing website's site name when `exists`, otherwise `null`. */
  siteName: string | null;
  /**
   * Whether the looked-up host is a shortened link: `"verified"` when it resolves to a known site,
   * `"generic"` when it's in the shortener ignore list, otherwise `null`.
   */
  shortener: "verified" | "generic" | null;
}

/** Desktop width for a homepage content block: full-bleed or half the content column. */
export type HomepageContentWidth = "full" | "half";

/** How the homepage Bookmark Quick Add form is presented. */
export type QuickAddDisplay = "collapsible" | "expanded";

/** Global app settings singleton. */
export interface AppSettings {
  /** Generic URL-shortener domains (e.g. `bit.ly`) that can't be expanded — always nudge. */
  shortenerIgnoreList: string[];
  /** Markdown shown at the top of the homepage (edited via the rich-text editor in settings). */
  homepageText: string;
  /** Desktop width of the homepage text block. */
  homepageTextWidth: HomepageContentWidth;
  /** When true, the Bookmark Quick Add form appears on the homepage. */
  bookmarkQuickAddEnabled: boolean;
  /** Desktop width of the homepage Quick Add block. */
  bookmarkQuickAddWidth: HomepageContentWidth;
  /** Whether Quick Add is collapsible or always expanded on the homepage. */
  bookmarkQuickAddDisplay: QuickAddDisplay;
  /** When true, the default "Homepage" title and description are hidden on the homepage. */
  homepageHeaderHidden: boolean;
}

/** The subset of {@link AppSettings} that drives homepage content (read/written together). */
export interface HomepageContentSettings {
  homepageText: string;
  homepageTextWidth: HomepageContentWidth;
  bookmarkQuickAddEnabled: boolean;
  bookmarkQuickAddWidth: HomepageContentWidth;
  bookmarkQuickAddDisplay: QuickAddDisplay;
  /** When true, the default "Homepage" title and description are hidden on the homepage. */
  homepageHeaderHidden: boolean;
}

/** Payload for replacing the homepage content settings. */
export type UpdateHomepageContentInput = HomepageContentSettings;

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
 * A Property Group — an optional grouping for custom properties. A property may belong to one group;
 * grouped properties render together (under the group's heading) on bookmark detail pages and in the
 * listings filter sidebar. Groups carry a `priority` (lower sorts first) and an optional description.
 */
export interface PropertyGroup {
  id: string;
  /** Display name. Unique. */
  name: string;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Free-text description surfaced on the group's detail page. */
  description: string | null;
  /** Display ordering weight across groups; lower sorts first. */
  priority: number;
  /** ISO-8601 timestamp of when the group was created. */
  createdAt: string;
  /** Number of custom properties in this group (populated by list endpoints). */
  propertyCount?: number;
}

/** Payload for creating a property group. */
export interface CreatePropertyGroupInput {
  name: string;
  description?: string | null;
  priority?: number;
}

/** Payload for updating a property group (rename, re-describe, and/or reorder). */
export interface UpdatePropertyGroupInput {
  name?: string;
  description?: string | null;
  priority?: number;
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
  /** Short self-identifiers the channel appends to video titles (e.g. "SNL"). Stripped on fetch. */
  selfIds: string[];
  /**
   * Serving URL for the channel's avatar (with a `?v=` cache-buster), or `null` when none is stored.
   * Auto-captured on first sighting and re-grabbable from the listing. Populated by list/get endpoints.
   */
  imageUrl?: string | null;
  /** The category this channel has been assigned to, or `null` when unassigned. */
  category?: YouTubeChannelCategory | null;
}

/** Lightweight channel shape carried on a bookmark. */
export type BookmarkYouTubeChannel = Pick<YouTubeChannel, "id" | "name" | "slug">;

/** Lightweight category shape embedded on a YouTube channel. */
export type YouTubeChannelCategory = Pick<Category, "id" | "name" | "slug" | "icon">;

/** A resolved channel hint passed when creating a bookmark, used to auto-link/auto-create it. */
export interface YouTubeChannelHint {
  /** Stable channel identifier (its canonical URL/handle path). */
  key: string;
  /** Human-friendly channel name. */
  name: string;
  /** Self-identifiers to save on the channel (replaces existing set). */
  selfIds?: string[];
}

/** Payload for updating a YouTube channel (rename and/or self-identifier list). */
export interface UpdateYouTubeChannelInput {
  name?: string;
  /** Full replacement list of self-identifiers. Omit to leave unchanged. */
  selfIds?: string[];
  /** Category to associate with this channel. `null` clears the association; omit to leave unchanged. */
  categoryId?: string | null;
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

/**
 * A single object cataloged in the bucket manifest (`media_objects`). The Gallery lists these so
 * every image in object storage is accounted for, including ones with no live bookmark (orphans).
 */
export interface MediaObject {
  /** Object-storage key the bytes live under, e.g. `bookmarks/<id>.webp`. Unique. */
  objectKey: string;
  /** MIME type of the stored bytes (derived from the key's extension), or `null` when unknown. */
  contentType: string | null;
  /** Size of the stored object in bytes, or `null` when the store didn't report it. */
  byteSize: number | null;
  /** ISO-8601 last-modified timestamp from object storage, or `null`. */
  lastModified: string | null;
  /** ISO-8601 timestamp the object was last seen during a bucket scan. */
  lastSeenAt: string;
  /**
   * The bookmark this object belongs to, or `null` when it's an orphan (the bookmark was deleted
   * but its image bytes were left behind in storage).
   */
  bookmark: { id: string;
    title: string; } | null;
  /** Serving URL for rendering the object (the bookmark image endpoint, or the by-key gallery one). */
  url: string;
}

/** The Gallery catalog: every cataloged object split into ones linked to a bookmark vs. orphans. */
export interface GalleryCatalog {
  /** Objects whose bookmark still exists. */
  registered: MediaObject[];
  /** Objects with no live bookmark — reclaimable storage. */
  orphans: MediaObject[];
  /**
   * Configured storage quota in bytes, or `null` when not set. Set via the `STORAGE_QUOTA_BYTES`
   * environment variable; used by the gallery UI to show used vs. total space.
   */
  storageQuotaBytes: number | null;
}

/** Payload for attaching an orphaned object to an existing bookmark. */
export interface AttachOrphanInput {
  /** Object-storage key of the orphan (must be currently unlinked in the manifest). */
  key: string;
  /** Id of the bookmark to attach the image to. */
  bookmarkId: string;
}

/** Result of a manual bucket scan/reconciliation, with the refreshed catalog and per-scan counts. */
export interface GalleryScanResult {
  catalog: GalleryCatalog;
  /** Objects newly added to the manifest this scan. */
  added: number;
  /** Existing manifest rows refreshed this scan. */
  updated: number;
  /** Manifest rows pruned because their object is no longer in the bucket. */
  pruned: number;
}

/** Result of deleting orphan objects: keys actually removed vs. keys refused (unknown or now linked). */
export interface DeleteOrphansResult {
  deleted: string[];
  skipped: string[];
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
  /** Specific reason the last image auto-grab attempt failed, or `null` when not yet attempted or the last attempt succeeded. */
  imageAutoGrabError: "no_image" | "bad_image" | "blocked" | "server_error" | "fetch_error" | null;
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
  /** Other bookmarks this bookmark is related to (undirected edges in the Relationships graph). */
  relatedBookmarks: BookmarkUrlSummary[];
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

/** Payload for replacing the full set of relationships for a bookmark. */
export interface UpdateBookmarkRelationshipsInput {
  relatedBookmarkIds: string[];
}

/** Minimal bookmark shape for the bulk shortened-link expansion review list. */
export interface BookmarkUrlSummary {
  id: string;
  url: string;
  title: string;
}

/** Result of checking whether a URL (or its path) collides with an existing bookmark. */
export interface BookmarkUrlDuplicateResult {
  exactMatch: BookmarkUrlSummary | null;
  pathMatch: BookmarkUrlSummary | null;
}

/** One bookmark URL rewrite in a bulk apply. */
export interface BulkUrlUpdate {
  id: string;
  /** The new (e.g. expanded) URL to store. */
  url: string;
}

/** Per-item outcome of a bulk URL rewrite. */
export interface BulkUrlUpdateResult {
  id: string;
  status: "applied" | "skipped-duplicate" | "skipped-unchanged" | "not-found" | "error";
  /** Human-readable detail when the status isn't `applied`. */
  message?: string;
}

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
  /** Id of the property group this property belongs to, or `null` when ungrouped. */
  propertyGroupId: string | null;
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
  /** Id of the property group to place this property in, or `null` to leave it ungrouped. */
  propertyGroupId?: string | null;
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
  /** Number of bookmarks in this category (populated by list endpoints). */
  bookmarkCount?: number;
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
  /** Default date/time property values. */
  dateTimeValues: BookmarkDateTimeValue[];
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
  /** Media type to assign, or `null` to leave the media type unchanged. */
  setMediaTypeId: string | null;
  /** Tag ids to apply, drawn from the taxonomy. */
  tagIds: string[];
  /** Number custom-property values to apply. */
  numberValues: BookmarkNumberValue[];
  /** Boolean custom-property values to apply. */
  booleanValues: BookmarkBooleanValue[];
  /** Date/time custom-property values to apply. */
  dateTimeValues: BookmarkDateTimeValue[];
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
  setMediaTypeId?: string | null;
  tagIds?: string[];
  numberValues?: BookmarkNumberValue[];
  booleanValues?: BookmarkBooleanValue[];
  dateTimeValues?: BookmarkDateTimeValue[];
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

/** Image position for a homepage section's bookmark cards: stacked above content or side-by-side. */
export type HomepageSectionImageLayout = "above" | "side";

/** A named, ordered section on the homepage with its own condition filter. */
export interface HomepageSection {
  id: string;
  title: string;
  description: string | null;
  conditions: ConditionTree;
  sortOrder: number;
  hideIfEmpty: boolean;
  /** Bookmark grid column count (1–4). */
  columns: number;
  /** Image display mode: `true` = natural aspect ratio, `false` = uniform crop. */
  imageMode: boolean;
  /** Image position in 2-column layouts: "above" (default) or "side". */
  imageLayout: HomepageSectionImageLayout;
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
  hideIfEmpty?: boolean;
  columns?: number;
  imageMode?: boolean;
  imageLayout?: HomepageSectionImageLayout;
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
  /** Video description scraped from the watch page (YouTube only), or `null`. */
  description: string | null;
  /** Whether the URL was recognized as a YouTube video. */
  isYouTube: boolean;
  /** The video's channel (YouTube only), or `null`. `key` is the stable id used to link/create it. */
  channel: { name: string;
    url: string | null;
    key: string | null;
    selfIds: string[]; } | null;
  /** The video's length in whole seconds (YouTube only), or `null`. */
  durationSeconds: number | null;
  /** ISO-8601 date the video was published ("YYYY-MM-DD"), scraped from the watch page (YouTube only), or `null`. */
  datePosted: string | null;
  /** A preview/thumbnail image URL (YouTube only), or `null`. */
  thumbnailUrl: string | null;
}

/** Result of probing a URL for reachability (`GET /api/check-url`). */
export interface CheckUrlResult {
  /** Whether the link resolved with an ok (2xx) response. */
  ok: boolean;
  /** The HTTP status returned, or `null` when the request never completed (timeout/network error). */
  status: number | null;
  /** Why the check failed, present only when `ok` is false. */
  reason?: "timeout" | "http_error" | "network_error";
}

/** A named snapshot of bookmark listing filter state, reusable on any listing page. */
export interface SavedFilter {
  id: string;
  name: string;
  description: string | null;
  /** Serialized `BookmarkSearch` — typed generically so the middleware stays decoupled from the client's URL-state type. */
  filters: Record<string, unknown>;
  createdAt: string;
}

export interface CreateSavedFilterInput {
  name: string;
  description?: string | null;
  filters: Record<string, unknown>;
}

export type UpdateSavedFilterInput = Partial<CreateSavedFilterInput>;

/** The display settings captured in a display preset (columns, image visibility, mode, layout). */
export interface DisplayPresetSettings {
  columns: number;
  imageVisibility: "shown" | "image-only" | "off";
  imageMode: boolean;
  imageLayout: "above" | "side";
}

/** A named snapshot of listing display settings, reusable across any listing page. */
export interface DisplayPreset {
  id: string;
  name: string;
  description: string | null;
  settings: DisplayPresetSettings;
  createdAt: string;
}

export interface CreateDisplayPresetInput {
  name: string;
  description?: string | null;
  settings: DisplayPresetSettings;
}

export type UpdateDisplayPresetInput = Partial<CreateDisplayPresetInput>;

/** Standard error shape returned by the API. */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
