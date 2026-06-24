/**
 * Shared eeSimple Bookmarks domain types.
 *
 * These are consumed by both the Fastify API (`@eesimple/middleware`) and the React client
 * (`@eesimple/client`) so the wire contract stays in one place.
 */

import type { ConditionMatchField, ConditionMatchOperator, ConditionTree } from "./conditions.js";
import type { BookmarkSectionsValue, ChoicesDisplayType, ChoicesItem, CustomPropertyType, DateTimeFormat, NumberFormat, SectionEntryType } from "./customProperties.js";
import type { ImportBlacklistKind } from "./importBlacklist.js";

export * from "./conditions.js";
export * from "./customProperties.js";
export * from "./importBlacklist.js";
export * from "./urlCleanup.js";
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
  /** Specific reason the last favicon auto-grab attempt failed, or `null` when not yet attempted or the last attempt succeeded. */
  faviconAutoGrabError?: "no_image" | "bad_image" | "blocked" | "server_error" | "fetch_error" | null;
  /** The category this website has been assigned to, or `null` when unassigned. */
  category?: YouTubeChannelCategory | null;
  /** Default tag ids applied to bookmarks saved from this website. */
  tagIds?: string[];
  /** Default media type id applied to new bookmarks saved from this website, or `null` when unset. */
  mediaTypeId?: string | null;
}

/** Lightweight website shape carried on a bookmark. */
export type BookmarkWebsite = Pick<Website, "id" | "domain" | "siteName" | "slug" | "imageUrl">;

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
  /** Category to associate with this website. `null` clears the association; omit to leave unchanged. */
  categoryId?: string | null;
  /** Full replacement list of default tag ids. Omit to leave unchanged. */
  tagIds?: string[];
  /** Default media type to apply to new bookmarks from this website. `null` clears it; omit to leave unchanged. */
  mediaTypeId?: string | null;
}

/** Result of looking up the website for a URL without creating one — powers the form banner. */
export interface WebsiteLookup {
  /** Normalized host of the URL, resolved through a verified shortened link to the parent site. */
  domain: string | null;
  /** Whether a website already exists for that domain. */
  exists: boolean;
  /** The existing website's site name when `exists`, otherwise `null`. */
  siteName: string | null;
  /** The existing website's default media type id when `exists` and set, otherwise `null`. */
  mediaTypeId: string | null;
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
  /** Domains whose redirect chains should never be followed (e.g. `docs.google.com`). */
  redirectIgnoreList: string[];
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
  /** When false, the homepage text block is hidden even if homepageText is non-empty. */
  homepageTextEnabled: boolean;
  /** When on, the left sidebar shows a link to the Coolify instance (opens in a new tab). */
  coolifyLinkEnabled: boolean;
  /** URL of the Coolify instance shown in the sidebar when `coolifyLinkEnabled` is on. */
  coolifyUrl: string;
  /** When on, the left sidebar shows a link to the Swagger/OpenAPI docs at `/docs`. */
  docsLinkEnabled: boolean;
  /** When on, the left sidebar shows a link to the Storybook UI at `/storybook`. */
  storybookLinkEnabled: boolean;
  /** Category IDs hidden in the left sidebar. Empty = all visible. */
  hiddenCategoryIds: string[];
  /** Taxonomy item keys hidden in the left sidebar (tags / websites / media-types / youtube-channels). */
  hiddenTaxonomyItems: string[];
  /** Customization item keys hidden in the left sidebar (custom-properties / property-groups / autofill). */
  hiddenCustomizationItems: string[];
  /** Management item keys hidden in the left sidebar (categories / tags). */
  hiddenManagementItems: string[];
  /** Group keys for entire sidebar sections that are disabled (categories / taxonomies / customization / management). */
  hiddenSidebarGroups: string[];
  /** When on, blurring the bookmark URL field auto-fetches the page title. */
  autoFetchTitle: boolean;
  /** When on, the Add Bookmark Images section starts collapsed and the page image is fetched on save. */
  autoFetchImage: boolean;
  /** Modifier held while clicking an Edit button to open the item in the drawer instead of its page. */
  sidebarOpenModifier: SidebarOpenModifier;
  /** Image size on the bookmark detail page/panel. */
  bookmarkDetailImageSize: BookmarkDetailImageSize;
  /** Video embed size on the bookmark detail page/panel. */
  bookmarkDetailVideoSize: BookmarkDetailVideoSize;
  /** Layout of the bookmark detail page/panel: single stacked column or vertical tabs. */
  bookmarkDetailLayout: BookmarkDetailLayout;
  /** When true, listing pages auto-open filters in the right-hand drawer instead of the left column. */
  filtersInDrawer: boolean;
  /** When true, the left filter rail is hidden on listing pages; a Show-filters toggle appears in the header. */
  filtersHidden: boolean;
  /** When pinned, the right-hand panel docks as a persistent column instead of a floating drawer. */
  panelPinned: boolean;
  /** Viewport widths (px) below which the drawer is unpinned (floats) even when panelPinned is true. */
  drawerUnpinnedBreakpoints: number[];
  /** Width component of the built-in "Cropped" aspect ratio. */
  croppedWidth: number;
  /** Height component of the built-in "Cropped" aspect ratio. */
  croppedHeight: number;
}

/**
 * The subset of {@link AppSettings} that drives the opt-in "Advanced" sidebar links (Coolify, docs,
 * Storybook), edited on the Advanced settings page. Persisted server-side so the choices stick
 * across devices and browsers, rather than living only in per-device local storage.
 */
export interface AdvancedSettings {
  coolifyLinkEnabled: boolean;
  coolifyUrl: string;
  docsLinkEnabled: boolean;
  storybookLinkEnabled: boolean;
}

/** Payload for replacing the advanced settings. */
export type UpdateAdvancedSettingsInput = AdvancedSettings;

/** Space used by a single PostgreSQL table (its data + indexes + TOAST), with an estimated row count. */
export interface DatabaseTableUsage {
  /** The table name in the `public` schema. */
  tableName: string;
  /** Total on-disk size in bytes (`pg_total_relation_size`: heap + indexes + TOAST). */
  totalBytes: number;
  /** Estimated live-row count (`pg_class.reltuples`); approximate and `0` before the table is analyzed. */
  rowEstimate: number;
}

/** A read-only snapshot of how much disk space the database is using, surfaced in Advanced settings. */
export interface DatabaseUsageReport {
  /** Per-table usage, largest first. */
  tables: DatabaseTableUsage[];
  /** Total size of the whole database in bytes (`pg_database_size`). */
  totalBytes: number;
  /** ISO timestamp of when the snapshot was taken. */
  capturedAt: string;
}

/**
 * The subset of {@link AppSettings} that drives left-sidebar customization (which categories,
 * taxonomy items, customization tools, management pages, and whole groups are shown). Persisted
 * server-side so the customized sidebar follows the user across devices.
 */
export interface SidebarCustomizationSettings {
  hiddenCategoryIds: string[];
  /** Category IDs shown under a "See More" expansion in the sidebar (not hidden outright). */
  seeMoreCategoryIds: string[];
  hiddenTaxonomyItems: string[];
  /** Taxonomy item keys shown under a "See More" expansion in the sidebar (not hidden outright). */
  seeMoreTaxonomyItems: string[];
  hiddenCustomizationItems: string[];
  /** Customization item keys shown under a "See More" expansion in the sidebar (not hidden outright). */
  seeMoreCustomizationItems: string[];
  hiddenManagementItems: string[];
  hiddenSidebarGroups: string[];
}

/** Payload for replacing the sidebar-customization settings. */
export type UpdateSidebarCustomizationInput = SidebarCustomizationSettings;

/**
 * The subset of {@link AppSettings} that drives add-bookmark automation and the open-in-drawer
 * modifier. Persisted server-side so the behavior choices follow the user across devices.
 */
export interface AutomationSettings {
  autoFetchTitle: boolean;
  autoFetchImage: boolean;
  sidebarOpenModifier: SidebarOpenModifier;
}

/** Payload for replacing the automation settings. */
export type UpdateAutomationInput = AutomationSettings;

/**
 * The subset of {@link AppSettings} that drives display/detail preferences: bookmark detail media
 * sizing + layout, filter placement, right-panel pin behavior, and the built-in "Cropped" aspect
 * ratio. Persisted server-side so the display choices follow the user across devices.
 */
export interface DisplayPreferenceSettings {
  bookmarkDetailImageSize: BookmarkDetailImageSize;
  bookmarkDetailVideoSize: BookmarkDetailVideoSize;
  bookmarkDetailLayout: BookmarkDetailLayout;
  filtersInDrawer: boolean;
  filtersHidden: boolean;
  panelPinned: boolean;
  drawerUnpinnedBreakpoints: number[];
  croppedWidth: number;
  croppedHeight: number;
}

/** Payload for replacing the display-preference settings. */
export type UpdateDisplayPreferenceInput = DisplayPreferenceSettings;

/** The subset of {@link AppSettings} that drives homepage content (read/written together). */
export interface HomepageContentSettings {
  homepageText: string;
  homepageTextWidth: HomepageContentWidth;
  bookmarkQuickAddEnabled: boolean;
  bookmarkQuickAddWidth: HomepageContentWidth;
  bookmarkQuickAddDisplay: QuickAddDisplay;
  /** When true, the default "Homepage" title and description are hidden on the homepage. */
  homepageHeaderHidden: boolean;
  /** When false, the homepage text block is hidden even if homepageText is non-empty. */
  homepageTextEnabled: boolean;
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
  /** Optional Lucide icon name shown in the MediaTypePill on bookmark cards. */
  icon: string | null;
  /** Whether this is a seeded built-in (protected from rename/delete). */
  builtIn: boolean;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** Id of the parent media type, or `null` for a top-level (root) type. One level of nesting only. */
  parentId: string | null;
  /** ISO-8601 timestamp of when the media type was created. */
  createdAt: string;
  /** Distinct bookmarks with this media type or any child (populated by list endpoints). */
  bookmarkCount?: number;
  /** Bookmarks with this media type directly, excluding its children (the "No Child" bucket). */
  ownBookmarkCount?: number;
}

/** A media type with its children populated — used to render the taxonomy tree. */
export interface MediaTypeNode extends MediaType {
  children: MediaTypeNode[];
}

/** Lightweight media-type shape carried on a bookmark. */
export type BookmarkMediaType = Pick<MediaType, "id" | "name" | "slug" | "icon" | "parentId">;

/** Payload for creating a custom media type. */
export interface CreateMediaTypeInput {
  name: string;
  sortOrder?: number;
  icon?: string | null;
  /** Parent media type id; omit/null for a root type. */
  parentId?: string | null;
}

/** Payload for updating a media type (rename, reorder, and/or reparent). */
export interface UpdateMediaTypeInput {
  name?: string;
  sortOrder?: number;
  icon?: string | null;
  /** Parent media type id; `null` to make it a root. */
  parentId?: string | null;
}

/**
 * A publisher in the "Publishers" taxonomy. Links a publishing house or individual
 * to their optional website, so bookmarks (especially offline/book items) can carry
 * publisher info.
 */
export interface Publisher {
  id: string;
  /** Display name, e.g. "O'Reilly Media". Unique. */
  name: string;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Id of the website this publisher is associated with, or null when unset. */
  websiteId: string | null;
  /** The associated website, populated by list/get endpoints. */
  website?: { id: string;
    domain: string;
    siteName: string; } | null;
  /** ISO-8601 timestamp of when the publisher was created. */
  createdAt: string;
  /** Distinct bookmarks with this publisher (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Lightweight publisher shape carried on a bookmark. */
export type BookmarkPublisher = Pick<Publisher, "id" | "name" | "slug">;

/** Payload for creating a publisher. */
export interface CreatePublisherInput {
  name: string;
  /** Id of the website to associate with this publisher; null to leave unset. */
  websiteId?: string | null;
}

/** Payload for updating a publisher. */
export interface UpdatePublisherInput {
  name?: string;
  /** Id of the website to associate with this publisher; null to clear it. */
  websiteId?: string | null;
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
 * A relationship type in the "Relationship Types" taxonomy (Similar, Parent/child, Opposite, …).
 * Classifies how two bookmarks relate. `directional` types (e.g. Parent/child) encode a from→to
 * direction (bookmark A is the parent/source, bookmark B is the child/target); symmetric types
 * (Similar, Opposite) read the same from either side. Built-ins can't be renamed/deleted; users may
 * add their own.
 */
export interface RelationshipType {
  id: string;
  /** Display name, e.g. `"Parent/child"`. Unique. */
  name: string;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Whether the relationship has a direction (parent→child) rather than being symmetric. */
  directional: boolean;
  /** Whether this is a seeded built-in (protected from rename/delete). */
  builtIn: boolean;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** ISO-8601 timestamp of when the relationship type was created. */
  createdAt: string;
  /** Number of relationship edges using this type (populated by list endpoints). */
  relationshipCount?: number;
  /** Distinct bookmarks having a relationship of this type (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Payload for creating a relationship type. */
export interface CreateRelationshipTypeInput {
  name: string;
  directional?: boolean;
  sortOrder?: number;
}

/** Payload for updating a relationship type (rename, toggle direction, and/or reorder). */
export interface UpdateRelationshipTypeInput {
  name?: string;
  directional?: boolean;
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
  /** Short self-identifiers the channel appends to video titles (e.g. "SNL"). Stripped on fetch. */
  selfIds: string[];
  /**
   * Serving URL for the channel's avatar (with a `?v=` cache-buster), or `null` when none is stored.
   * Auto-captured on first sighting and re-grabbable from the listing. Populated by list/get endpoints.
   */
  imageUrl?: string | null;
  /** The category this channel has been assigned to, or `null` when unassigned. */
  category?: YouTubeChannelCategory | null;
  /** Default tag ids applied to bookmarks saved from this channel. */
  tagIds?: string[];
  /** Default media type id applied to new bookmarks saved from this channel, or `null` when unset. */
  mediaTypeId?: string | null;
}

/** Lightweight channel shape carried on a bookmark. */
export type BookmarkYouTubeChannel = Pick<YouTubeChannel, "id" | "name" | "slug" | "imageUrl">;

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

/** Payload for creating a YouTube channel by hand (as opposed to auto-creation from a bookmark URL). */
export interface CreateYouTubeChannelInput {
  /** Full YouTube channel URL, e.g. `https://www.youtube.com/@mkbhd`. Used to derive the channel key. */
  channelUrl: string;
  /** Display name for the channel. */
  name: string;
}

/** Payload for updating a YouTube channel (rename and/or self-identifier list). */
export interface UpdateYouTubeChannelInput {
  name?: string;
  /** Full replacement list of self-identifiers. Omit to leave unchanged. */
  selfIds?: string[];
  /** Category to associate with this channel. `null` clears the association; omit to leave unchanged. */
  categoryId?: string | null;
  /** Full replacement list of default tag ids. Omit to leave unchanged. */
  tagIds?: string[];
  /** Default media type to apply to new bookmarks from this channel. `null` clears it; omit to leave unchanged. */
  mediaTypeId?: string | null;
}

/**
 * A newsletter publication (e.g. "Smashing Magazine", "The Pragmatic Engineer") in the "Newsletters"
 * taxonomy. Selected during a newsletter import; its default category / tags / media type are applied
 * to the bookmarks created on approval. A newsletter has issues (= its imports).
 */
export interface Newsletter {
  id: string;
  /** Human-friendly publication name; renamable. */
  name: string;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** ISO-8601 timestamp of when the newsletter was created. */
  createdAt: string;
  /** Number of bookmarks associated with this newsletter (populated by list endpoints). */
  bookmarkCount?: number;
  /** The category this newsletter has been assigned as a default, or `null` when unassigned. */
  category?: NewsletterCategory | null;
  /** Default tag ids applied to bookmarks imported from this newsletter. */
  tagIds?: string[];
  /** Default media type id applied to new bookmarks imported from this newsletter, or `null`. */
  mediaTypeId?: string | null;
}

/** Lightweight category shape embedded on a newsletter. */
export type NewsletterCategory = Pick<Category, "id" | "name" | "slug" | "icon">;

/** Lightweight newsletter shape carried on a bookmark. */
export type BookmarkNewsletter = Pick<Newsletter, "id" | "name" | "slug">;

/** A person or entity credited as the creator of a bookmarked item. */
export interface Author {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  bookmarkCount?: number;
  authorWebsiteUrl: string | null;
  biographyUrl: string | null;
  imageUrl: string | null;
}

/** Lightweight author shape carried on a bookmark. */
export type BookmarkAuthor = Pick<Author, "id" | "name" | "slug">;

/** Payload for creating a new author. */
export interface CreateAuthorInput {
  name: string;
}

/** Payload for partially updating an author. */
export interface UpdateAuthorInput {
  name?: string;
  authorWebsiteUrl?: string | null;
  biographyUrl?: string | null;
}

/** Lightweight import shape carried on a bookmark (the import event it was created from). */
export interface BookmarkImport {
  id: string;
  /** The import label (provided title / source URL / uploaded filename), or `null`. */
  title: string | null;
  /** ISO-8601 timestamp of when the import was created. */
  createdAt: string;
}

/** Payload for creating a newsletter (name only). */
export interface CreateNewsletterInput {
  name: string;
}

/** Payload for updating a newsletter (rename and/or default category / tags / media type). */
export interface UpdateNewsletterInput {
  name?: string;
  /** Default category. `null` clears the association; omit to leave unchanged. */
  categoryId?: string | null;
  /** Full replacement list of default tag ids. Omit to leave unchanged. */
  tagIds?: string[];
  /** Default media type. `null` clears it; omit to leave unchanged. */
  mediaTypeId?: string | null;
}

/** Body for the manual issue↔bookmark associate / disassociate endpoints. */
export interface IssueBookmarksInput {
  bookmarkIds: string[];
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
  /** Bookmarks with no image and no prior auto-grab error — eligible for bulk auto-fetch. */
  pendingAutoFetchCount: number;
}

/** Result of a bulk auto-fetch run: how many images were stored vs. how many failed. */
export interface BulkAutoFetchResult {
  fetched: number;
  failed: number;
}

/** Live status of the in-progress (or just-completed) background image auto-fetch job. */
export type AutoFetchJobStatus
  = | { status: "idle" }
    | { status: "running";
      totalCount: number;
      processedCount: number; }
      | { status: "done";
        fetched: number;
        failed: number; };

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
  url: string | null;
  /** Original URL before any cleanup was applied, or `null` when no cleanup was performed. */
  originalUrl: string | null;
  /** Human-friendly title, e.g. "GitHub". */
  title: string;
  /** Optional free-form description. */
  description: string | null;
  /**
   * The newsletter passage this bookmark was sorted from — the surrounding paragraph plus the
   * nearest heading — captured at import time. `null` for bookmarks not created from a newsletter.
   */
  newsletterContext: string | null;
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
  /** The newsletter this bookmark was imported from, or `null`. */
  newsletter: BookmarkNewsletter | null;
  /** The publisher of this bookmarked item, or null when unset. */
  publisher: BookmarkPublisher | null;
  /** The import event this bookmark was created from, or `null`. */
  import: BookmarkImport | null;
  /** Tags assigned to this bookmark, drawn from the taxonomy. */
  tags: BookmarkTag[];
  /** Authors credited for this bookmarked item. */
  authors: BookmarkAuthor[];
  /** Number-typed custom property values (includes computed `calculate` results) assigned to this bookmark. */
  numberValues: BookmarkNumberValue[];
  /** Boolean custom property values assigned to this bookmark. */
  booleanValues: BookmarkBooleanValue[];
  /** Date/time custom property values assigned to this bookmark. */
  dateTimeValues: BookmarkDateTimeValue[];
  /** Choices custom property values assigned to this bookmark. */
  choicesValues: BookmarkChoicesValue[];
  /** Item-in-items custom property values assigned to this bookmark. */
  progressValues: BookmarkProgressValue[];
  /** Sections custom property values (chapters, page ranges, URL anchors) assigned to this bookmark. */
  sectionsValues: BookmarkSectionsValue[];
  /**
   * Image/file custom property values assigned to this bookmark. Unlike the scalar value arrays,
   * these are NOT part of `CreateBookmarkInput`/`UpdateBookmarkInput`: the blobs are uploaded
   * through dedicated multipart routes, never the bookmark JSON payload.
   */
  fileValues: BookmarkFileValue[];
  /** Typed relationships from this bookmark to other bookmarks (see {@link BookmarkRelationship}). */
  relationships: BookmarkRelationship[];
  /** Homepage ordering weight; higher values appear first. */
  priority: number;
  /** ISO-8601 timestamp of when the bookmark was created. */
  createdAt: string;
}

/** Payload for creating a bookmark. */
export interface CreateBookmarkInput {
  url?: string | null;
  /** Original URL before cleanup; omit when no cleanup was applied. */
  originalUrl?: string | null;
  title: string;
  description?: string | null;
  /** Newsletter passage this bookmark was sorted from (paragraph + nearest heading); usually only set on newsletter approval. */
  newsletterContext?: string | null;
  /** Id of the category to assign; omit to fall back to the built-in "Default" category. */
  categoryId?: string;
  /** Ids of tags to assign, drawn from the taxonomy. */
  tagIds?: string[];
  /** Ids of authors to credit for this item. */
  authorIds?: string[];
  /** Number custom property values to assign (calculate results are computed server-side). */
  numberValues?: BookmarkNumberValue[];
  /** Boolean custom property values to assign. */
  booleanValues?: BookmarkBooleanValue[];
  /** Date/time custom property values to assign. */
  dateTimeValues?: BookmarkDateTimeValue[];
  /** Choices custom property values to assign. */
  choicesValues?: BookmarkChoicesValue[];
  /** Item-in-items custom property values to assign. */
  progressValues?: BookmarkProgressValue[];
  /** Sections custom property values to assign. */
  sectionsValues?: BookmarkSectionsValue[];
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
  /** Id of the newsletter (publication) this bookmark belongs to, or `null`. */
  newsletterId?: string | null;
  /** Id of the import event this bookmark was created from, or `null`. */
  importId?: string | null;
  /** Id of the publisher to assign; null to clear. Omit to leave unchanged. */
  publisherId?: string | null;
}

/** Payload for partially updating a bookmark. */
export type UpdateBookmarkInput = Partial<CreateBookmarkInput>;

/** Minimal bookmark shape for the bulk shortened-link expansion review list. */
export interface BookmarkUrlSummary {
  id: string;
  url: string | null;
  title: string;
}

/**
 * The role of the *other* bookmark in a relationship, relative to the bookmark carrying it:
 * - `parent` / `child` — for `directional` types (e.g. Parent/child), naming the other end.
 * - `related` — for symmetric types (Similar, Opposite), where neither end is privileged.
 */
export type RelationshipRole = "parent" | "child" | "related";

/** A single typed relationship edge as seen from one bookmark, pointing at the other bookmark. */
export interface BookmarkRelationship {
  /** The bookmark on the other end of the edge. */
  bookmark: BookmarkUrlSummary;
  /** Id of the relationship type (Similar, Parent/child, …). */
  relationshipTypeId: string;
  /** Display name of the relationship type, denormalized for rendering. */
  relationshipTypeName: string;
  /** Whether the type is directional (parent→child) rather than symmetric. */
  directional: boolean;
  /** Role of `bookmark` relative to the carrying bookmark. */
  role: RelationshipRole;
  /** Optional, more specific free-text label for this edge (e.g. "sequel", "same author"). */
  label: string | null;
}

/** One entry when replacing a bookmark's relationships: the other bookmark, its type, and a label. */
export interface UpdateBookmarkRelationshipEntry {
  /** Id of the bookmark on the other end. */
  bookmarkId: string;
  /** Id of the relationship type to apply. */
  relationshipTypeId: string;
  /** Optional, more specific free-text label. */
  label?: string | null;
  /**
   * For a directional type, whether `bookmarkId` is the parent or child of the edited bookmark.
   * Ignored for symmetric types. Defaults to `child` (the edited bookmark is the parent).
   */
  direction?: "parent" | "child";
}

/** Payload for replacing the full set of relationships for a bookmark. */
export interface UpdateBookmarkRelationshipsInput {
  relationships: UpdateBookmarkRelationshipEntry[];
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

/** Per-item outcome of a bulk bookmark update/delete (set category, tags, property value, …). */
export interface BulkBookmarkResult {
  id: string;
  status: "applied" | "deleted" | "not-found" | "error";
  /** Human-readable detail when the status isn't `applied`/`deleted`. */
  message?: string;
}

/** Whether a bulk tag operation adds the given tags to, or removes them from, each bookmark. */
export type BulkBookmarkTagOp = "add" | "remove";

/** Per-item outcome of a bulk entity delete (bookmarks or any taxonomy listing). */
export interface BulkDeleteResult {
  id: string;
  status: "deleted" | "skipped-built-in" | "not-found" | "error";
  /** Human-readable detail when the status isn't `deleted`. */
  message?: string;
}

// --- Imports (ingest) ------------------------------------------------------------------------

/** Which ingest source produced an import. */
export type ImportSource = "paste" | "url" | "upload";

/**
 * Status of a single extracted candidate link as it moves through the Inbox review queue:
 * - `pending` — extracted and awaiting review.
 * - `approved` — a real bookmark was created from it (`createdBookmarkId` set).
 * - `rejected` — the user dismissed it.
 * - `duplicate` — its URL already exists as a bookmark (`duplicateBookmarkId` set).
 * - `error` — approval failed for a non-duplicate reason (`errorReason` set).
 * - `blocked` — the user blocked it (its URL was added to the Imports Blacklist).
 */
export type ImportItemStatus
  = "pending" | "approved" | "rejected" | "duplicate" | "error" | "blocked";

/**
 * Processing status of a whole import as it moves through the background queue:
 * - `queued` — created, waiting for the worker to pick it up.
 * - `processing` — the worker is fetching/extracting/enriching its links.
 * - `complete` — all links extracted and staged in the Inbox.
 * - `failed` — the import errored (page fetch failed, etc.); see `errorReason`.
 *
 * Legacy imports created before queuing have `status === null` and are treated as `complete`.
 */
export type ImportStatus = "queued" | "processing" | "complete" | "failed";

/** One extracted candidate article link within an import. */
export interface ImportItem {
  id: string;
  importId: string;
  /** The URL we'll save: the original link after redirect-unwrap + canonicalize. */
  url: string | null;
  /** The original (possibly tracker-wrapped) href as extracted from the source. */
  rawUrl: string;
  /** Seed title — the anchor text, or an enriched page title. */
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  /** The surrounding source passage (paragraph + nearest heading) the link was found in, or `null`. */
  newsletterContext: string | null;
  /** The visible anchor text the link was extracted from. */
  anchorText: string | null;
  /** Per-item category override applied on approval; falls back to the import's default. */
  categoryId: string | null;
  status: ImportItemStatus;
  /**
   * Once a bookmark has been created (or the item was blocked), the item is flagged for deletion and
   * the Import Settings purge action sweeps it away. Stays visible in the Inbox until then.
   */
  markedForDeletion: boolean;
  /** When `status === "duplicate"`, the existing bookmark this collided with. */
  duplicateBookmarkId: string | null;
  /** When `status === "approved"`, the bookmark created from this item. */
  createdBookmarkId: string | null;
  /** When `status === "error"`, a human-readable reason approval failed. */
  errorReason: string | null;
  createdAt: string;
}

/** An import event with its extracted candidate items. */
export interface Import {
  id: string;
  source: ImportSource;
  /** Optional label (provided title, source post URL, or uploaded filename). */
  title: string | null;
  /** The fetched post URL (source = "url") or null. */
  sourceUrl: string | null;
  /** The newsletter (publication) this import belongs to, or `null`. */
  newsletterId: string | null;
  /** Default category applied to every link approved from this import (per-item override wins). */
  defaultCategoryId: string | null;
  createdAt: string;
  /** Background-queue status; `null` for legacy imports created before queuing (treat as complete). */
  status: ImportStatus | null;
  /** Total links the worker will process (set once extraction completes), or `null` while queued. */
  totalCount: number | null;
  /** Links processed so far (advances during the enrich pass), or `null` while queued. */
  processedCount: number | null;
  /** Human-readable reason when `status === "failed"`. */
  errorReason: string | null;
  /** URLs of items approved from this import (persisted so the list survives item purges). */
  allowedUrls: string[];
  /** URLs of items blocked from this import (persisted so the list survives item purges). */
  blockedUrls: string[];
  /** URLs of items rejected from this import (persisted so the list survives item purges). */
  rejectedUrls: string[];
  /** URLs of items still awaiting review (derived live from remaining pending items). */
  pendingUrls: string[];
  items: ImportItem[];
}

/** Per-status counts for an import, used by the list views (no items). */
export interface ImportSummary {
  id: string;
  source: ImportSource;
  title: string | null;
  sourceUrl: string | null;
  /** The newsletter (publication) this import belongs to, or `null`. */
  newsletterId: string | null;
  defaultCategoryId: string | null;
  createdAt: string;
  /** Background-queue status; `null` for legacy imports (treat as complete). */
  status: ImportStatus | null;
  /** Total links the worker will process, or `null` while queued. */
  totalCount: number | null;
  /** Links processed so far, or `null` while queued. */
  processedCount: number | null;
  /** Human-readable reason when `status === "failed"`. */
  errorReason: string | null;
  /** Total extracted items. */
  itemCount: number;
  /** Items by status. */
  statusCounts: Record<ImportItemStatus, number>;
  /** URLs of items approved from this import (persisted so the list survives item purges). */
  allowedUrls: string[];
  /** URLs of items blocked from this import (persisted so the list survives item purges). */
  blockedUrls: string[];
  /** URLs of items rejected from this import (persisted so the list survives item purges). */
  rejectedUrls: string[];
  /** URLs of items still awaiting review (derived live from remaining pending items). */
  pendingUrls: string[];
}

/**
 * A queued/in-flight import as surfaced by `GET /api/imports/active` — the minimal shape the header
 * progress indicator needs: where it came from plus live progress. Dropped from the list once it
 * reaches `complete`/`failed`.
 */
export interface ActiveImport {
  id: string;
  source: ImportSource;
  /** A short human label for the source — the newsletter name, the import title, or the source URL. */
  sourceLabel: string | null;
  status: ImportStatus;
  /** Total links to process, or `null` until extraction finishes. */
  totalCount: number | null;
  /** Links processed so far. */
  processedCount: number | null;
}

/**
 * An import item enriched with its parent import's source context, for the global Inbox list (whose
 * rows come from many imports). Extends {@link ImportItem} with a human label of where it came from.
 */
export interface InboxItem extends ImportItem {
  /** The import event's ingest source ("paste" | "url" | "upload"). */
  importSource: ImportSource;
  /** A short human label for the source — the newsletter name, or the import's title / source url. */
  sourceLabel: string | null;
}

/** Body for the paste ingest endpoint. */
export interface IngestPasteInput {
  /** Raw HTML or plain text. */
  content: string;
  /** How to parse `content`; defaults to `"auto"` (sniff for HTML tags). */
  kind?: "html" | "text" | "auto";
  /** Optional label for the created import. */
  title?: string;
  /** The newsletter (publication) this import belongs to, or `null`. */
  newsletterId?: string | null;
  /** Default category applied to every link approved from this import. */
  defaultCategoryId?: string | null;
}

/** Body for the fetch-URL ingest endpoint. */
export interface IngestUrlInput {
  /** A public "view in browser" post URL to fetch and extract links from. */
  url: string;
  /** The newsletter (publication) this import belongs to, or `null`. */
  newsletterId?: string | null;
  /** Default category applied to every link approved from this import. */
  defaultCategoryId?: string | null;
}

/** Patch for editing a staged candidate before approval. */
export interface UpdateImportItemInput {
  url?: string;
  title?: string | null;
  description?: string | null;
  /** Per-item category override (null clears it, falling back to the import default). */
  categoryId?: string | null;
  /** Limited status transitions the user can drive directly (e.g. un-reject). */
  status?: "pending" | "rejected";
}

/** Body for blocking a staged candidate: the blacklist entry to add. */
export interface BlockImportItemInput {
  kind: ImportBlacklistKind;
  value: string;
}

/** Outcome of the Import Settings "delete processed items" purge. */
export interface PurgeImportItemsResult {
  /** Number of import items deleted (marked-for-deletion + blocked). */
  deleted: number;
}

/** Outcome of the Inbox "reject all pending" bulk action. */
export interface RejectPendingItemsResult {
  /** Number of pending import items moved to `rejected`. */
  rejected: number;
}

/** Outcome of the Inbox "recheck pending against the block list" bulk action. */
export interface RecheckPendingItemsResult {
  /** Number of pending import items that matched the block list or a block rule and were moved to `blocked`. */
  blocked: number;
  /** Number of pending import items that matched a reject rule and were moved to `rejected`. */
  rejected: number;
}

/** Counts of orphaned records eligible for the Advanced "clean up orphaned items" sweep. */
export interface OrphanCounts {
  /** Bookmarks with no category (`categoryId IS NULL`). */
  bookmarks: number;
  /** Inbox items whose import has no newsletter (`imports.newsletterId IS NULL`). */
  inboxItems: number;
}

/** Outcome of an orphan-cleanup delete. */
export interface OrphanDeleteResult {
  /** Number of records deleted. */
  deleted: number;
}

/** Per-item outcome of approving a staged candidate (mirrors the bulk-URL result shape). */
export interface ImportApproveResult {
  itemId: string;
  status: "approved" | "duplicate" | "error" | "skipped";
  /** The created bookmark id when `status === "approved"`. */
  bookmarkId?: string;
  /** Human-readable detail when the status isn't `approved`. */
  message?: string;
}

// `CustomPropertyType`, `NumberFormat`, and `DateTimeFormat` are derived from the shared
// `as const` tuples in `./customProperties.ts` (re-exported above) so every zod / JSON-Schema /
// option-list mirror stays in lockstep — add a variant there, not here.

/** The top of a `ratingScale`: a 1–3 or a 1–5 star scale. */
export type RatingMax = 3 | 5;

/**
 * How `true`/`false` values of a boolean property are rendered:
 * - `yes-no` — "Yes" / "No" (the default when null).
 * - `true-false` — "True" / "False".
 * - `enabled-disabled` — "Enabled" / "Disabled".
 * - `icons` — "✓" / "✗".
 * - `stars` — "★" / "☆".
 * - `custom` — user-supplied strings via `booleanTrueLabel` / `booleanFalseLabel`.
 */
export type BooleanLabelPreset = "yes-no" | "true-false" | "enabled-disabled" | "icons" | "stars" | "custom";

/**
 * Which corner of a bookmark card's image a field's value is overlaid in. Honored only when the card
 * actually has an image; a field placed in an image corner with no image falls back to its in-card
 * position. The placement now lives on a {@link CardDisplayRule}, not the property.
 */
export type CardImageCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/**
 * Where a bookmark-card field is shown by a {@link CardDisplayRule}: in one of the four card-body
 * sub-zones (rendered top-to-bottom in {@link CARD_BODY_ZONES} order) or overlaid in one of the
 * image's four corners. A field key (a standard field key or a custom-property id) that appears in
 * **no** zone is hidden.
 *
 * The body sub-zones decide a field's *form*: `card-single-top`/`card-single-bottom` render it as a
 * full-width row; `card-labels` renders its pill/badge form; `card-table` renders it as a
 * `label : value` row in a 2-column table.
 */
export const CARD_FIELD_ZONES = [
  "card-single-top",
  "card-labels",
  "card-table",
  "card-single-bottom",
  "image-top-left",
  "image-top-right",
  "image-bottom-left",
  "image-bottom-right",
] as const;
export type CardFieldZone = (typeof CARD_FIELD_ZONES)[number];

/** The card-body sub-zones, in the order they render top-to-bottom (above = first). */
export const CARD_BODY_ZONES = [
  "card-single-top",
  "card-labels",
  "card-table",
  "card-single-bottom",
] as const satisfies readonly CardFieldZone[];

/** A card-body sub-zone (vs. an image-corner overlay). */
export type CardBodyZone = (typeof CARD_BODY_ZONES)[number];

/** Whether a {@link CardFieldZone} is a card-body sub-zone (vs. an image-corner overlay). */
export function isCardBodyZone(zone: CardFieldZone): boolean {
  return (CARD_BODY_ZONES as readonly CardFieldZone[]).includes(zone);
}

/**
 * How a card-body sub-zone arranges the fields placed in it: `flex` is the wrapping inline flow (the
 * historical behavior — pills wrap, full-width fields take a row); `grid` lays the fields out in a
 * fixed two-column grid. Image-corner zones are unaffected (they always overlay).
 */
export type CardZoneMode = "flex" | "grid";

/** The spacing between fields placed in a card-body sub-zone (absent = `md`). */
export type CardZoneGap = "sm" | "md" | "lg";

/** How fields are aligned along a card-body sub-zone's main (horizontal) axis (absent = `start`). */
export type CardZoneAlign = "start" | "center" | "end" | "between";

/** The flex flow direction of a card-body sub-zone (absent = `row`). Flex mode only. */
export type CardZoneDirection = "row" | "column";

/** Whether a flex card-body sub-zone wraps its fields (absent = `wrap`). Flex mode only. */
export type CardZoneWrap = "wrap" | "nowrap";

/** How fields are aligned along a card-body sub-zone's cross (vertical) axis (absent = `start`). */
export type CardZoneVerticalAlign = "start" | "center" | "end" | "stretch";

/**
 * How a card-body sub-zone arranges the fields placed in it: the {@link CardZoneMode} (flex vs. grid)
 * plus optional {@link CardZoneGap} spacing, main-axis {@link CardZoneAlign} alignment, cross-axis
 * {@link CardZoneVerticalAlign} alignment, and (flex only) {@link CardZoneDirection} flow /
 * {@link CardZoneWrap} wrapping. Image-corner zones are unaffected (they always overlay).
 */
export interface CardZoneLayout {
  mode: CardZoneMode;
  /** Spacing between fields; absent = `md`. */
  gap?: CardZoneGap;
  /** Main-axis (horizontal) field alignment within the zone; absent = `start`. */
  align?: CardZoneAlign;
  /** Cross-axis (vertical) field alignment within the zone; absent = `start`. */
  alignItems?: CardZoneVerticalAlign;
  /** Flex flow direction; absent = `row`. Ignored in grid mode. */
  direction?: CardZoneDirection;
  /** Flex wrapping; absent = `wrap`. Ignored in grid mode. */
  wrap?: CardZoneWrap;
}

/** The per-body-zone {@link CardZoneLayout} a {@link CardDisplayRule} declares (`null` = inherit). */
export type CardZoneLayouts = Record<CardBodyZone, CardZoneLayout>;

/**
 * The default per-zone layout: every body zone flows inline (`flex`) except the Table zone, whose
 * natural form is the two-column `label : value` grid. Gap/align omitted = the `md`/`start` defaults.
 */
export function defaultCardZoneLayouts(): CardZoneLayouts {
  return {
    "card-single-top": {
      mode: "flex",
    },
    "card-labels": {
      mode: "flex",
    },
    "card-table": {
      mode: "grid",
    },
    "card-single-bottom": {
      mode: "flex",
    },
  };
}

/**
 * Normalize a stored layout value into the current {@link CardZoneLayout} object shape. Accepts the
 * legacy bare-string form (`"flex"`/`"grid"`) and `null`/`undefined` (→ `{ mode: fallback }`). This is
 * the single backward-compat parse point shared by the client read path and the middleware backfill.
 */
export function normalizeCardZoneLayout(
  value: CardZoneLayout | CardZoneMode | null | undefined,
  fallback: CardZoneMode,
): CardZoneLayout {
  if (value == null) return {
    mode: fallback,
  };
  if (typeof value === "string") return {
    mode: value,
  };
  return value;
}

/** Map an image-* {@link CardFieldZone} to its {@link CardImageCorner}, or `null` for a card-body zone. */
export function zoneToCorner(zone: CardFieldZone): CardImageCorner | null {
  switch (zone) {
    case "image-top-left": return "top-left";
    case "image-top-right": return "top-right";
    case "image-bottom-left": return "bottom-left";
    case "image-bottom-right": return "bottom-right";
    default: return null;
  }
}

/**
 * One field placed in a {@link CardFieldZone}. `key` is a standard field key (see the client's
 * `STANDARD_CARD_FIELDS`) or a custom-property id. `scale`/`mobileScale` only apply in an image-* zone
 * (they style the corner overlay); `hideLabel`/`hideIcon` apply in image-* zones and the `card-table`
 * zone.
 */
export interface CardFieldPlacement {
  key: string;
  /** Overlay scale factor (0.75, 1, 1.5, or 2); omitted/`1` is normal size. Image zones only. */
  scale?: number;
  /** Mobile overlay scale; `null`/omitted inherits `scale`. Image zones only. */
  mobileScale?: number | null;
  /**
   * When true, drop the field's name label, showing only the value. Honored on image-corner overlays
   * (standard fields and custom properties), in the `card-table` zone (collapses the 2-column row to a
   * single value), and on boolean custom-property fields in the body zones (shows only the value).
   */
  hideLabel?: boolean;
  /**
   * When true, drop the field's icon/image (favicon, media-type/category icon, channel avatar,
   * image-property thumbnail) from the overlay, leaving text only. Image zones only; icons/images show
   * by default.
   */
  hideIcon?: boolean;
  /**
   * Boolean custom-property fields only. When true, the value renders even when it is `false`
   * (otherwise a false value hides the field). Defaults to false.
   */
  showIfFalse?: boolean;
  /**
   * Boolean custom-property fields only. When true, the value can be clicked on the card/detail view to
   * toggle it without entering edit mode. Defaults to false.
   */
  clickableInView?: boolean;
  /**
   * Boolean custom-property fields with an icon-like preset (`icons`/`stars`) only. When false, the
   * colon after the property name is suppressed. **Absent/omitted means true** (the default).
   */
  showLabelColon?: boolean;
  /**
   * Boolean custom-property fields with an icon-like preset (`icons`/`stars`) only. When true, the
   * value renders before the property name (e.g. "★ Favorite"). Defaults to false.
   */
  showValueBeforeLabel?: boolean;
}

/**
 * The per-zone, ordered field placements a {@link CardDisplayRule} declares. Every zone key is
 * present (possibly with an empty array); any field key absent from all zones is hidden.
 */
export type CardFieldZones = Record<CardFieldZone, CardFieldPlacement[]>;

/** An empty {@link CardFieldZones} with every zone present and empty. */
export function emptyCardFieldZones(): CardFieldZones {
  return {
    "card-single-top": [],
    "card-labels": [],
    "card-table": [],
    "card-single-bottom": [],
    "image-top-left": [],
    "image-top-right": [],
    "image-bottom-left": [],
    "image-bottom-right": [],
  };
}

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
  /**
   * Half-width of the "quick filter" window applied when filtering bookmarks from a `number` or
   * `datetime` value on the detail page: the filter spans `value ± quickFilterRange`. Stored in the
   * value's own units — raw units for a plain `number`, seconds for a duration `number` and for a
   * `datetime`. `null` (the default) means the quick filter matches the exact value.
   */
  quickFilterRange: number | null;
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
  /** How `true`/`false` values are rendered; `null` defaults to `"yes-no"`. Only relevant for `boolean` type. */
  booleanLabelPreset: BooleanLabelPreset | null;
  /** Custom label for a `true` value; only used when `booleanLabelPreset` is `"custom"`. */
  booleanTrueLabel: string | null;
  /** Custom label for a `false` value; only used when `booleanLabelPreset` is `"custom"`. */
  booleanFalseLabel: string | null;
  /** Top of a `ratingScale` (3 or 5 stars); `null` defaults to 5. Only relevant for `ratingScale`. */
  ratingMax: RatingMax | null;
  /** When true, a `ratingScale` may be set to 0 (no stars); otherwise the minimum is 1. Defaults to false. */
  ratingAllowZero: boolean;
  /** When true, a `ratingScale` allows half-star (0.5) steps. Defaults to false. */
  ratingAllowHalf: boolean;
  /** When true, a `ratingScale` shows its {@link ratingLabel} after the stars. Defaults to false. */
  ratingShowLabel: boolean;
  /** Label shown after a `ratingScale`'s stars (e.g. "out of 5"), or `null`. */
  ratingLabel: string | null;
  /** For a `calculate` property: ids of the `number` properties summed to produce its value. */
  operandPropertyIds: string[];
  /** Ids of the categories this property is assigned to (zero, one, or many). */
  categoryIds: string[];
  /** When true, the property applies to every category, including ones created later (overrides `categoryIds`). */
  allCategories: boolean;
  /** Ids of the media types this property is assigned to (zero, one, or many). */
  mediaTypeIds: string[];
  /** When true, the property applies to every media type, including ones created later (overrides `mediaTypeIds`). */
  allMediaTypes: boolean;
  /** When true, the property's value can be edited inline from a bookmark card's "More" menu. */
  editableOnCard: boolean;
  /** When true, the field shows in the main bookmark form; otherwise it lives under Advanced. Only applies when not `hiddenFromForm`. */
  showInForm: boolean;
  /** When true, the property's field is hidden from the bookmark form entirely (neither main nor Advanced). */
  hiddenFromForm: boolean;
  /** When true, the property's value is shown on bookmark cards in listings. */
  showInListings: boolean;
  /** When true, an `image` property's uploaded objects are counted in the Gallery/quota manifest. Only relevant for `image`/`file`. */
  showInGallery: boolean;
  /** When true, the property's value is shown on the bookmark detail page. Only relevant for `image`/`file`. */
  showInDetails: boolean;
  /** When false, the property is globally inactive: hidden from filters, conditions, category assignment, and the bookmark form. */
  enabled: boolean;
  /** When false, this property does not appear in the category defaults editor. */
  allowDefault: boolean;
  /** Id of the property group this property belongs to, or `null` when ungrouped. */
  propertyGroupId: string | null;
  /** The selectable options for a `choices` property; empty for non-choices types. */
  choicesItems: ChoicesItem[];
  /** How a `choices` property is rendered in the bookmark form; `null` for non-choices types. */
  choicesDisplay: ChoicesDisplayType | null;
  /** When true, a `choices` property allows selecting multiple values. Only relevant for `choices`. */
  choicesMultiple: boolean;
  /** Text shown before the `current` number for an `itemInItems` property (e.g. `""`). */
  itemInItemsBeforeText: string | null;
  /** Text shown between the `current` and `total` numbers for an `itemInItems` property (e.g. `" of "`). */
  itemInItemsBetweenText: string | null;
  /** Text shown after the `total` number for an `itemInItems` property (e.g. `" pages"`). */
  itemInItemsAfterText: string | null;
  /** Default section entry type for a `sections` property; `null` means no preference (any type). */
  sectionsDefaultType: SectionEntryType | null;
  /** Allowed section entry types for a `sections` property; `null` means all types are allowed. */
  sectionsAllowedTypes: SectionEntryType[] | null;
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
  /** Half-width of the `value ± range` quick-filter window for `number`/`datetime` props (value's own units; seconds for duration/datetime). `null` = exact match. */
  quickFilterRange?: number | null;
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
  /** Ids of media types to assign this property to. Omit to leave unassigned. */
  mediaTypeIds?: string[];
  /** When true, the property applies to every media type, including ones created later. Defaults to false. */
  allMediaTypes?: boolean;
  /** When true, the property's value can be edited from a bookmark card's "More" menu. Defaults to false. */
  editableOnCard?: boolean;
  /** When true, the field shows in the main bookmark form; otherwise it lives under Advanced. Only applies when not `hiddenFromForm`. */
  showInForm?: boolean;
  /** When true, the property's field is hidden from the bookmark form entirely. Defaults to false. */
  hiddenFromForm?: boolean;
  /** When true, the property's value is shown on bookmark cards in listings. Defaults to true. */
  showInListings?: boolean;
  /** When true, an `image` property's uploaded objects count toward the Gallery/quota. Defaults to true. Only relevant for `image`/`file`. */
  showInGallery?: boolean;
  /** When true, the property's value is shown on the bookmark detail page. Defaults to true. Only relevant for `image`/`file`. */
  showInDetails?: boolean;
  /** When false, the property is globally inactive. Defaults to true. */
  enabled?: boolean;
  /** When false, this property is excluded from the category defaults editor. Defaults to true. */
  allowDefault?: boolean;
  /** Id of the property group to place this property in, or `null` to leave it ungrouped. */
  propertyGroupId?: string | null;
  /** How `true`/`false` values are rendered. Only relevant for `boolean` type. */
  booleanLabelPreset?: BooleanLabelPreset | null;
  /** Custom label for a `true` value; only used when `booleanLabelPreset` is `"custom"`. */
  booleanTrueLabel?: string | null;
  /** Custom label for a `false` value; only used when `booleanLabelPreset` is `"custom"`. */
  booleanFalseLabel?: string | null;
  /** Top of a `ratingScale` (3 or 5). Defaults to 5. Only relevant for `ratingScale`. */
  ratingMax?: RatingMax | null;
  /** When true, a `ratingScale` may be set to 0. Defaults to false. */
  ratingAllowZero?: boolean;
  /** When true, a `ratingScale` allows half-star steps. Defaults to false. */
  ratingAllowHalf?: boolean;
  /** When true, a `ratingScale` shows its `ratingLabel` after the stars. Defaults to false. */
  ratingShowLabel?: boolean;
  /** Label shown after a `ratingScale`'s stars (e.g. "out of 5"). */
  ratingLabel?: string | null;
  /** Selectable options for a `choices` property. Required when `type` is `"choices"`. */
  choicesItems?: ChoicesItem[];
  /** How a `choices` property is rendered in the bookmark form. Defaults to `"radio"`. */
  choicesDisplay?: ChoicesDisplayType | null;
  /** When true, a `choices` property allows selecting multiple values. Defaults to false. */
  choicesMultiple?: boolean;
  /** Text shown before the `current` number for an `itemInItems` property. */
  itemInItemsBeforeText?: string | null;
  /** Text shown between the `current` and `total` numbers for an `itemInItems` property. */
  itemInItemsBetweenText?: string | null;
  /** Text shown after the `total` number for an `itemInItems` property. */
  itemInItemsAfterText?: string | null;
  /** Default section entry type for a `sections` property. */
  sectionsDefaultType?: SectionEntryType | null;
  /** Allowed section entry types for a `sections` property; `null` means all types. */
  sectionsAllowedTypes?: SectionEntryType[] | null;
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

/**
 * Whether a property is assigned to a given media type. A property with `allMediaTypes` set applies
 * to every media type (including ones created after it); otherwise it applies only to its
 * `mediaTypeIds`. A bookmark with no media type (`null`) is never matched.
 */
export function propertyAppliesToMediaType(
  property: Pick<CustomProperty, "allMediaTypes" | "mediaTypeIds">,
  mediaTypeId: string | null,
): boolean {
  if (!mediaTypeId) return false;
  return property.allMediaTypes || property.mediaTypeIds.includes(mediaTypeId);
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
 * An `image`/`file` custom property value carried on a bookmark. The bytes live in object storage;
 * this carries only the serving metadata (the storage `objectKey` is intentionally not exposed).
 */
export interface BookmarkFileValue {
  propertyId: string;
  /** Serving URL for the bytes, with a `?v=<createdAt>` cache-bust suffix. */
  url: string;
  /** MIME type of the stored bytes (`"image/webp"` for `image`, the original type for `file`). */
  contentType: string;
  /** Size of the stored bytes. */
  byteSize: number;
  /** Original upload filename (used for `file` downloads), or `null` when unknown. */
  originalFilename: string | null;
  /** Pixel width — set for `image` values, `null` for `file` values. */
  width: number | null;
  /** Pixel height — set for `image` values, `null` for `file` values. */
  height: number | null;
}

/** A choices custom property value carried on a bookmark. */
export interface BookmarkChoicesValue {
  propertyId: string;
  /** The selected choice values (slugified keys from {@link ChoicesItem.value}). */
  values: string[];
}

/** An `itemInItems` custom property value carried on a bookmark (e.g. "10 of 100 pages"). */
export interface BookmarkProgressValue {
  propertyId: string;
  /** The "current" count (e.g. pages read). */
  current: number;
  /** The "total" count (e.g. total pages). */
  total: number;
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

/** Payload for replacing the categories whose root-tag allowlist includes a given (root) tag. */
export interface UpdateTagCategoriesInput {
  categoryIds: string[];
}

/** A category's default custom-property values, applied to new bookmarks added to it. */
export interface CategoryPropertyDefaults {
  /** Default number/calculate property values (calculate defaults are ignored on save). */
  numberValues: BookmarkNumberValue[];
  /** Default boolean property values. */
  booleanValues: BookmarkBooleanValue[];
  /** Default date/time property values. */
  dateTimeValues: BookmarkDateTimeValue[];
  /** Default choices property values. */
  choicesValues?: BookmarkChoicesValue[];
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
  /** Existing bookmarks currently matched by this rule's conditions (populated by the list endpoint). */
  matchCount?: number;
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

/** The action an import rule fires when its conditions match a candidate URL. */
export type ImportRuleAction = "approve" | "reject" | "block";

/** A single import rule: a condition tree + action applied to each ingest candidate. */
export interface ImportRule {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  conditions: ConditionTree;
  action: ImportRuleAction;
  sortOrder: number;
  createdAt: string;
}

/** Payload for creating a new import rule. */
export interface CreateImportRuleInput {
  name: string;
  description?: string | null;
  conditions: ConditionTree;
  action: ImportRuleAction;
  sortOrder?: number;
}

/** Payload for partially updating an import rule. */
export type UpdateImportRuleInput = Partial<CreateImportRuleInput>;

/**
 * Request body for previewing which existing bookmarks a condition tree would match. The match is
 * evaluated server-side with the same `evaluateConditions` predicate the autofill engine uses.
 */
export interface AutofillPreviewInput {
  /** The condition tree to test against existing bookmarks. */
  conditions: ConditionTree;
  /**
   * Optional case-insensitive narrowing on bookmark title/url. When set, the result lists the
   * matching candidates (whether or not they satisfy `conditions`) so the caller can show
   * match/no-match for a named bookmark; when omitted, only bookmarks that satisfy `conditions`
   * are returned.
   */
  query?: string;
  /** Maximum number of entries to return (default 5). */
  limit?: number;
}

/** A single bookmark in an autofill preview, with whether it satisfies the previewed conditions. */
export interface AutofillPreviewEntry {
  bookmark: Bookmark;
  matches: boolean;
}

/** Result of an autofill preview. */
export interface AutofillPreviewResult {
  entries: AutofillPreviewEntry[];
}

/** A single bookmark in an autofill backfill list, with whether applying the rule would change it. */
export interface AutofillBackfillEntry {
  bookmark: Bookmark;
  /** True if applying the rule would change at least one field on this bookmark. */
  needsBackfill: boolean;
  /** True if the user has explicitly opted this bookmark out of backfill for this rule. */
  isExempt: boolean;
}

/** Result of `GET /api/autofill-rules/:id/backfill` — all matching bookmarks with backfill status. */
export interface AutofillBackfillResult {
  entries: AutofillBackfillEntry[];
}

/** Body for `POST /api/autofill-rules/:id/backfill/apply`. */
export interface AutofillApplyInput {
  /** Bookmark ids to apply the rule to. Server re-validates conditions; non-matching ids are skipped. */
  bookmarkIds: string[];
}

/** Result of applying an autofill rule's prefill to a set of bookmarks. */
export interface AutofillApplyResult {
  /** How many bookmarks were actually updated. */
  applied: number;
  /** How many were skipped (didn't match conditions or already up to date). */
  skipped: number;
}

/** Per-rule group in the global backfill overview. Only rules with ≥1 qualifying entry are included. */
export interface GlobalAutofillBackfillGroup {
  rule: { id: string;
    name: string;
    slug: string; };
  /** Entries where needsBackfill is true or isExempt is true. */
  entries: AutofillBackfillEntry[];
  needsBackfillCount: number;
  exemptCount: number;
}

/** Result of `GET /api/autofill-rules/backfill` — cross-rule backfill overview. */
export interface GlobalAutofillBackfillResult {
  groups: GlobalAutofillBackfillGroup[];
  totalNeedsBackfill: number;
}

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

/** Bookmark image visibility on a listing/section: full card, image-only, or no image. */
export type BookmarkImageVisibility = "shown" | "image-only" | "off";

/** Rendering mode for a listing/section: a card grid (default) or a data table. */
export type ViewMode = "cards" | "table";

/** Modifier key that, held while clicking an Edit button, opens the item in the right-hand drawer. */
export type SidebarOpenModifier = "alt" | "ctrl" | "shift" | "meta";

/** Bookmark detail page image size preference. */
export type BookmarkDetailImageSize = "small" | "medium" | "large";

/** Bookmark detail page video size: constrained side-by-side, half/two-thirds stacked, or full-width stacked. */
export type BookmarkDetailVideoSize = "standard" | "half" | "twoThirds" | "fullwidth";

/** Bookmark detail page layout: single stacked column (default) or vertical-tabbed sections. */
export type BookmarkDetailLayout = "single" | "tabbed";

/**
 * Image display mode for bookmark cards. Built-in values: "natural" (unconstrained), "cropped"
 * (uses the user's configured crop ratio), "square" (1:1), "opengraph" (1.91:1). Custom aspect
 * ratio UUIDs are also valid values — they reference rows in the `custom_aspect_ratios` table.
 */
export type BookmarkImageMode = "natural" | "cropped" | "square" | "opengraph" | string;

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
  /** Image display mode: "natural", "cropped", "square", "opengraph", or a custom ratio UUID. */
  imageMode: BookmarkImageMode;
  /** Image position in 2-column layouts: "above" (default) or "side". */
  imageLayout: HomepageSectionImageLayout;
  /** Image visibility for this section's cards: "shown" (default), "image-only", or "off". */
  imageVisibility: BookmarkImageVisibility;
  /** Rendering mode for this section: "cards" (default) or "table". */
  viewMode: ViewMode;
  /**
   * Per-zone field placements for this section's cards (standard field key or custom-property id;
   * image-* zones overlay the field on the card image). `null` falls back to the Default card display
   * rule (legacy sections not yet migrated to the zone board); concrete once the section is edited.
   * Supersedes the legacy `hiddenCardFields` + `cornerOverlays` model.
   */
  fieldZones: CardFieldZones | null;
  /**
   * Per-body-zone layout (`flex` inline flow vs. `grid` two-column) for this section's cards, or
   * `null` to fall back to the defaults. Only affects the four card-body sub-zones.
   */
  cardZoneLayouts: CardZoneLayouts | null;
  /** @deprecated Legacy flat hidden-field list; retained for the render fallback until a section is edited. */
  hiddenCardFields: string[];
  /** @deprecated Legacy corner-overlay toggle; superseded by image-* zone placement on `fieldZones`. */
  cornerOverlays: boolean;
  /** When true, the website pill is hidden on this section's cards for a bookmark that also has a YouTube channel. Defaults to false. Owned per-section so homepage cards never inherit the Default card display rule. */
  hideWebsiteForYouTube: boolean;
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
  imageMode?: BookmarkImageMode;
  imageLayout?: HomepageSectionImageLayout;
  imageVisibility?: BookmarkImageVisibility;
  viewMode?: ViewMode;
  fieldZones?: CardFieldZones | null;
  cardZoneLayouts?: CardZoneLayouts | null;
  hiddenCardFields?: string[];
  cornerOverlays?: boolean;
  hideWebsiteForYouTube?: boolean;
}

/** Payload for partially updating a homepage section. */
export type UpdateHomepageSectionInput = Partial<CreateHomepageSectionInput>;

/**
 * A prioritized rule that overrides per-card display for bookmarks matching its `conditions`. Rules
 * form an ordered list (lower `sortOrder` = higher priority); when several match a card, the display
 * is built by a layered merge — for each attribute the highest-priority matching rule that sets it
 * wins, lower rules fill the rest, and the singleton **Default** rule (`isDefault`, always matches,
 * lowest priority, fully concrete) fills whatever remains. A `null` display attribute means "inherit"
 * (fall through to a lower-priority rule / the Default). `fieldZones` is `null` to inherit, or a
 * concrete per-zone placement map to override (a field key absent from all zones is hidden). Resolved
 * entirely client-side at render time.
 */
export interface CardDisplayRule {
  id: string;
  name: string;
  description: string | null;
  conditions: ConditionTree;
  /** Lower = higher priority. The Default rule is always pinned last (lowest priority). */
  sortOrder: number;
  /** The singleton baseline rule: matches every card regardless of `conditions`; cannot be deleted. */
  isDefault: boolean;
  /**
   * Per-zone field placements (`null` = inherit). A field key (standard field key or custom-property
   * id) absent from every zone is hidden; image-* zones overlay the field on the card image. Concrete
   * on the Default rule. Supersedes the legacy `hiddenCardFields` + per-property corner placement.
   */
  fieldZones: CardFieldZones | null;
  /**
   * Per-body-zone layout (`flex` inline flow vs. `grid` two-column), or `null` to inherit. Concrete on
   * the Default rule. Only affects the four card-body sub-zones; image corners always overlay.
   */
  cardZoneLayouts: CardZoneLayouts | null;
  /** Image display mode, or `null` to inherit. Concrete on the Default rule. */
  imageMode: BookmarkImageMode | null;
  /** Image visibility, or `null` to inherit. Concrete on the Default rule. */
  imageVisibility: BookmarkImageVisibility | null;
  /** Image layout, or `null` to inherit. Concrete on the Default rule. */
  imageLayout: HomepageSectionImageLayout | null;
  /**
   * When true, the website pill is hidden on a matching bookmark that also has a YouTube channel
   * (keeping only the channel pill). `null` to inherit. Concrete on the Default rule.
   */
  hideWebsiteForYouTube: boolean | null;
  createdAt: string;
}

/** Payload for creating a card display rule. */
export interface CreateCardDisplayRuleInput {
  name: string;
  description?: string | null;
  conditions: ConditionTree;
  sortOrder?: number;
  fieldZones?: CardFieldZones | null;
  cardZoneLayouts?: CardZoneLayouts | null;
  imageMode?: BookmarkImageMode | null;
  imageVisibility?: BookmarkImageVisibility | null;
  imageLayout?: HomepageSectionImageLayout | null;
  hideWebsiteForYouTube?: boolean | null;
}

/** Payload for partially updating a card display rule. */
export type UpdateCardDisplayRuleInput = Partial<CreateCardDisplayRuleInput>;

/** A saved named configuration of card field zone placements, reusable across display rules. */
export interface CardFieldTemplate {
  id: string;
  name: string;
  description: string | null;
  fieldZones: CardFieldZones;
  createdAt: string;
}

/** Payload for creating a card field template. */
export interface CreateCardFieldTemplateInput {
  name: string;
  description?: string | null;
  fieldZones: CardFieldZones;
}

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
  /** Author name(s) parsed from page metadata (non-YouTube only), or `null` when none were found. */
  authorNames: string[] | null;
  /**
   * Human-readable reasons a YouTube field could not be resolved (e.g. the watch-page fetch failed
   * or a value was absent/unparseable). Present and non-empty only when something went wrong;
   * surfaced so a partial result still explains itself instead of returning a silent `null`.
   */
  diagnostics?: string[];
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

/** Result of following a URL's redirect chain to its final destination (`GET /api/resolve-url`). */
export interface ResolveUrlResult {
  /** The resolved destination URL, or the original when no redirect was followed (or on failure). */
  finalUrl: string;
  /** Whether at least one redirect hop was followed to reach `finalUrl`. */
  redirected: boolean;
  /**
   * A user-facing message describing why the redirect chain couldn't be followed, present only
   * when resolution failed. `finalUrl` is still the original URL in this case.
   */
  resolveError?: string;
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

export type PinnedSidebarEntityType
  = "category"
    | "tag"
    | "website"
    | "media-type"
    | "youtube-channel"
    | "saved-filter";

export interface PinnedSidebarItem {
  id: string;
  entityType: PinnedSidebarEntityType;
  entityId: string;
  sortOrder: number;
  createdAt: string;
}

export interface CreatePinnedSidebarItemInput {
  entityType: PinnedSidebarEntityType;
  entityId: string;
}

/**
 * A Settings (or settings-like management) page the user has favorited for quick access from the
 * sidebar Settings flyout. Keyed by the page's route `path`; the human label is resolved from the
 * client-side `SETTINGS_PAGES` registry, not stored here.
 */
export interface FavoriteSettingsPage {
  id: string;
  path: string;
  sortOrder: number;
  createdAt: string;
}

export interface CreateFavoriteSettingsPageInput {
  path: string;
}

/** A user-defined named aspect ratio available in the Aspect dropdown. */
export interface CustomAspectRatio {
  id: string;
  name: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface CreateCustomAspectRatioInput {
  name: string;
  width: number;
  height: number;
}

/** Standard error shape returned by the API. */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
