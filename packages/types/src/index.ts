/**
 * Shared eeSimple Bookmarks domain types.
 *
 * These are consumed by both the Fastify API (`@eesimple/middleware`) and the React client
 * (`@eesimple/client`) so the wire contract stays in one place.
 */

import type { BookmarkContentKind } from "./bookmarkContentKind.js";
import type { ConditionMatchField, ConditionMatchOperator, ConditionTree } from "./conditions.js";
import type { BookmarkSectionsValue, BookmarkTextValue, ChoicesDisplayType, ChoicesItem, CustomPropertyType, DateTimeFormat, ItemInItemsMediaTypeTexts, NumberFormat, SectionEntryType } from "./customProperties.js";
import type { EntityName, UpdateEntityNameEntry } from "./entityNames.js";
import type { WebsiteExtensionFillRule } from "./extensionFill.js";
import type { BookmarkGenreMood } from "./genreMoods.js";
import type { HomepageWidget } from "./homepageWidgets.js";
import type { ImportBlacklistKind } from "./importBlacklist.js";
import type { LabeledWebsite } from "./labeledWebsites.js";
import type { LanguageUsage, UpdateLanguageUsageEntry } from "./languageUsages.js";
import type { BookmarkLocation } from "./locations.js";
import type { SocialAccountRef, SocialLink } from "./socialMedia.js";
import type { BookmarkTaxonomyTerm } from "./taxonomies.js";
import type { WebsiteScanObservation } from "./websiteScanObservations.js";

export * from "./autofillMerge.js";
export * from "./amazon.js";
export * from "./bookmarkAddForm.js";
export * from "./bookmarkContentKind.js";
export * from "./honto.js";
export * from "./oreilly.js";
export * from "./entityNames.js";
export * from "./entityLayouts.js";
export * from "./conditions.js";
export * from "./extensionFill.js";
export * from "./extensionFillTaxonomy.js";
export * from "./websiteScanObservations.js";
export * from "./genreMoods.js";
export * from "./taxonomies.js";
export * from "./customProperties.js";
export * from "./groupTypes.js";
export * from "./homepageWidgets.js";
export * from "./importBlacklist.js";
export * from "./isbn.js";
export * from "./isbnScrape.js";
export * from "./labeledWebsites.js";
export * from "./languageUsages.js";
export * from "./locationRelations.js";
export * from "./locations.js";
export * from "./parseTemplates.js";
export * from "./podcasts.js";
export * from "./scanPipeline.js";
export * from "./translationSources.js";
export * from "./oembed.js";
export * from "./placeTypes.js";
export * from "./socialMedia.js";
export * from "./titleTags.js";
export * from "./urlCleanup.js";
export * from "./youtube.js";

/** A tag node in the hierarchical taxonomy. `parentId === null` marks a root tag. */
export interface Tag {
  id: string;
  /** Display name, unique among its siblings. */
  name: string;
  /** Multilingual names for this tag, each labelled by language; the `isPrimary` row mirrors `name`. */
  names?: EntityName[];
  /** URL-friendly identifier derived from the name; unique across all tags. */
  slug: string;
  /** Free-text description surfaced on the tag's detail page. */
  description: string | null;
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
  /**
   * When `true`, the tag appears as a quick-toggle checkbox in the bookmark card's "More" menu,
   * letting users tag/untag bookmarks inline without opening the full edit page.
   */
  editableOnCard?: boolean;
  /**
   * When `true`, no autofill backfill operation will apply this tag to any bookmark, regardless of
   * which rule would otherwise include it.
   */
  excludeFromBackfill?: boolean;
}

/** A tag with its children populated — used to render the taxonomy tree. */
export interface TagNode extends Tag {
  children: TagNode[];
}

/** Lightweight tag shape carried on a bookmark (enough to render and group). */
export type BookmarkTag = Pick<Tag, "id" | "name" | "slug" | "parentId" | "editableOnCard">;

/** Payload for creating a tag. */
export interface CreateTagInput {
  name: string;
  /** Parent tag id, or `null`/omitted for a root tag. */
  parentId?: string | null;
  description?: string | null;
}

/** Payload for renaming and/or reparenting a tag. `parentId === null` moves it to root. */
export interface UpdateTagInput {
  name?: string;
  parentId?: string | null;
  editableOnCard?: boolean;
  excludeFromBackfill?: boolean;
  description?: string | null;
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
  /** Path suffix (or substring, when matchMode is "contains") the rule matches (e.g. `"/watch"`, `"/playlist"`); `""` matches any path. */
  pathSuffix: string;
  /** How pathSuffix is matched against the URL path. Defaults to "suffix" when absent. */
  matchMode?: "suffix" | "contains";
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
  /** Free-text description surfaced on the website's detail page. */
  description: string | null;
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
  /** Social media links for this website. */
  socialLinks: SocialLink[];
  /** Labeled websites/links for this website (freeform label + URL, optionally a Websites-taxonomy ref). */
  labeledWebsites: LabeledWebsite[];
  /** Ids of YouTube channels associated with this website. */
  youtubeChannelIds?: string[];
  /** Extra names this site appends to titles (e.g. "GH"); stripped during title fetch. */
  alternateNames: string[];
  /**
   * Extension "check & fill" extraction rules for this site. A `null` stored value always surfaces
   * here as `[]` (null-vs-empty is normalized at the API boundary, matching `alternateNames`).
   */
  extensionFillRules: WebsiteExtensionFillRule[];
  /**
   * Structural facts the server scanner has learned about this site (blocks crawlers, needs headless
   * rendering, …), plus any the operator added by hand. A `null` stored value surfaces here as `[]`
   * (normalized at the API boundary, matching `extensionFillRules`).
   */
  scanObservations: WebsiteScanObservation[];
  /** When true, redirect chains from this site resolve unreliably; its bookmarks appear in Settings → Redirect Failures. */
  redirectResolutionFailure?: boolean;
  /** When true, scanning a bookmark URL from this site reads the page for an ISBN and autofills it. Gates all scan-time ISBN detection. */
  scanUrlForIsbn?: boolean;
  /** Languages associated with this website, each qualified by a usage level. Populated by get endpoints. */
  languageUsages?: LanguageUsage[];
}

/** A website enriched with its domain-derived subdomain children for tree rendering. */
export interface WebsiteNode extends Website {
  /** Child websites whose domain is a subdomain of this site's domain. */
  children: WebsiteNode[];
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
  description?: string | null;
}

/** Payload for updating a website (rename its site name and/or change its domain). */
export interface UpdateWebsiteInput {
  siteName?: string;
  domain?: string;
  shortenedLinks?: ShortenedLink[];
  paramRules?: WebsiteParamRule[];
  description?: string | null;
  /** Category to associate with this website. `null` clears the association; omit to leave unchanged. */
  categoryId?: string | null;
  /** Full replacement list of default tag ids. Omit to leave unchanged. */
  tagIds?: string[];
  /** Default media type to apply to new bookmarks from this website. `null` clears it; omit to leave unchanged. */
  mediaTypeId?: string | null;
  /** Social media links for this website. Replaces the full list; omit to leave unchanged. */
  socialLinks?: SocialLink[];
  /** Labeled websites/links. Replaces the full list; omit to leave unchanged. */
  labeledWebsites?: LabeledWebsite[];
  /** Full replacement list of associated YouTube channel ids. Omit to leave unchanged. */
  youtubeChannelIds?: string[];
  /** Full replacement list of extra site-name aliases used for title stripping. Omit to leave unchanged. */
  alternateNames?: string[];
  /** Full replacement list of extension fill rules. Omit to leave unchanged. */
  extensionFillRules?: WebsiteExtensionFillRule[];
  /** Full replacement list of scanner observations (edited by hand). Omit to leave unchanged. */
  scanObservations?: WebsiteScanObservation[];
  /** When true, flags this site's redirect chains as unreliable. Omit to leave unchanged. */
  redirectResolutionFailure?: boolean;
  /** When true, scan-time ISBN detection runs for bookmark URLs from this site. Omit to leave unchanged. */
  scanUrlForIsbn?: boolean;
}

/** A bookmark stub returned by the redirect-failures endpoint. */
export interface RedirectFailureBookmark {
  id: string;
  url: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
}

/** A website flagged for redirect resolution failure, with its associated bookmarks. */
export interface RedirectFailureWebsite {
  id: string;
  domain: string;
  siteName: string;
  slug: string;
  imageUrl: string | null;
  bookmarks: RedirectFailureBookmark[];
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
  /** When true, the Search from Homepage bar appears on the homepage. */
  searchEnabled: boolean;
  /** Desktop width of the homepage Search block. */
  searchWidth: HomepageContentWidth;
  /** Order the top-of-homepage widgets render in. */
  widgetOrder: HomepageWidget[];
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
  /** Customization item keys hidden in the left sidebar (custom-properties / autofill / …). */
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
  /** Width of a bookmark card's thumbnail in the image-left (row) card layout. */
  bookmarkCardThumbnailSize: BookmarkCardThumbnailSize;
  /** When true, the listing search/filters/sort box floats (sticks to the top while the list scrolls). */
  searchBoxPinned: boolean;
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
  drizzleGatewayLinkEnabled: boolean;
  drizzleGatewayUrl: string;
  githubLinkEnabled: boolean;
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

/** Size of a single index on a table, in bytes. */
export interface DatabaseTableIndexUsage {
  indexName: string;
  bytes: number;
}

/** A single column of a table (name + reported Postgres data type). */
export interface DatabaseTableColumnInfo {
  columnName: string;
  dataType: string;
}

/**
 * Diagnostic detail for a single table, fetched on demand when a row in the Database usage table
 * is expanded — enough to explain *why* a table is bulky (bloat, oversized columns, missing
 * vacuum/analyze, redundant indexes).
 */
export interface DatabaseTableDetail {
  /** The table name in the `public` schema. */
  tableName: string;
  /** On-disk size of the table heap only (`pg_relation_size`). */
  heapBytes: number;
  /** Combined on-disk size of all indexes (`pg_indexes_size`). */
  indexBytes: number;
  /** On-disk size of the table's TOAST storage (large/overflow column values). */
  toastBytes: number;
  /** Total on-disk size (heap + indexes + TOAST). */
  totalBytes: number;
  /** Estimated live-row count (`pg_stat_user_tables.n_live_tup`). */
  rowEstimate: number;
  /** Estimated dead-row count awaiting vacuum (`pg_stat_user_tables.n_dead_tup`). */
  deadRowEstimate: number;
  /** Sequential scan count since the last stats reset. */
  sequentialScans: number;
  /** Index scan count since the last stats reset. */
  indexScans: number;
  /** ISO timestamp of the last manual `VACUUM`, or `null` if never. */
  lastVacuum: string | null;
  /** ISO timestamp of the last autovacuum run, or `null` if never. */
  lastAutoVacuum: string | null;
  /** ISO timestamp of the last manual `ANALYZE`, or `null` if never. */
  lastAnalyze: string | null;
  /** ISO timestamp of the last autoanalyze run, or `null` if never. */
  lastAutoAnalyze: string | null;
  /** Columns in ordinal order. */
  columns: DatabaseTableColumnInfo[];
  /** Indexes on the table, largest first. */
  indexes: DatabaseTableIndexUsage[];
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
  /** Connector link-out keys hidden from the sidebar's Connectors section. */
  hiddenConnectorLinks: string[];
  /** Connector link-out keys shown under a "See More" expansion in the Connectors section. */
  seeMoreConnectorLinks: string[];
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
  /** When on, saving a bookmark whose title contains a tag's name auto-applies that tag. */
  autoApplyTitleTags: boolean;
  /** When on, saving a bookmark whose title contains a location's name auto-applies that location. */
  autoApplyTitleLocations: boolean;
  /** When on, quick-saves from the PWA share target skip the Inbox and are added directly as bookmarks. */
  shareBypassInbox: boolean;
  sidebarOpenModifier: SidebarOpenModifier;
  /** App-configured fallback category for new/uncategorized bookmarks; null = use the seeded built-in. */
  defaultCategoryId: string | null;
}

/** Payload for replacing the automation settings. */
export type UpdateAutomationInput = AutomationSettings;

/** Weight of a single relatedness dimension in the Bookmark Graph: Off / Low / Medium / High. */
export type BookmarkGraphWeight = 0 | 1 | 2 | 3;

/** The dimensions the Bookmark Graph scores two bookmarks' relatedness across. */
export interface BookmarkGraphWeights {
  /** Shared tags. */
  tags: BookmarkGraphWeight;
  /** Same category. */
  category: BookmarkGraphWeight;
  /** Same media type. */
  mediaType: BookmarkGraphWeight;
  /** Shared genres & moods. */
  genreMoods: BookmarkGraphWeight;
  /** Shared people (individual creators). */
  people: BookmarkGraphWeight;
  /** Shared groups (group creators). */
  groups: BookmarkGraphWeight;
  /** Same website. */
  website: BookmarkGraphWeight;
  /** Same YouTube channel. */
  youtubeChannel: BookmarkGraphWeight;
}

/**
 * The subset of {@link AppSettings} that drives the "Related bookmarks" list on a bookmark's View
 * page: a weight per relatedness dimension and how many related cards to show. Related score =
 * Σ (weight × overlap). Persisted server-side so the choices follow the user across devices.
 */
export interface BookmarkGraphSettings {
  weights: BookmarkGraphWeights;
  /** Maximum number of related bookmarks to show. */
  maxRelated: number;
  /** Whether the graph opens with every layer-1 peer's own related ring already expanded. */
  showSecondLayer: boolean;
}

/** Payload for replacing the bookmark-graph settings. */
export type UpdateBookmarkGraphInput = BookmarkGraphSettings;

/** Default relatedness weights + count, shared by client and server (used when seeding / row absent). */
export const DEFAULT_BOOKMARK_GRAPH_SETTINGS: BookmarkGraphSettings = {
  weights: {
    tags: 3,
    category: 2,
    mediaType: 1,
    genreMoods: 2,
    people: 3,
    groups: 2,
    website: 1,
    youtubeChannel: 1,
  },
  maxRelated: 12,
  showSecondLayer: false,
};

/**
 * The subset of {@link AppSettings} that decides which `labeledWebsites` label (case-insensitive,
 * trimmed) is treated as a Person's canonical "website" / "biography" source link — used by avatar
 * auto-fetch and the social-links detector. Persisted server-side so the match follows across
 * devices. Defaults ("website" / "biography") reproduce the previous hardcoded behavior.
 */
export interface PersonSourceLabelSettings {
  /** `labeledWebsites` label (case-insensitive) treated as the person's primary website/source link. */
  websiteLabel: string;
  /** `labeledWebsites` label (case-insensitive) treated as the person's biography link. */
  biographyLabel: string;
}

/** Payload for replacing the person source-label settings. */
export type UpdatePersonSourceLabelInput = PersonSourceLabelSettings;

/** Default person source labels ("website" / "biography"), used when seeding / when row absent. */
export const DEFAULT_PERSON_SOURCE_LABEL_SETTINGS: PersonSourceLabelSettings = {
  websiteLabel: "website",
  biographyLabel: "biography",
};

/**
 * The subset of {@link AppSettings} that drives display/detail preferences: bookmark detail media
 * sizing + layout, the pinnable listing search box, right-panel pin behavior, and the built-in
 * "Cropped" aspect ratio. Persisted server-side so the display choices follow the user across devices.
 */
export interface DisplayPreferenceSettings {
  bookmarkDetailImageSize: BookmarkDetailImageSize;
  bookmarkDetailVideoSize: BookmarkDetailVideoSize;
  bookmarkDetailLayout: BookmarkDetailLayout;
  /** Width of a bookmark card's thumbnail in the image-left (row) card layout. */
  bookmarkCardThumbnailSize: BookmarkCardThumbnailSize;
  /**
   * Whether the listing-page search/filters/sort box floats — sticking to the top of the viewport
   * while the list scrolls. Toggled from the box's pin button on every listing page.
   */
  searchBoxPinned: boolean;
  panelPinned: boolean;
  drawerUnpinnedBreakpoints: number[];
  croppedWidth: number;
  croppedHeight: number;
  customPropertyTypeIcons: Partial<Record<CustomPropertyType, string>> | null;
  /** Filter facet keys / custom-property ids hidden from the filter rail until added on demand. */
  onDemandFilters: string[];
  /**
   * User-defined order of filter keys (facet keys + custom-property ids) in the filter rail. Keys
   * absent from this list keep their default order and sort after the ordered ones. Empty = the
   * default order (registry order, then custom properties).
   */
  filterOrder: string[];
  /**
   * Filter facet keys / custom-property ids hidden by default on small (mobile) screens. Layered on
   * top of {@link onDemandFilters}: on mobile these behave as on-demand (hidden until added from the
   * "Add filter" control), while a filter with an active value still shows.
   */
  mobileHiddenFilters: string[];
  /**
   * Language to assume for Han-only (no-kana) names, which are ambiguous Japanese vs. Chinese.
   * Drives the multilingual names migration and future script detection. Defaults to `"ja"`.
   */
  hanScriptLanguage: "ja" | "zh";
  /**
   * The language a multilingual entity's secondary display name (breadcrumbs, etc.) is drawn from.
   * `null` = auto (an English-tagged name, else the entity's first other name).
   */
  secondaryLanguageId: string | null;
  /**
   * The language whose entity name is used as the de-emphasized fallback secondary label (and the
   * `preferRomanized` sort fallback) when no preferred/secondary-language name matches. `null` =
   * English — the historical hardcoded behavior, so leaving it unset is byte-identical.
   */
  fallbackLanguageId: string | null;
  /**
   * Minimum area (km²) an `"area"`-mode location's boundary must have to still render as a polygon
   * on the map; smaller boundaries render as a pin instead. `0` disables the threshold (legacy
   * behavior — any boundary renders as an area).
   */
  minAreaPinThresholdKm2: number;
  /** How many bookmarks to show per page on bookmark listing pages (paginated). */
  bookmarksPerPage: number;
  /** Scale factor applied to every rendered map pin's size (1 = default size). */
  mapPinScale: number;
  /**
   * Default values pre-filled into the "Page screenshot" controls on a bookmark's Edit → Image tab
   * (`BookmarkImageEditForm`). Edited on Settings → Media → Screenshot Defaults.
   */
  screenshotDefaultDelayMs: number;
  screenshotDefaultWidth: number;
  screenshotDefaultHeight: number;
  screenshotDefaultScrollDistance: number;
  /**
   * Longest-edge cap (px) applied when resizing a newly processed image (uploads, screenshots,
   * og-image scrapes, and every other entity's image). Applies to new images only — existing
   * stored images are never reprocessed.
   */
  maxImageEdge: number;
  /** WebP re-encode quality (1-100) applied when compressing a newly processed image. */
  imageQuality: number;
  /** The interface language driving i18next + `Intl` formatting. */
  interfaceLanguage: InterfaceLanguage;
  /**
   * Default sort applied to bookmark listings when no explicit `sort` is in the URL. Null =
   * today's `createdAt DESC` fallback. Random shuffle is intentionally excluded (it re-rolls its
   * seed on every use, so it doesn't make sense as a static default).
   */
  defaultBookmarkSort: BookmarkFieldSort | null;
}

/** The interface locales the app can render in. */
export const INTERFACE_LANGUAGES = ["en", "ja"] as const;
export type InterfaceLanguage = typeof INTERFACE_LANGUAGES[number];

/** Minimum allowed value for {@link DisplayPreferenceSettings.mapPinScale}. */
export const MAP_PIN_SCALE_MIN = 0.5;
/** Maximum allowed value for {@link DisplayPreferenceSettings.mapPinScale}. */
export const MAP_PIN_SCALE_MAX = 2;
/** Default value for {@link DisplayPreferenceSettings.mapPinScale} (100% / unscaled). */
export const MAP_PIN_SCALE_DEFAULT = 1;

/** Selectable "bookmarks per page" values offered in Display settings. */
export const BOOKMARKS_PER_PAGE_OPTIONS = [15, 25, 50, 100] as const;

/** Default number of bookmarks shown per listing page. */
export const DEFAULT_BOOKMARKS_PER_PAGE = 25;

/**
 * Which image source a bookmark's cover should display: "auto" prefers the normal `image`,
 * falling back to `screenshot" (today's only behavior); "image"/"screenshot" pin one source,
 * falling back to the other when the pinned one doesn't exist.
 */
export const IMAGE_DISPLAY_PREFERENCES = ["auto", "image", "screenshot"] as const;
export type ImageDisplayPreference = typeof IMAGE_DISPLAY_PREFERENCES[number];

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
  /** When true, the Search from Homepage bar appears on the homepage. */
  searchEnabled: boolean;
  /** Desktop width of the homepage Search block. */
  searchWidth: HomepageContentWidth;
  /** Order the top-of-homepage widgets render in. */
  widgetOrder: HomepageWidget[];
}

/** Payload for replacing the homepage content settings. */
export type UpdateHomepageContentInput = HomepageContentSettings;

/** The AI summarization settings: a stored prompt used to summarize queued bookmarks. */
export interface AiSummarizationSettings {
  aiSummarizationPrompt: string;
  /** When true, the generated prompt also asks the AI to suggest tags for each bookmark. */
  aiSummarizationSuggestTags: boolean;
}

/** Payload for replacing the AI summarization settings. */
export type UpdateAiSummarizationInput = AiSummarizationSettings;

/** The Scratchpad settings: a single free-form Markdown note kept in the sidebar footer. */
export interface ScratchpadSettings {
  scratchpadText: string;
}

/** Payload for replacing the Scratchpad settings. */
export type UpdateScratchpadInput = ScratchpadSettings;

/** A bookmark in the "AI Summary Queue" — the minimal shape needed to build a summarization prompt. */
export interface AiSummaryQueueItem {
  id: string;
  url: string | null;
  title: string;
}

/** One AI-returned summary (and optional suggested tags) keyed by the bookmark's id. */
export interface AiSummaryApplyItem {
  id: string;
  summary: string;
  tags?: string[];
}

/** Payload for applying a batch of AI-returned summaries to their bookmarks. */
export interface AiSummaryApplyInput {
  items: AiSummaryApplyItem[];
}

/** Outcome of applying AI summaries: how many bookmarks were updated, which ids matched nothing, and how many tags were newly created. */
export interface AiSummaryApplyResult {
  /** Bookmarks whose description was written and status set to "Summarized by AI". */
  updated: number;
  /** Ids present in the pasted JSON that matched no bookmark. */
  notFound: string[];
  /** Tags newly created while resolving suggested tag names. */
  tagsCreated: number;
}

/** AI Autotag settings: the reusable prompt template and whether to include the user's existing tags. */
export interface AiAutotagSettings {
  aiAutotagPrompt: string;
  /** When true, the generated prompt lists the user's existing tags so the AI reuses them where relevant. */
  aiAutotagIncludeExistingTags: boolean;
}

/** Payload for replacing the AI autotag settings. */
export type UpdateAiAutotagInput = AiAutotagSettings;

/** An untagged bookmark offered to the AI Autotag prompt — the minimal shape needed to build the prompt. */
export interface AiUntaggedBookmark {
  id: string;
  url: string | null;
  title: string;
}

/** One AI-returned set of suggested tags keyed by the bookmark's id. */
export interface AiAutotagApplyItem {
  id: string;
  tags: string[];
}

/** Payload for applying a batch of AI-returned tags to their bookmarks. */
export interface AiAutotagApplyInput {
  items: AiAutotagApplyItem[];
}

/** Outcome of applying AI autotags: how many bookmarks were tagged, which ids matched nothing, and how many tags were newly created. */
export interface AiAutotagApplyResult {
  /** Bookmarks that had at least one tag unioned onto them. */
  updated: number;
  /** Ids present in the pasted JSON that matched no bookmark. */
  notFound: string[];
  /** Tags newly created while resolving suggested tag names. */
  tagsCreated: number;
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
  /** Multilingual names for this media type, each labelled by language; the `isPrimary` row mirrors `name`. */
  names?: EntityName[];
  /** URL-friendly identifier derived from the name (e.g. `"video"`). Unique. */
  slug: string;
  /** Free-text description surfaced on the media type's detail page. */
  description: string | null;
  /** Optional Lucide icon name shown in the MediaTypePill on bookmark cards. */
  icon: string | null;
  /** Whether this is a seeded built-in (protected from rename/delete). */
  builtIn: boolean;
  /** Hidden from pickers/facets while still resolvable by existing data and identity code. */
  hidden: boolean;
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

/** Lightweight media-type shape carried on a bookmark. `builtIn` lets the card translate seeded names. */
export type BookmarkMediaType = Pick<MediaType, "id" | "name" | "slug" | "icon" | "parentId" | "builtIn">;

/** Payload for creating a custom media type. */
export interface CreateMediaTypeInput {
  name: string;
  sortOrder?: number;
  icon?: string | null;
  /** Parent media type id; omit/null for a root type. */
  parentId?: string | null;
  description?: string | null;
}

/** Payload for updating a media type (rename, reorder, reparent, and/or hide). */
export interface UpdateMediaTypeInput {
  name?: string;
  sortOrder?: number;
  icon?: string | null;
  /** Parent media type id; `null` to make it a root. */
  parentId?: string | null;
  description?: string | null;
  /** Hide/show from pickers/facets. Allowed on built-ins (unlike rename/delete). */
  hidden?: boolean;
}

/**
 * A language in the built-in "Languages" taxonomy — flat, no nesting. Classifies what language a
 * bookmark's content is in; chosen in the form or auto-detected from the scanned page, ISBN
 * provider, or YouTube metadata (see `ScanResult.languageCode` / `FetchIsbnMetadataResult.language`).
 */
export interface Language {
  id: string;
  /** Display name, e.g. `"English"`. Unique. */
  name: string;
  /** ISO 639-1 code (e.g. `"en"`), when known. `null` for a fully custom language. Unique. */
  isoCode: string | null;
  /** URL-friendly identifier derived from the name (e.g. `"english"`). Unique. */
  slug: string;
  /** Free-text description surfaced on the language's detail page. */
  description: string | null;
  /** Whether this is a seeded built-in (protected from rename/delete). */
  builtIn: boolean;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** Whether the user has marked this a favorite — shown towards the top of language pickers. */
  isFavorite: boolean;
  /** ISO-8601 timestamp of when the language was created. */
  createdAt: string;
  /** Distinct bookmarks with this language (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Payload for creating a language. `isoCode` lets autofetch match-or-create by detected code. */
export interface CreateLanguageInput {
  name: string;
  isoCode?: string | null;
  sortOrder?: number;
  description?: string | null;
}

/** Payload for updating a language (rename and/or reorder). */
export interface UpdateLanguageInput {
  name?: string;
  isoCode?: string | null;
  sortOrder?: number;
  isFavorite?: boolean;
  description?: string | null;
}

/**
 * A group in the "Groups" taxonomy (a publisher, studio, label, or similar). Links the
 * group or individual to their optional website, so bookmarks (especially offline/book items)
 * can carry group info.
 */
export interface Group {
  id: string;
  /** Display name, e.g. "O'Reilly Media". Unique. */
  name: string;
  /** Multilingual names for this group, each labelled by language; the `isPrimary` row mirrors `name`. */
  names?: EntityName[];
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Free-text description surfaced on the group's detail page. */
  description: string | null;
  /** Id of the group type classifying this group, or null when unset. */
  groupTypeId: string | null;
  /** The classifying group type, populated by list/get endpoints. */
  groupType?: { id: string;
    name: string;
    slug: string; } | null;
  /** ISO-8601 timestamp of when the group was created. */
  createdAt: string;
  /** Distinct bookmarks with this group (populated by list endpoints). */
  bookmarkCount?: number;
  /** Social media links for this group. */
  socialLinks: SocialLink[];
  /** Labeled websites/links for this group (freeform label + URL, optionally a Websites-taxonomy ref). */
  labeledWebsites: LabeledWebsite[];
  /** Display ordering weight; lower sorts first (absorbed from the former Artists taxonomy). */
  sortOrder: number;
  /** Optional release year surfaced by the Plex search, or null. */
  year: number | null;
  /** Plex rating key (Settings → Connectors) this publisher maps to, or null if not linked. */
  plexRatingKey: string | null;
  /** Denormalized Plex item type (e.g. `artist`) for the deep-link label. */
  plexItemType: string | null;
  /** Display title of the linked Plex item, denormalized at link time. */
  plexItemTitle: string | null;
  /** Poster/avatar image URL, or null when none is set. */
  imageUrl: string | null;
  /** IDs of YouTube channels associated with this group. */
  youtubeChannelIds: string[];
  /** IDs of websites associated with this group. */
  websiteIds: string[];
}

/** Lightweight group shape carried on a bookmark. */
export type BookmarkGroup = Pick<Group, "id" | "name" | "slug">;

/** Payload for creating a group. */
export interface CreateGroupInput {
  name: string;
  /** Id of the group type to classify this group under; null to leave unset. */
  groupTypeId?: string | null;
  description?: string | null;
}

/** Payload for updating a group. */
export interface UpdateGroupInput {
  name?: string;
  /** Id of the group type to classify this group under; null to clear it. */
  groupTypeId?: string | null;
  description?: string | null;
  /** Social media links for this group. Replaces the full list; omit to leave unchanged. */
  socialLinks?: SocialLink[];
  /** Labeled websites/links. Replaces the full list; omit to leave unchanged. */
  labeledWebsites?: LabeledWebsite[];
  sortOrder?: number;
  year?: number | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  /** IDs of YouTube channels to associate; replaces the full set. Omit to leave unchanged. */
  youtubeChannelIds?: string[];
  /** IDs of websites to associate; replaces the full set. Omit to leave unchanged. */
  websiteIds?: string[];
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
  /** Free-text description surfaced on the relationship type's detail page. */
  description: string | null;
  /** Whether the relationship has a direction (parent→child) rather than being symmetric. */
  directional: boolean;
  /** Whether this is a seeded built-in (protected from rename/delete). */
  builtIn: boolean;
  /** Hidden from pickers/facets while still resolvable by existing edges and identity code. */
  hidden: boolean;
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
  description?: string | null;
}

/** Payload for updating a relationship type (rename, toggle direction, reorder, and/or hide). */
export interface UpdateRelationshipTypeInput {
  name?: string;
  directional?: boolean;
  sortOrder?: number;
  description?: string | null;
  /** Hide/show from pickers/facets. Allowed on built-ins (unlike rename/delete). */
  hidden?: boolean;
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
  /** Free-text description surfaced on the channel's detail page. */
  description: string | null;
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
  /** Ids of websites this channel is associated with. Populated by list/get endpoints. */
  websiteIds?: string[];
  /** Ids of groups this channel is associated with. Populated by list/get endpoints. */
  groupIds?: string[];
  /** Labeled websites/links for this channel (freeform label + URL, optionally a Websites-taxonomy ref). */
  labeledWebsites: LabeledWebsite[];
  /** Languages associated with this channel, each qualified by a usage level. Populated by get endpoints. */
  languageUsages?: LanguageUsage[];
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
  description?: string | null;
}

/** Payload for updating a YouTube channel (rename and/or self-identifier list). */
export interface UpdateYouTubeChannelInput {
  name?: string;
  description?: string | null;
  /** Full replacement list of self-identifiers. Omit to leave unchanged. */
  selfIds?: string[];
  /** Category to associate with this channel. `null` clears the association; omit to leave unchanged. */
  categoryId?: string | null;
  /** Full replacement list of default tag ids. Omit to leave unchanged. */
  tagIds?: string[];
  /** Full replacement list of associated website ids. Omit to leave unchanged. */
  websiteIds?: string[];
  /** Full replacement list of associated group ids. Omit to leave unchanged. */
  groupIds?: string[];
  /** Labeled websites/links. Replaces the full list; omit to leave unchanged. */
  labeledWebsites?: LabeledWebsite[];
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
  /** Free-text description surfaced on the newsletter's detail page. */
  description: string | null;
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
export interface Person {
  id: string;
  name: string;
  /** Multilingual names for this person, each labelled by language; the `isPrimary` row mirrors `name`. */
  names?: EntityName[];
  slug: string;
  createdAt: string;
  bookmarkCount?: number;
  /** Free-text description surfaced on the person's detail page. */
  description: string | null;
  imageUrl: string | null;
  /** Social media links for this person. */
  socialLinks: SocialLink[];
  /** Labeled websites/links for this person (freeform label + URL, optionally a Websites-taxonomy ref). */
  labeledWebsites: LabeledWebsite[];
  /** IDs of YouTube channels associated with this person. */
  youtubeChannelIds: string[];
  /** IDs of websites associated with this person. */
  websiteIds: string[];
  /** IDs of groups associated with this person. */
  groupIds: string[];
  /** Languages this person uses, each qualified by a proficiency level. Populated by get endpoints. */
  languageUsages?: LanguageUsage[];
  /** Display ordering weight; lower sorts first (absorbed from the former Artists taxonomy). */
  sortOrder: number;
  /** Optional release year surfaced by the Plex search, or null. */
  year: number | null;
  /** Plex rating key (Settings → Connectors) this person maps to, or null if not linked. */
  plexRatingKey: string | null;
  /** Denormalized Plex item type (e.g. `artist`) for the deep-link label. */
  plexItemType: string | null;
  /** Display title of the linked Plex item, denormalized at link time. */
  plexItemTitle: string | null;
}

/** Lightweight person shape carried on a bookmark. */
export type BookmarkPerson = Pick<Person, "id" | "name" | "slug">;

/** Payload for creating a new person. */
export interface CreatePersonInput {
  name: string;
  description?: string | null;
}

/** Payload for partially updating an person. */
export interface UpdatePersonInput {
  name?: string;
  description?: string | null;
  /** Social media links for this person. Replaces the full list; omit to leave unchanged. */
  socialLinks?: SocialLink[];
  /** Labeled websites/links. Replaces the full list; omit to leave unchanged. */
  labeledWebsites?: LabeledWebsite[];
  /** IDs of YouTube channels to associate; replaces the full set. Omit to leave unchanged. */
  youtubeChannelIds?: string[];
  /** IDs of websites to associate; replaces the full set. Omit to leave unchanged. */
  websiteIds?: string[];
  /** IDs of groups to associate; replaces the full set. Omit to leave unchanged. */
  groupIds?: string[];
  sortOrder?: number;
  year?: number | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
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
  description?: string | null;
}

/** Payload for updating a newsletter (rename and/or default category / tags / media type). */
export interface UpdateNewsletterInput {
  name?: string;
  description?: string | null;
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
  /**
   * Stable id of this image row. A bookmark may hold several images; `id` identifies one for the
   * per-image routes (`/api/bookmarks/<id>/images/<imageId>`). The main image also surfaces on
   * `Bookmark.image` for back-compat.
   */
  id: string;
  /** Serving URL on the API, e.g. `/api/bookmarks/<id>/images/<imageId>?v=<version>`. */
  url: string;
  /** Pixel width of the stored (already-resized) image. */
  width: number;
  /** Pixel height of the stored (already-resized) image. */
  height: number;
  /** How the image was obtained: a manual upload, the page's `og:image`, or a Browserless screenshot. */
  source: "upload" | "og" | "screenshot";
  /** Whether this is the bookmark's main/primary image. Exactly one image per bookmark is main. */
  isMain: boolean;
  /** Display order among a bookmark's images (the main image sorts first regardless). */
  sortOrder: number;
}

/** The Browserless capture settings last used for a bookmark's screenshot. See {@link Bookmark.screenshotSettings}. */
export interface BookmarkScreenshotSettings {
  /** Post-load delay before capture, in milliseconds. */
  delayMs: number | null;
  /** Requested browser viewport width (CSS pixels) before capture. */
  width: number | null;
  /** Requested browser viewport height (CSS pixels) before capture. */
  height: number | null;
  /** Distance scrolled down (CSS pixels) after the delay, before capture. */
  scrollDistance: number | null;
}

/**
 * A self-contained archive of an Instagram reel's video, captured on demand and stored in the app's
 * own object storage so it survives the reel later being deleted from Instagram. At most one per
 * bookmark. `url` points at the API serving endpoint (it embeds a `?v=` version param so a re-archive
 * busts the browser cache), which supports HTTP Range requests for `<video>` seeking.
 */
export interface InstagramReelArchive {
  /** Serving URL on the API, e.g. `/api/bookmarks/<id>/reel-archive?v=<version>`. */
  url: string;
  /** MIME type of the stored video, e.g. `video/mp4`. */
  contentType: string;
  /** Size of the stored video in bytes. */
  byteSize: number;
  /** Pixel width of the video, or `null` when not determined. */
  width: number | null;
  /** Pixel height of the video, or `null` when not determined. */
  height: number | null;
  /** Duration in seconds, or `null` when not determined. */
  durationSeconds: number | null;
  /** The Instagram URL the video was captured from. */
  sourceUrl: string;
  /** ISO-8601 timestamp the archive was captured. */
  createdAt: string;
}

/** Lifecycle of a background reel-archive job (mirrors the import queue's status states). */
export type ReelArchiveJobStatus = "queued" | "processing" | "complete" | "failed";

/**
 * A queued/in-flight reel-archive job as surfaced by `GET /api/reel-archive/active` — the minimal
 * shape the header progress indicator needs. Dropped from the list once it reaches
 * `complete`/`failed`.
 */
export interface ActiveReelArchiveJob {
  id: string;
  /** The bookmark whose reel is being archived. */
  bookmarkId: string;
  /** The bookmark's title, for the progress popover and completion toast. */
  bookmarkTitle: string;
  status: ReelArchiveJobStatus;
}

/** A reel-archive job's full record (`GET /api/reel-archive/:id`), used to resolve a completion toast. */
export interface ReelArchiveJob extends ActiveReelArchiveJob {
  /** Human-readable reason when `status === "failed"`, else `null`. */
  errorReason: string | null;
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
  /**
   * Optional second link (surfaced as "Download URL" in the UI) — e.g. a download / read link vs the
   * primary landing page. A passive scalar: unlike {@link url} it drives no website/channel/duplicate
   * derivation and is not scanned.
   */
  secondaryUrl: string | null;
  /** Human-friendly title, e.g. "GitHub". */
  title: string;
  /** Optional free-form description. */
  description: string | null;
  /** The main image attached to this bookmark, or `null` when none has been set. Mirrors the `isMain` entry of `images`. */
  image: BookmarkImage | null;
  /** All images kept on this bookmark, main first then by `sortOrder`. Empty when none have been set. */
  images: BookmarkImage[];
  /** A Browserless-captured page screenshot, or `null` when none has been taken. Used as image fallback when `image` is null. */
  screenshot: BookmarkImage | null;
  /**
   * The capture settings last used to take {@link screenshot}, remembered so the image-edit form can
   * prefill them the next time this bookmark's screenshot is retaken. `null` when no screenshot has
   * been captured yet; individual fields are `null` when that setting wasn't explicitly requested for
   * the stored capture (e.g. the bulk auto-fetch fallback, which takes a screenshot with no options).
   */
  screenshotSettings: BookmarkScreenshotSettings | null;
  /** Which of `image`/`screenshot` the cover should display; always resolved to a concrete value (`null` in the database hydrates to `"auto"`). */
  imageDisplayPreference: ImageDisplayPreference;
  /** A self-contained capture of the bookmark's Instagram reel video, or `null` when none has been archived. */
  reelArchive: InstagramReelArchive | null;
  /** Specific reason the last image auto-grab attempt failed, or `null` when not yet attempted or the last attempt succeeded. */
  imageAutoGrabError: "no_image" | "bad_image" | "blocked" | "server_error" | "fetch_error" | null;
  /** Id of the category this bookmark belongs to (always set; the built-in "Default" when unassigned). */
  categoryId: string;
  /** The website this bookmark belongs to (auto-linked by URL host), or `null` when the URL has no host. */
  website: BookmarkWebsite | null;
  /** The media type of this bookmark (Video, Article, …), or `null` when unset. */
  mediaType: BookmarkMediaType | null;
  /** Languages associated with this bookmark, each qualified by a usage level (dub/subtitles/…). */
  languageUsages: LanguageUsage[];
  /** Multilingual titles for this bookmark, each labelled by language; the `isPrimary` row mirrors `title`. */
  names: EntityName[];
  /** The YouTube channel this bookmark belongs to (auto-linked for YouTube videos), or `null`. */
  youtubeChannel: BookmarkYouTubeChannel | null;
  /** The newsletter this bookmark was imported from, or `null`. */
  newsletter: BookmarkNewsletter | null;
  /** Id of the linked series on the connected Kavita server, or `null` when not linked. */
  kavitaSeriesId: number | null;
  /** Id of the Kavita library containing the linked series (needed for the web UI deep link). */
  kavitaLibraryId: number | null;
  /** Display name of the linked Kavita series, denormalized at link time. */
  kavitaSeriesName: string | null;
  /** `ratingKey` of the linked item on the connected Plex server, or `null` when not linked. */
  plexRatingKey: string | null;
  /** Plex item type of the linked item (`movie`/`show`/`episode`/`artist`/`album`/`track`/…), or `null`. */
  plexItemType: string | null;
  /** Display title of the linked Plex item, denormalized at link time. */
  plexItemTitle: string | null;
  /** ISBN/ASIN of this item (books), or `null` when unset. */
  isbn: string | null;
  /** Publication/release year of this item, or `null` when unset. */
  year: number | null;
  /** Wikidata QID resolved for this item, or `null` when unset. */
  wikidataId: string | null;
  /** English Wikipedia article link for this item, or `null`. */
  wikipediaLinkEn: string | null;
  /** Local-language Wikipedia article link for this item, or `null`. */
  wikipediaLinkLocal: string | null;
  /** Podcast RSS/XML feed URL (canonical sync source), or `null`. */
  feedUrl: string | null;
  /** Apple Podcasts (iTunes) numeric id, or `null`. */
  itunesId: number | null;
  /** Apple Podcasts (iTunes) page URL, or `null`. */
  itunesUrl: string | null;
  /** Spotify page URL for this item, or `null`. */
  spotifyUrl: string | null;
  /** Pocket Casts podcast UUID, or `null`. */
  pocketCastsUuid: string | null;
  /** Pocket Casts page URL, or `null`. */
  pocketCastsUrl: string | null;
  /** Which listening-service link this item links out to by default, or `null`. */
  defaultLinkProvider: string | null;
  /** The import event this bookmark was created from, or `null`. */
  import: BookmarkImport | null;
  /** Tags assigned to this bookmark, drawn from the taxonomy. */
  tags: BookmarkTag[];
  /** Genres & Moods entries assigned to this bookmark, drawn from the taxonomy. */
  genreMoods: BookmarkGenreMood[];
  /**
   * User-configurable-taxonomy terms assigned to this bookmark (across all taxonomies, each tagged
   * with its `taxonomyId` so the UI can bucket them per taxonomy). The generic successor to
   * `genreMoods`; empty until taxonomies exist.
   */
  taxonomyTerms: BookmarkTaxonomyTerm[];
  /** Locations assigned to this bookmark, drawn from the Locations taxonomy. */
  locations: BookmarkLocation[];
  /** Tag IDs that should never be auto-applied to this bookmark by autofill rules. */
  blacklistedTagIds: string[];
  /** Location IDs that should never be auto-applied to this bookmark by autofill rules. */
  blacklistedLocationIds: string[];
  /** People (individual creators) credited for this bookmarked item. */
  people: BookmarkPerson[];
  /** Groups (group creators, e.g. bands/companies) credited for this bookmarked item. */
  groups: BookmarkGroup[];
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
  /** Plain text custom property values assigned to this bookmark. */
  textValues: BookmarkTextValue[];
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
  /** ISO-8601 timestamp of when the bookmark was last edited, or `null` when never updated. */
  updatedAt: string | null;
}

/** Payload for creating a bookmark. */
export interface CreateBookmarkInput {
  url?: string | null;
  /** Original URL before cleanup; omit when no cleanup was applied. */
  originalUrl?: string | null;
  /** Optional second link ("Download URL"); a passive scalar, unlike {@link url}. */
  secondaryUrl?: string | null;
  title: string;
  description?: string | null;
  /** Id of the category to assign; omit to fall back to the built-in "Default" category. */
  categoryId?: string;
  /** Ids of tags to assign, drawn from the taxonomy. */
  tagIds?: string[];
  /** Ids of Genres & Moods entries to assign, drawn from the taxonomy. */
  genreMoodIds?: string[];
  /**
   * Availability-kind language usages to attach at create time (e.g. an auto-detected "Primary
   * Language" association) — inserted in the same create transaction, mirroring `genreMoodIds`.
   */
  languageUsages?: UpdateLanguageUsageEntry[];
  /** Multilingual names to attach at create time — set right after the create transaction, mirroring `languageUsages`. */
  names?: UpdateEntityNameEntry[];
  /**
   * Site's detected content language (ISO-639-1, from `ScanResult.languageCode`) — the Han-only
   * tiebreaker used to label the primary `entity_names` row on create, ahead of the global
   * `hanScriptLanguage` default. Only consulted when `names` is empty; ignored on update.
   */
  siteLanguageCode?: string | null;
  /** Ids of locations to assign, drawn from the Locations taxonomy. */
  locationIds?: string[];
  /**
   * The Location Relation to attach per assigned location — a map of `locationId → locationRelationId`
   * (or `null` to clear). Only keys present in `locationIds` are applied; a missing key leaves that
   * edge's relation unset. Order-independent; qualifies each `(bookmark, location)` edge.
   */
  locationRelationByLocationId?: Record<string, string | null>;
  /** Tag IDs to exclude from autofill auto-apply on this bookmark. */
  blacklistedTagIds?: string[];
  /** Location IDs to exclude from autofill auto-apply on this bookmark. */
  blacklistedLocationIds?: string[];
  /** Ids of people (individual creators) to credit for this item. */
  personIds?: string[];
  /** Ids of groups (group creators) to credit for this item. Replaces the full set. */
  groupIds?: string[];
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
  /** Plain text custom property values to assign. */
  textValues?: BookmarkTextValue[];
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
  /**
   * Id of an existing YouTube channel to manually associate with this bookmark, or `null` to
   * clear it. Omit to leave unchanged. Takes precedence over an auto-detected `youtubeChannel`
   * hint when both are given.
   */
  youtubeChannelId?: string | null;
  /** Id of the newsletter (publication) this bookmark belongs to, or `null`. */
  newsletterId?: string | null;
  /** Id of the import event this bookmark was created from, or `null`. */
  importId?: string | null;
  /** Id of the Kavita series to link, or `null` to unlink. Omit to leave unchanged. */
  kavitaSeriesId?: number | null;
  /** Id of the Kavita library containing the linked series, or `null` to clear. Omit to leave unchanged. */
  kavitaLibraryId?: number | null;
  /** Display name of the linked Kavita series, or `null` to clear. Omit to leave unchanged. */
  kavitaSeriesName?: string | null;
  /** `ratingKey` of the Plex item to link, or `null` to unlink. Omit to leave unchanged. */
  plexRatingKey?: string | null;
  /** Plex item type of the linked item, or `null` to clear. Omit to leave unchanged. */
  plexItemType?: string | null;
  /** Display title of the linked Plex item, or `null` to clear. Omit to leave unchanged. */
  plexItemTitle?: string | null;
  /** ISBN/ASIN of this item, or `null` to clear. Omit to leave unchanged. */
  isbn?: string | null;
  /** Publication/release year, or `null` to clear. Omit to leave unchanged. */
  year?: number | null;
  /** Wikidata QID, or `null` to clear. Omit to leave unchanged. */
  wikidataId?: string | null;
  /** English Wikipedia article link, or `null` to clear. Omit to leave unchanged. */
  wikipediaLinkEn?: string | null;
  /** Local-language Wikipedia article link, or `null` to clear. Omit to leave unchanged. */
  wikipediaLinkLocal?: string | null;
  /** Podcast RSS/XML feed URL, or `null` to clear. Omit to leave unchanged. */
  feedUrl?: string | null;
  /** Apple Podcasts (iTunes) numeric id, or `null` to clear. Omit to leave unchanged. */
  itunesId?: number | null;
  /** Apple Podcasts (iTunes) page URL, or `null` to clear. Omit to leave unchanged. */
  itunesUrl?: string | null;
  /** Spotify page URL, or `null` to clear. Omit to leave unchanged. */
  spotifyUrl?: string | null;
  /** Pocket Casts podcast UUID, or `null` to clear. Omit to leave unchanged. */
  pocketCastsUuid?: string | null;
  /** Pocket Casts page URL, or `null` to clear. Omit to leave unchanged. */
  pocketCastsUrl?: string | null;
  /** Default listening-service link provider, or `null` to clear. Omit to leave unchanged. */
  defaultLinkProvider?: string | null;
  /** Which of `image`/`screenshot` the cover should display. Omit to leave unchanged. */
  imageDisplayPreference?: ImageDisplayPreference;
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
  /**
   * Whether the relationship type is a seeded built-in, denormalized so the badge can translate the
   * name at render (`builtInName`). Optional/absent = treat as not built-in (verbatim name).
   */
  relationshipTypeBuiltIn?: boolean;
  /** Whether the type is directional (parent→child) rather than symmetric. */
  directional: boolean;
  /** Role of `bookmark` relative to the carrying bookmark. */
  role: RelationshipRole;
  /** Optional, more specific free-text label for this edge (e.g. "sequel", "same person"). */
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
  /** Other bookmarks sharing the same Plex/Kavita/ISBN/podcast-feed identity, if any was checked. */
  identityMatches: BookmarkUrlSummary[];
}

/** Identity fields to check for existing bookmarks sharing the same Plex/Kavita/ISBN/feed item. */
export interface BookmarkIdentityCheckInput {
  isbn?: string;
  plexRatingKey?: string;
  kavitaSeriesId?: number;
  feedUrl?: string;
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

/**
 * Outcome of the "auto-tag from title" backfill, which applies the title-matching automation to
 * every existing bookmark additively (no tags removed).
 */
export interface TitleTagBackfillResult {
  /** Bookmarks scanned. */
  scanned: number;
  /** Bookmarks that received at least one new tag. */
  updated: number;
  /** Total (bookmark, tag) links added. */
  tagsApplied: number;
}

/** Per-item outcome of a bulk entity delete (bookmarks or any taxonomy listing). */
export interface BulkDeleteResult {
  id: string;
  status: "deleted" | "skipped-built-in" | "not-found" | "error";
  /** Human-readable detail when the status isn't `deleted`. */
  message?: string;
}

// --- Imports (ingest) ------------------------------------------------------------------------

/** Which ingest source produced an import. */
export type ImportSource = "paste" | "url" | "upload" | "extension";

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

/** Default values the user sets in the Inbox pre-fill box, applied when approving items. */
export interface InboxPreFillDefaults {
  categoryId?: string | null;
  tagIds?: string[];
  locationIds?: string[];
  mediaTypeId?: string | null;
  personIds?: string[];
  groupIds?: string[];
  numberValues?: { propertyId: string;
    value: number; }[];
  booleanValues?: { propertyId: string;
    value: boolean; }[];
  dateTimeValues?: { propertyId: string;
    value: string; }[];
  choicesValues?: { propertyId: string;
    values: string[]; }[];
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
   * Image zones only. When true, the corner-overlay badge is rendered as an internal link to the
   * displayed entity's view page (category, website, media type, YouTube channel). Has no effect for
   * fields with no entity page (title, description, tags) or for custom-property value items.
   * Defaults to false.
   */
  clickableInOverlay?: boolean;
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
  /**
   * Tags field in the `card-table` zone only. When true, the comma-separated tag names render as
   * clickable links to each tag's page (matching the Labels-zone tags box); otherwise they render as
   * plain text. Defaults to false.
   */
  clickableTags?: boolean;
  /**
   * Tags field, any zone. When true, hovering a tag pill/link shows a popover with that tag's
   * ancestor chain (e.g. "Root → Parent → TagName"). Has no effect on a top-level tag (no ancestors)
   * or on the `card-table` zone's non-clickable plain-text fallback (no per-tag element to hover).
   * Defaults to false.
   */
  showTagHierarchyOnHover?: boolean;
  /**
   * Media Type field, any zone. When true, hovering the media-type pill shows a popover with its
   * ancestor chain (e.g. "Root → Parent → MediaTypeName"). Has no effect on a top-level media type
   * (no ancestors). Defaults to false.
   */
  showMediaTypeHierarchyOnHover?: boolean;
  /**
   * Locations field, any zone. When true, hovering a location pill/link shows a popover with its
   * ancestor chain (e.g. "Root → Parent → LocationName"). Has no effect on a top-level location (no
   * ancestors). Defaults to false.
   */
  showLocationHierarchyOnHover?: boolean;
  /**
   * Genres & Moods field, any zone. When true, hovering a genre/mood badge shows a popover with its
   * ancestor chain (e.g. "Root → Parent → GenreMoodName"). Has no effect on a top-level entry (no
   * ancestors). Defaults to false.
   */
  showGenreMoodHierarchyOnHover?: boolean;
  /**
   * Multi-value taxonomy fields only (Tags, People, Groups, Genres & Moods, Locations). Cap on the
   * number of term names shown; when the bookmark has more terms than this, the field either renders
   * the first `maxTerms` names plus a "+N more" indicator, or — when `collapseToCount` is set —
   * collapses to the field icon + total count. `null`/omitted means no cap (show every name).
   */
  maxTerms?: number | null;
  /**
   * Multi-value taxonomy fields only (Tags, People, Groups, Genres & Moods, Locations). When true and
   * the field is over its `maxTerms` limit (or has no `maxTerms` — i.e. always), the names collapse to
   * the field's icon + the total count (e.g. "🏷 5") instead of showing a "+N more" indicator.
   * Defaults to false.
   */
  collapseToCount?: boolean;
  /**
   * Progress (`itemInItems`) custom-property fields only. When false, the "X of Y" numbers are dropped
   * from the field's text (in image overlays the radial ring still shows). **Absent/omitted means
   * true** (the default). Combines with {@link showProgressUnit} to show either, both, or none of the
   * numbers and the unit words.
   */
  showProgressCount?: boolean;
  /**
   * Progress (`itemInItems`) custom-property fields only. When false, the unit / counter-word text (the
   * before/after segments, e.g. "chapter"/"pages") is dropped, leaving just the "X of Y" numbers.
   * **Absent/omitted means true** (the default).
   */
  showProgressUnit?: boolean;
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

/* -------------------------------------------------------------------------------------------------
 * Card Display config — the dynamic-section model (card display only; homepage keeps CardFieldZones)
 * ---------------------------------------------------------------------------------------------- */

/**
 * How a {@link CardDisplaySection} renders the fields placed in it. Reproduces the three legacy
 * card-body forms that used to be derived from the fixed zone *name*:
 * - `stacked` — full-width rows (the old `card-single-*` zones); the header fields (`title` +
 *   `externalLink`/`more`) still lay out as a justified header row when co-located.
 * - `inline` — pill/badge flow (the old `card-labels` zone); wraps as a flex row or a two-column
 *   grid per {@link CardZoneLayout.mode}.
 * - `table` — a fixed two-column `label : value` grid (the old `card-table` zone).
 */
export type CardSectionForm = "stacked" | "inline" | "table";

/**
 * One card-body section in the {@link CardDisplayConfig} dynamic-section model. Sections are an
 * ordered array (add/rename/reorder/remove) — the card-display replacement for the four fixed
 * {@link CardBodyZone}s. Each section owns its render {@link CardSectionForm}, its
 * {@link CardZoneLayout} (the per-section "layout" dropdown), an optional per-bookmark visibility
 * {@link ConditionTree} (absent/empty = always visible), and its ordered field placements.
 */
export interface CardDisplaySection {
  /** Stable machine slug — render/merge identity (never shown; `title` is the editor label). */
  key: string;
  /** User-editable section name shown only in the editor. */
  title?: string;
  /** Per-bookmark visibility gate; absent or an empty group = always visible. */
  visibleIf?: ConditionTree;
  form: CardSectionForm;
  layout: CardZoneLayout;
  fields: CardFieldPlacement[];
}

/** The four image-corner overlay placements a {@link CardDisplayConfig} declares (kept separate from body sections). */
export type CardImageCorners = Record<CardImageCorner, CardFieldPlacement[]>;

/** An empty {@link CardImageCorners} with every corner present and empty. */
export function emptyCardImageCorners(): CardImageCorners {
  return {
    "top-left": [],
    "top-right": [],
    "bottom-left": [],
    "bottom-right": [],
  };
}

/**
 * The single card-display configuration governing every listing card. Replaces the multi-rule
 * {@link CardDisplayRule} model: dynamic card-body {@link CardDisplaySection}s (each with its own
 * form/layout/visibility) plus the four fixed image-corner overlays and the image presentation
 * attributes. Resolved entirely client-side at render time.
 */
export interface CardDisplayConfig {
  sections: CardDisplaySection[];
  imageCorners: CardImageCorners;
  imageMode: BookmarkImageMode;
  imageVisibility: BookmarkImageVisibility;
  imageLayout: HomepageSectionImageLayout;
  hideWebsiteForYouTube: boolean;
}

/** The {@link CardSectionForm} for a legacy {@link CardBodyZone} (used by the fromFieldZones transform). */
function bodyZoneForm(zone: CardBodyZone): CardSectionForm {
  switch (zone) {
    case "card-labels": return "inline";
    case "card-table": return "table";
    default: return "stacked";
  }
}

/** A human title for a legacy {@link CardBodyZone}, seeded onto the derived default sections. */
function bodyZoneTitle(zone: CardBodyZone): string {
  switch (zone) {
    case "card-single-top": return "Header";
    case "card-labels": return "Labels";
    case "card-table": return "Details table";
    default: return "Footer";
  }
}

/**
 * Convert a legacy {@link CardFieldZones} (+ {@link CardZoneLayouts}) into the dynamic-section
 * {@link CardDisplayConfig} model: one section per {@link CardBodyZone} (in render order, keyed by
 * the zone name so identities stay stable) carrying that zone's placements/form/layout, and the
 * four `image-*` zones lifted into {@link CardImageCorners}. Shared by the client default builder,
 * the middleware seed, and the boot backfill so all three produce identical shapes.
 */
export function cardDisplayConfigFromFieldZones(
  fieldZones: CardFieldZones,
  cardZoneLayouts: CardZoneLayouts | null | undefined,
  image: {
    imageMode: BookmarkImageMode;
    imageVisibility: BookmarkImageVisibility;
    imageLayout: HomepageSectionImageLayout;
    hideWebsiteForYouTube: boolean;
  },
): CardDisplayConfig {
  const sections: CardDisplaySection[] = CARD_BODY_ZONES.map(zone => ({
    key: zone,
    title: bodyZoneTitle(zone),
    form: bodyZoneForm(zone),
    layout: normalizeCardZoneLayout(cardZoneLayouts?.[zone], zone === "card-table" ? "grid" : "flex"),
    fields: fieldZones[zone].map(placement => ({
      ...placement,
    })),
  }));
  return {
    sections,
    imageCorners: {
      "top-left": fieldZones["image-top-left"].map(p => ({
        ...p,
      })),
      "top-right": fieldZones["image-top-right"].map(p => ({
        ...p,
      })),
      "bottom-left": fieldZones["image-bottom-left"].map(p => ({
        ...p,
      })),
      "bottom-right": fieldZones["image-bottom-right"].map(p => ({
        ...p,
      })),
    },
    ...image,
  };
}

/** The {@link CardBodyZone} a {@link CardSectionForm} maps back to (for the inverse transform). */
function sectionFormToBodyZone(form: CardSectionForm): CardBodyZone {
  switch (form) {
    case "inline": return "card-labels";
    case "table": return "card-table";
    default: return "card-single-top";
  }
}

/**
 * Flatten a {@link CardDisplayConfig} back into a legacy {@link CardFieldZones} — each section's fields
 * land in the {@link CardBodyZone} its form maps to, and the four image corners fill the `image-*`
 * zones. Used by non-listing surfaces (which still consume the fixed-zone model) to source the
 * per-field knobs / corner placements from the single config. The exact body zone is not
 * round-trip-exact for renamed/added sections, but the per-field placements/knobs are preserved.
 */
export function fieldZonesFromConfig(config: CardDisplayConfig): CardFieldZones {
  const zones = emptyCardFieldZones();
  for (const section of config.sections) {
    const zone = sectionFormToBodyZone(section.form);
    for (const placement of section.fields) zones[zone].push({
      ...placement,
    });
  }
  zones["image-top-left"] = config.imageCorners["top-left"].map(p => ({
    ...p,
  }));
  zones["image-top-right"] = config.imageCorners["top-right"].map(p => ({
    ...p,
  }));
  zones["image-bottom-left"] = config.imageCorners["bottom-left"].map(p => ({
    ...p,
  }));
  zones["image-bottom-right"] = config.imageCorners["bottom-right"].map(p => ({
    ...p,
  }));
  return zones;
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
  /** When true, a `datetime` property also accepts/displays/enters month-only `"YYYY-MM"` values (alongside full `"YYYY-MM-DD"`). */
  dateTimeAllowYearMonth: boolean;
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
  /** When true, the property appears in the CMD+K command palette for inline editing. */
  editableViaCmdk: boolean;
  /** When true, the field shows in the main bookmark form; otherwise it lives under Advanced. Only applies when not `hiddenFromForm`. */
  showInForm: boolean;
  /** When true, the property's field is hidden from the bookmark form entirely (neither main nor Advanced). */
  hiddenFromForm: boolean;
  /** When true, the property's value is shown on bookmark cards in listings. */
  showInListings: boolean;
  /** When true, the property appears in the Inbox pre-fill defaults box so a batch value can be set before approving items. */
  enabledInInbox: boolean;
  /** When true, an `image` property's uploaded objects are counted in the Gallery/quota manifest. Only relevant for `image`/`file`. */
  showInGallery: boolean;
  /** When true, the property's value is shown on the bookmark detail page. Only relevant for `image`/`file`. */
  showInDetails: boolean;
  /** When false, the property is globally inactive: hidden from filters, conditions, category assignment, and the bookmark form. */
  enabled: boolean;
  /** When false, this property does not appear in the category defaults editor. */
  allowDefault: boolean;
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
  /**
   * Per-media-type overrides of the before/between/after text for an `itemInItems` property, keyed
   * by media-type id (see {@link ItemInItemsMediaTypeTexts}); `null` = no overrides.
   */
  itemInItemsMediaTypeTexts: ItemInItemsMediaTypeTexts | null;
  /**
   * For an `itemInItems` property: the id of a `sections` property whose completion drives this
   * value. When set, a bookmark's `current`/`total` are recomputed server-side from the source
   * sections (leaf counting — see `countSectionLeaves`) whenever that bookmark's sections are
   * non-empty, overriding manual entry. `null` = manual.
   */
  itemInItemsSourcePropertyId: string | null;
  /** Default section entry type for a `sections` property; `null` means no preference (any type). */
  sectionsDefaultType: SectionEntryType | null;
  /** Allowed section entry types for a `sections` property; `null` means all types are allowed. */
  sectionsAllowedTypes: SectionEntryType[] | null;
  /**
   * When true, a `sections` property opts into a second tier — a tier-1 entry may carry child
   * entries (see {@link SectionEntry.children}). `null`/false = single-tier (the default). Only
   * relevant for `sections`.
   */
  sectionsTiered: boolean | null;
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
  /** When true, a `datetime` property also accepts month-only `"YYYY-MM"` values. Defaults to `false`. */
  dateTimeAllowYearMonth?: boolean;
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
  /** When true, the property appears in the CMD+K command palette for inline editing. Defaults to false. */
  editableViaCmdk?: boolean;
  /** When true, the field shows in the main bookmark form; otherwise it lives under Advanced. Only applies when not `hiddenFromForm`. */
  showInForm?: boolean;
  /** When true, the property's field is hidden from the bookmark form entirely. Defaults to false. */
  hiddenFromForm?: boolean;
  /** When true, the property's value is shown on bookmark cards in listings. Defaults to true. */
  showInListings?: boolean;
  /** When true, the property appears in the Inbox pre-fill defaults box. Defaults to false. */
  enabledInInbox?: boolean;
  /** When true, an `image` property's uploaded objects count toward the Gallery/quota. Defaults to true. Only relevant for `image`/`file`. */
  showInGallery?: boolean;
  /** When true, the property's value is shown on the bookmark detail page. Defaults to true. Only relevant for `image`/`file`. */
  showInDetails?: boolean;
  /** When false, the property is globally inactive. Defaults to true. */
  enabled?: boolean;
  /** When false, this property is excluded from the category defaults editor. Defaults to true. */
  allowDefault?: boolean;
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
  /** Per-media-type overrides of an `itemInItems` property's text segments, keyed by media-type id. */
  itemInItemsMediaTypeTexts?: ItemInItemsMediaTypeTexts | null;
  /** Id of a `sections` property whose completion drives this `itemInItems` value; `null` = manual. */
  itemInItemsSourcePropertyId?: string | null;
  /** Default section entry type for a `sections` property. */
  sectionsDefaultType?: SectionEntryType | null;
  /** Allowed section entry types for a `sections` property; `null` means all types. */
  sectionsAllowedTypes?: SectionEntryType[] | null;
  /** When true, a `sections` property opts into a second tier (child entries). Defaults to false. */
  sectionsTiered?: boolean | null;
}

/** Payload for updating a custom property. Its `type` is immutable. */
export type UpdateCustomPropertyInput = Partial<Omit<CreateCustomPropertyInput, "type">>;

/**
 * Whether a property is assigned to a given category. A property with `allCategories` set, or with
 * no explicit category assignments, applies to every category; otherwise it applies only to its
 * `categoryIds`.
 */
export function propertyAppliesToCategory(
  property: Pick<CustomProperty, "allCategories" | "categoryIds">,
  categoryId: string,
): boolean {
  return property.allCategories || property.categoryIds.length === 0 || property.categoryIds.includes(categoryId);
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
  /**
   * Optional per-bookmark override of the counter-word text segments (before/between/after the
   * numbers). Each null/absent field inherits the property's per-media-type override
   * ({@link ItemInItemsMediaTypeTexts}), then the property base text — so one bookmark can read
   * "chapter 3 of 12" while its siblings inherit "3 of 12 pages". Display-only (not matched/sorted).
   * `null` = inherit everything.
   */
  textOverride?: ItemInItemsMediaTypeTexts[string] | null;
  /**
   * Per-bookmark toggle for auto-spacing the counter-word segments when rendered: `null`/absent/`true`
   * (the default) joins the non-empty segments with single spaces (e.g. `page`/`of`/`pages` →
   * "page 5 of 200 pages"); `false` concatenates the raw segments verbatim (e.g. a tight `between:"/"`
   * → "5/200"). Display-only.
   */
  autoSpace?: boolean | null;
}

/**
 * A category groups custom properties and owns each bookmark assigned to it.
 * Properties may belong to zero, one, or many categories; each category carries an
 * optional Lucide icon shown in the sidebar.
 */
export interface Category {
  id: string;
  name: string;
  /** Multilingual names for this category, each labelled by language; the `isPrimary` row mirrors `name`. */
  names?: EntityName[];
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
  /** Location ids to apply, drawn from the Locations taxonomy. */
  locationIds: string[];
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
  locationIds?: string[];
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

/** Bookmark card thumbnail size preference (image-left/row card layout). */
export type BookmarkCardThumbnailSize = "small" | "medium" | "large";

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

/** Built-in bookmark fields that a Sort control can order by, alongside sortable custom properties. */
export const BUILTIN_SORT_FIELDS = ["title", "createdAt", "updatedAt"] as const;
export type BuiltinSortField = typeof BUILTIN_SORT_FIELDS[number];
export type SortDirection = "asc" | "desc";

/** One sort dimension: a built-in field name or a custom property id, plus its direction. */
export interface BookmarkSortDimension {
  field: BuiltinSortField | string;
  direction: SortDirection;
}

/** A primary (required) and optional secondary tie-breaking sort dimension. */
export interface BookmarkFieldSort {
  primary: BookmarkSortDimension;
  secondary?: BookmarkSortDimension;
}

/** Shuffles bookmarks in a stable pseudo-random order derived from `seed`. */
export interface BookmarkRandomSort {
  random: true;
  /** Re-rolled each time the user picks "Random" or clicks "Shuffle again". */
  seed: number;
}

/** The bookmark ordering used by the Listings page Sort control and a homepage section's Sorting field. */
export type BookmarkSort = BookmarkFieldSort | BookmarkRandomSort;

/** A named, ordered section on the homepage with its own condition filter. */
export interface HomepageSection {
  id: string;
  title: string;
  description: string | null;
  conditions: ConditionTree;
  sortOrder: number;
  hideIfEmpty: boolean;
  /**
   * Bookmark ordering for this section, or `null` for the default order (matches the Listings
   * page's Sort control). Applied client-side after the section's bookmarks are fetched.
   */
  sort: BookmarkSort | null;
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
  /** Maximum number of bookmarks to show in this section, applied after sorting, or `null` for no limit. */
  bookmarkLimit: number | null;
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
  sort?: BookmarkSort | null;
  bookmarkLimit?: number | null;
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
  /** URL-friendly slug for the rule's detail/edit pages. Null only until the boot backfill assigns it. */
  slug: string | null;
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
 * A single candidate image discovered while scanning a page, before any bytes are fetched. The scan
 * returns several of these so the Add Bookmark form can let the user pick which to keep. `url` is an
 * absolute, public (SSRF-checked), non-blacklisted http(s) URL.
 */
export interface ImageCandidate {
  /** Absolute http(s) URL of the candidate image. */
  url: string;
  /** Pixel width when the source advertised it (oEmbed/JSON-LD/`<img>` attrs), else `null`. */
  width?: number | null;
  /** Pixel height when the source advertised it, else `null`. */
  height?: number | null;
  /** Where the candidate came from — used only to order/label candidates, not stored on the image. */
  source: "og" | "twitter" | "article" | "instagram" | "icon";
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
  /** ISO-8601 publish date ("YYYY-MM-DD"), from the YouTube watch page or an oEmbed provider, or `null`. */
  datePosted: string | null;
  /** A preview/thumbnail image URL (YouTube or an oEmbed provider), or `null`. The first of `imageCandidates` when present. */
  thumbnailUrl: string | null;
  /** All candidate images discovered on the page (carousel/article images), public + non-blacklisted. May be empty. */
  imageCandidates: ImageCandidate[];
  /** Person name(s) parsed from page metadata (non-YouTube only), or `null` when none were found. */
  authorNames: string[] | null;
  /**
   * Detected content language, normalized to an ISO 639-1 code where known, or `null`. Read from
   * `og:locale`/`<html lang>` (generic pages) or the YouTube Data API's
   * `defaultAudioLanguage`/`defaultLanguage` (YouTube).
   */
  languageCode: string | null;
  /**
   * Human-readable reasons a YouTube field could not be resolved (e.g. the watch-page fetch failed
   * or a value was absent/unparseable). Present and non-empty only when something went wrong;
   * surfaced so a partial result still explains itself instead of returning a silent `null`.
   */
  diagnostics?: string[];
}

/**
 * Result of a consolidated single-fetch URL scan (`GET /api/scan`). One round-trip that fetches the
 * page once and returns everything the Add Bookmark form needs: redirect resolution, website lookup,
 * duplicate check, page/oEmbed metadata, and an instant favicon URL. Replaces ~5 separate calls
 * (`/api/resolve-url`, `/api/websites/lookup`, `/api/bookmarks/url-check`, `/api/fetch-title`,
 * `/api/fetch-metadata`); those granular endpoints remain for the per-field manual buttons.
 */
export interface ScanResult {
  /** The resolved destination URL (after following redirects), or the original. */
  finalUrl: string;
  /** Whether at least one redirect hop was followed to reach `finalUrl`. */
  redirected: boolean;
  /** A user-facing message when the redirect chain couldn't be followed (best-effort), else absent. */
  resolveError?: string;
  /** Website-taxonomy lookup for `finalUrl`'s domain (replaces `/api/websites/lookup`). */
  website: WebsiteLookup;
  /** Existing-bookmark duplicate check for `finalUrl` (replaces `/api/bookmarks/url-check`). */
  duplicate: BookmarkUrlDuplicateResult;
  /** Cleaned page/video title, or `null`. */
  title: string | null;
  /** Page/video description, or `null`. */
  description: string | null;
  /** Whether `finalUrl` was recognized as a YouTube video. */
  isYouTube: boolean;
  /** The video's channel (YouTube only), or `null`. */
  channel: FetchMetadataResult["channel"];
  /** The video's length in whole seconds (YouTube only), or `null`. */
  durationSeconds: number | null;
  /** ISO-8601 publish date ("YYYY-MM-DD") from YouTube or an oEmbed provider, or `null`. */
  datePosted: string | null;
  /** A preview/thumbnail image URL (YouTube or an oEmbed provider), or `null`. The first of `imageCandidates` when present. */
  thumbnailUrl: string | null;
  /** All candidate images discovered on the page (carousel/article images), public + non-blacklisted. May be empty. */
  imageCandidates: ImageCandidate[];
  /** Person name(s) parsed from page metadata / oEmbed (non-YouTube), or `null`. */
  authorNames: string[] | null;
  /**
   * Detected content language, normalized to an ISO 639-1 code where known (e.g. `"en"`), or `null`
   * when undetectable. Read from `og:locale`/`<html lang>` (generic pages) or the YouTube Data API's
   * `defaultAudioLanguage`/`defaultLanguage` (YouTube). A raw code, not yet matched to a `Language`
   * row — the client resolves it via match-or-create, mirroring `authorNames`.
   */
  languageCode: string | null;
  /** The social-media account `finalUrl` points at (Instagram/X/…), or `null`. Pure of `finalUrl`. */
  socialAccount: SocialAccountRef | null;
  /**
   * Coarse content kind derived from the scan's own signals (YouTube video / book / social account),
   * for the create form's "Detected content type" badge and the media-type pre-select. `null` when
   * nothing more specific than a generic web link is detected.
   */
  detectedContentKind: BookmarkContentKind | null;
  /**
   * A checksum-valid ISBN-13 extracted from an Amazon product URL's ASIN, or `null`. Pure of
   * `finalUrl` (no HTTP call) — the client resolves book metadata via the existing ISBN pipeline.
   */
  isbn: string | null;
  /** An instant favicon URL for display (scraped icon or a CDN fallback), or `null`. */
  faviconUrl: string | null;
  /** Human-readable reasons a field could not be resolved (YouTube scrape warnings), when present. */
  diagnostics?: string[];
}

/**
 * Live status of the optional/gated metadata connectors (`GET /api/connectors`). Carries no secrets —
 * only whether each connector is configured (and the hosted provider's name) — so it's safe to serve
 * to the client. The keyless connectors (oEmbed providers, Open Library, Google Books, DuckDuckGo
 * icons) are always on and described client-side; only the env-gated ones report status here.
 */
export interface ConnectorsStatus {
  /**
   * Hosted metadata provider (Microlink/iframely/opengraph, or a self-hosted Browserless) — active
   * only when its env vars are set. The base URL is not a secret and is returned so the client can
   * build a link-out to the provider's instance (e.g. the Browserless debugger UI).
   */
  hostedMetadata: { enabled: boolean;
    provider: string | null;
    baseUrl: string | null; };
  /** YouTube Data API v3 — active only when `YOUTUBE_API_KEY` is set (else the watch-page scrape runs). */
  youtubeDataApi: { enabled: boolean };
  /**
   * YouTube embed host preference (Settings → Connectors). `useNoCookie: true` (the default) embeds
   * via the privacy-enhanced `youtube-nocookie.com` host; `false` uses plain `youtube.com`. Not a
   * secret — needed by the unauthenticated bookmark detail view to build embed URLs.
   */
  youtubeEmbed: { useNoCookie: boolean };
  /**
   * Instagram — post/carousel images and person avatars always come from the keyless public embed.
   * `apiKey` reports whether `INSTAGRAM_API_KEY` is set (the API path is preferred when configured,
   * with the keyless scrape as fallback).
   */
  instagram: { apiKey: boolean };
  /**
   * On-demand Instagram reel video archiving. `enabled` only when BOTH a Browserless instance is
   * configured (to extract the video URL) AND object storage is configured (to store the MP4) — it
   * captures the reel's video into the app's own storage so it survives deletion from Instagram.
   */
  instagramReelArchive: { enabled: boolean };
  /** Object storage (S3/Garage) — whether bookmark images / favicons can be stored. */
  objectStorage: { configured: boolean };
  /**
   * ArchiveBox web archive — active only when a base URL is configured (`ARCHIVEBOX_ENDPOINT` env var
   * or the saved setting). The base URL is not a secret and is returned so the client can build
   * link-outs to the archived copy of a bookmark.
   */
  archiveBox: { enabled: boolean;
    baseUrl: string | null; };
  /**
   * Kavita ebook/manga server — active only when BOTH a base URL and an API key are configured
   * (`KAVITA_ENDPOINT` / `KAVITA_API_KEY` env vars or the saved settings). The base URL is not a
   * secret and is returned so the client can build series deep links
   * (`<base>/library/{libraryId}/series/{seriesId}`); the API key never leaves the middleware.
   *
   * `sidebarUrl` is an optional, browser-facing override for the sidebar's "Kavita" link-out: the
   * `baseUrl` must be reachable from the middleware container (e.g. a LAN/tailnet IP), which isn't
   * always the address a person opens in their browser (e.g. a MagicDNS hostname). `null` when
   * unset — the sidebar link falls back to `baseUrl`. Does not affect the server-side connector.
   */
  kavita: { enabled: boolean;
    baseUrl: string | null;
    sidebarUrl: string | null; };
  /**
   * Plex media server — active only when BOTH a base URL and an `X-Plex-Token` are configured
   * (`PLEX_ENDPOINT` / `PLEX_TOKEN` env vars or the saved settings). The base URL is not a secret
   * and is returned so the client can build item deep links; `machineIdentifier` (fetched from the
   * server's `/identity`, non-secret) is needed alongside it to build the web-UI deep link. The
   * token never leaves the middleware.
   */
  plex: { enabled: boolean;
    baseUrl: string | null;
    machineIdentifier: string | null; };
  /**
   * Geocoding for the Locations taxonomy — always keyless (OpenStreetMap Nominatim). `endpoint`
   * reports the base URL in use (the public Nominatim by default, or a self-hosted instance set via
   * `NOMINATIM_ENDPOINT`); it is not a secret.
   */
  geocoding: { enabled: boolean;
    endpoint: string; };
  /**
   * Wikidata fallback for the Locations geocoder — always keyless. Used when Nominatim has no entry
   * for a place (typically a traditional / informal / natural region with no admin boundary, e.g.
   * 中国地方). `endpoint` reports the base URL in use (public Wikidata by default, or a self-hosted
   * Wikibase set via `WIKIDATA_ENDPOINT`); it is not a secret.
   */
  wikidata: { enabled: boolean;
    endpoint: string; };
}

/** Hosted-metadata connector settings from `GET /api/app-settings/connectors`. Never exposes the raw key. */
export interface ConnectorsAppSettings {
  hostedMetadataEndpoint: string;
  hostedMetadataProvider: string;
  /** Whether an API key is stored (encrypted or plain); the raw value is never returned. */
  hostedMetadataApiKeySet: boolean;
  /** Whether `APP_SECRET` is configured so keys are encrypted at rest. */
  encryptionEnabled: boolean;
  /** Base URL of the ArchiveBox instance (e.g. `http://localhost:8000`), or `""` when unset. */
  archiveBoxEndpoint: string;
  /** Base URL of the Kavita instance (e.g. `http://localhost:5000`), or `""` when unset. */
  kavitaEndpoint: string;
  /**
   * Optional browser-facing URL for the sidebar's Kavita link-out, when the person's browser reaches
   * Kavita at a different address than the middleware container does (e.g. a MagicDNS hostname vs a
   * LAN/tailnet IP). `""` when unset — the sidebar link then falls back to `kavitaEndpoint`.
   */
  kavitaSidebarUrl: string;
  /** Whether a Kavita API key is stored (encrypted or plain); the raw value is never returned. */
  kavitaApiKeySet: boolean;
  /** Base URL of the Plex instance (e.g. `http://localhost:32400`), or `""` when unset. */
  plexEndpoint: string;
  /** Whether a Plex token is stored (encrypted or plain); the raw value is never returned. */
  plexTokenSet: boolean;
  /** Whether a YouTube Data API v3 key is stored (encrypted or plain); the raw value is never returned. */
  youtubeApiKeySet: boolean;
  /**
   * Patterns that exclude matching candidate images from a URL scan. Each entry is a case-insensitive
   * substring, or a simple `*` glob (e.g. `*.doubleclick.net/*`). Applied to every candidate image
   * (Instagram, oEmbed, article scrape) before it reaches the Add Bookmark picker.
   */
  imageUrlBlacklist: string[];
  /**
   * Whether YouTube embeds use the privacy-enhanced `youtube-nocookie.com` host (`true`, the
   * default) or plain `youtube.com` (`false`).
   */
  useNoCookieYoutubeEmbeds: boolean;
}

/** Body for `PUT /api/app-settings/connectors`. */
export interface UpdateConnectorsSettingsInput {
  hostedMetadataEndpoint: string;
  hostedMetadataProvider: string;
  /**
   * Raw API key to store (encrypted when `APP_SECRET` is set).
   * `null` = leave the stored key unchanged.
   * `""` = clear the stored key.
   * Any other string = encrypt and store as the new key.
   */
  hostedMetadataApiKey: string | null;
  /** Base URL of the ArchiveBox instance; `""` clears it. No key analog — ArchiveBox link-outs are tokenless. */
  archiveBoxEndpoint: string;
  /** Base URL of the Kavita instance; `""` clears it. */
  kavitaEndpoint: string;
  /** Browser-facing URL for the sidebar's Kavita link-out; `""` clears it (link falls back to `kavitaEndpoint`). */
  kavitaSidebarUrl: string;
  /**
   * Raw Kavita API key to store (encrypted when `APP_SECRET` is set).
   * `null` = leave the stored key unchanged.
   * `""` = clear the stored key.
   * Any other string = encrypt and store as the new key.
   */
  kavitaApiKey: string | null;
  /** Base URL of the Plex instance; `""` clears it. */
  plexEndpoint: string;
  /**
   * Raw Plex `X-Plex-Token` to store (encrypted when `APP_SECRET` is set).
   * `null` = leave the stored token unchanged.
   * `""` = clear the stored token.
   * Any other string = encrypt and store as the new token.
   */
  plexToken: string | null;
  /**
   * Raw YouTube Data API v3 key to store (encrypted when `APP_SECRET` is set).
   * `null` = leave the stored key unchanged.
   * `""` = clear the stored key.
   * Any other string = encrypt and store as the new key.
   */
  youtubeApiKey: string | null;
  /** Image-URL blacklist patterns; replaces the stored list wholesale. */
  imageUrlBlacklist: string[];
  /** Whether YouTube embeds use the privacy-enhanced `youtube-nocookie.com` host. */
  useNoCookieYoutubeEmbeds: boolean;
}

/** One Kavita series matched by a search (`GET /api/kavita/series?q=`). */
export interface KavitaSeriesResult {
  /** Kavita's numeric series id. */
  seriesId: number;
  /** Id of the Kavita library the series belongs to (needed for the web UI deep link). */
  libraryId: number;
  /** Series display name. */
  name: string;
  /** Name of the containing Kavita library, or `null` when not reported. */
  libraryName: string | null;
  /** Release year of the series, or `null` when unknown/unreported. */
  releaseYear: number | null;
}

/** A linked series' current live values on Kavita (`GET /api/kavita/series/:seriesId`), used to flag drift against the local Book. */
export interface KavitaSeriesDetail {
  /** Kavita's numeric series id. */
  seriesId: number;
  /** Current series display name on Kavita. */
  name: string;
  /** Current release year on Kavita, or `null` when unknown/unreported. */
  releaseYear: number | null;
}

/** One Plex library item matched by a search (`GET /api/plex/search?q=`). */
export interface PlexItemResult {
  /** Plex's `ratingKey` — the stable id used to build metadata/deep-link URLs. */
  ratingKey: string;
  /** Item type: `movie` / `show` / `season` / `episode` / `artist` / `album` / `track`. */
  type: string;
  /** Item display title. */
  title: string;
  /** Release year, or `null` when unknown/unreported. */
  year: number | null;
  /** Name of the containing Plex library section, or `null` when not reported. */
  librarySectionTitle: string | null;
  /** A one-line context subtitle (show/artist, year, library), or `null`. */
  subtitle: string | null;
  /**
   * Grouping label for the item picker's collapse hierarchy: the containing show/artist name
   * (`grandparentTitle`) when the item has one, otherwise its library section title. `null` when
   * neither is reported.
   */
  groupTitle: string | null;
  /**
   * Parent-linkage metadata, surfaced so the Episodes / Tracks / Albums taxonomies can auto-link
   * their parent (a Track's Album, an Album's Artist via `parent*`; an Episode's Show via
   * `grandparent*`). `null` when the item has no such relation or Plex didn't report it.
   */
  parentTitle: string | null;
  parentRatingKey: string | null;
  grandparentTitle: string | null;
  grandparentRatingKey: string | null;
}

/** One flattened table-of-contents entry from a linked Kavita book (`GET /api/kavita/toc`). */
export interface KavitaTocEntry {
  /** Section title from the EPUB navigation or the PDF's embedded outline. */
  title: string;
  /** 1-based start page of the section. */
  page: number;
}

/**
 * Response of `GET /api/kavita/toc?seriesId=` — the linked book's table of contents, in document
 * order with the top two outline levels flattened. `entries` is empty when the book has no ToC.
 */
export interface KavitaTocResult {
  entries: KavitaTocEntry[];
  /** Total pages of the resolved book file (for end-page computation), or `null` when unknown. */
  pages: number | null;
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

/** Result of fetching book metadata for an ISBN/ASIN from Open Library (`GET /api/fetch-isbn-metadata`). */
export interface FetchIsbnMetadataResult {
  /** Book title, or `null` when not found. */
  title: string | null;
  /** Book description/synopsis, or `null` when unavailable. */
  description: string | null;
  /** URL of the book's cover image (large preferred), or `null` when unavailable. */
  coverUrl: string | null;
  /** Author names for the book. */
  authors: string[];
  /** Publication year string (e.g. `"1979"`), or `null` when unavailable. */
  year: string | null;
  /** Canonical Open Library URL for this book, or `null` when unavailable. */
  openLibraryUrl: string | null;
  /**
   * Detected book language, normalized to an ISO 639-1 code where known (e.g. `"en"`), or `null`
   * when unavailable. From Open Library's `languages` (MARC codes) or Google Books' `language`
   * (already ISO 639-1). A raw code, not yet matched to a `Language` row.
   */
  language: string | null;
  /**
   * Set only when this result came from the operator's Kavita library fallback: the matched
   * series' id, needed to fetch the cover through the authenticated Kavita API (`coverUrl` is a
   * middleware-relative proxy path for that case, not a directly downloadable URL).
   */
  kavitaSeriesId?: number | null;
}

/** A named snapshot of bookmark listing filter state, reusable on any listing page. */
export interface SavedFilter {
  id: string;
  name: string;
  /** URL slug derived from name; null for rows that predate the slug column (backfilled on boot). */
  slug: string | null;
  description: string | null;
  /** Serialized `BookmarkSearch` — typed generically so the middleware stays decoupled from the client's URL-state type. */
  filters: Record<string, unknown>;
  /** Surface this filter as a quick-access shortcut in the app sidebar (handy in the installed PWA). */
  viewableOnline: boolean;
  createdAt: string;
}

export interface CreateSavedFilterInput {
  name: string;
  description?: string | null;
  filters: Record<string, unknown>;
  viewableOnline?: boolean;
}

export type UpdateSavedFilterInput = Partial<CreateSavedFilterInput>;

export type PinnedSidebarEntityType
  = "category"
    | "tag"
    | "website"
    | "media-type"
    | "youtube-channel"
    | "saved-filter"
    | "location"
    | "taxonomy-listing";

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
