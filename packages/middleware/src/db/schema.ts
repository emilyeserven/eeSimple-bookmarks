import { relations, sql } from "drizzle-orm";
import { type AnyPgColumn, boolean, index, integer, jsonb, pgTable, type PgColumnBuilderBase, primaryKey, real, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { TAXONOMY_IMAGE_OWNER_TYPES } from "@eesimple/types";
import type { BookmarkSort, CardFieldZones, CardZoneLayouts, ConditionTree, ImportBlacklistEntry, LocationAlternateName, LocationBoundary, PlaceTypeColorConfig, PlaceTypeDisplayConfig, PlaceTypeIconConfig, PlaceTypeLevelGroupConfig, ShortenedLink, SocialLink, WebsiteParamRule } from "@eesimple/types";

/** `bookmarks` table — one row per saved bookmark. Tags now live in `bookmark_tags`. */
export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url"),
  // Original URL before any cleanup was applied; NULL when no cleanup was performed.
  // Nullable so `drizzle-kit push` applies cleanly to existing rows.
  originalUrl: text("original_url"),
  title: text("title").notNull(),
  description: text("description"),
  // Owning category. Nullable at the DB level so `drizzle-kit push` applies cleanly to
  // existing rows; the service layer resolves NULL to the built-in "Default" category.
  categoryId: uuid("category_id").references((): AnyPgColumn => categories.id, {
    onDelete: "set null",
  }),
  // The website (built-in taxonomy) this bookmark belongs to, derived from the URL host on save.
  // Nullable so `drizzle-kit push` applies cleanly to existing rows and URLs without a host.
  websiteId: uuid("website_id").references((): AnyPgColumn => websites.id, {
    onDelete: "set null",
  }),
  // The media type (built-in taxonomy) of this bookmark, e.g. "Video". Nullable; user-chosen or
  // auto-set (e.g. to "Video" for a YouTube URL). `set null` so deleting a media type is non-destructive.
  mediaTypeId: uuid("media_type_id").references((): AnyPgColumn => mediaTypes.id, {
    onDelete: "set null",
  }),
  // The YouTube channel (built-in taxonomy) this bookmark belongs to, auto-linked from a video's
  // fetched metadata. Nullable; only set for recognized YouTube videos.
  youtubeChannelId: uuid("youtube_channel_id").references((): AnyPgColumn => youtubeChannels.id, {
    onDelete: "set null",
  }),
  // The newsletter (taxonomy) this bookmark was imported from, set when an item is approved from a
  // newsletter import that has a newsletter selected. Nullable; only set for newsletter-imported
  // bookmarks. `set null` so deleting a newsletter is non-destructive.
  newsletterId: uuid("newsletter_id").references((): AnyPgColumn => newsletters.id, {
    onDelete: "set null",
  }),
  // The import event this bookmark was created from. Set on approval of an import item, or manually
  // from the issue page. Nullable; `set null` so deleting an import is non-destructive. Renamed from
  // `newsletter_import_id` via a guarded `migrate.ts` step.
  importId: uuid("import_id").references((): AnyPgColumn => imports.id, {
    onDelete: "set null",
  }),
  // The group (taxonomy) this bookmark is attributed to (e.g. a group, studio, or label).
  // Nullable; set null when the group is deleted.
  groupId: uuid("group_id").references((): AnyPgColumn => groups.id, {
    onDelete: "set null",
  }),
  // The Book (Books taxonomy) this bookmark is linked to. Nullable = push-safe additive; set null
  // when the book is deleted. Book selection now flows through this FK instead of the legacy Kavita
  // columns below (which are retained for pre-existing links). Cover/ToC/deep-link resolve the Kavita
  // series id from the linked Book, falling back to the legacy `kavita_series_id` when unset.
  bookId: uuid("book_id").references((): AnyPgColumn => books.id, {
    onDelete: "set null",
  }),
  // Legacy: direct link to a series on the connected Kavita server (Settings → Connectors). All
  // nullable = push-safe additive; the library id is kept alongside the series id to build the web UI
  // deep link, and the series name is denormalized at link time for display without a Kavita
  // round-trip. Retained for bookmarks linked before the Books taxonomy existed.
  kavitaSeriesId: integer("kavita_series_id"),
  kavitaLibraryId: integer("kavita_library_id"),
  kavitaSeriesName: text("kavita_series_name"),
  // The Plex-backed taxonomy (Movie / TV Show / Episode / Album / Track) this bookmark is
  // linked to. At most one is set. Nullable = push-safe additive; set null when the linked row is
  // deleted. Plex-item selection flows through these FKs instead of the legacy Plex columns below;
  // poster/deep-link resolve the Plex rating key from whichever is linked, falling back to the legacy
  // `plex_rating_key` when none is set. (The former `artist_id` was folded into the People/Groups
  // creator credits — see `bookmark_people` / `bookmark_groups` — and dropped in migrate.ts.)
  movieId: uuid("movie_id").references((): AnyPgColumn => movies.id, {
    onDelete: "set null",
  }),
  tvShowId: uuid("tv_show_id").references((): AnyPgColumn => tvShows.id, {
    onDelete: "set null",
  }),
  episodeId: uuid("episode_id").references((): AnyPgColumn => episodes.id, {
    onDelete: "set null",
  }),
  albumId: uuid("album_id").references((): AnyPgColumn => albums.id, {
    onDelete: "set null",
  }),
  trackId: uuid("track_id").references((): AnyPgColumn => tracks.id, {
    onDelete: "set null",
  }),
  podcastId: uuid("podcast_id").references((): AnyPgColumn => podcasts.id, {
    onDelete: "set null",
  }),
  // Legacy: direct link to an item on the connected Plex server (Settings → Connectors). All nullable =
  // push-safe additive; the item type and title are denormalized at link time so the deep link and
  // detail display need no Plex round-trip. The web-UI deep link also needs the server's
  // machineIdentifier, resolved (and cached) server-side from Plex's /identity and returned via
  // /api/connectors. Retained for bookmarks linked before the Movies/TV Shows taxonomies existed.
  plexRatingKey: text("plex_rating_key"),
  plexItemType: text("plex_item_type"),
  plexItemTitle: text("plex_item_title"),
  priority: integer("priority").notNull().default(0),
  // Specific reason the last image auto-grab attempt failed. Nullable so `drizzle-kit push`
  // applies cleanly to existing rows (push-safe additive change). NULL means never attempted or
  // the last attempt succeeded.
  imageAutoGrabError: text("image_auto_grab_error"),
  // "image" | "screenshot" | null. null ("auto") reproduces today's fallback
  // (prefer image, else screenshot). Nullable so `drizzle-kit push` applies cleanly to existing
  // rows (push-safe additive change).
  imageDisplayPreference: text("image_display_preference"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }),
}, table => [
  unique("bookmarks_url_unique").on(table.url),
]);

/**
 * `bookmark_images` — 0..N images per bookmark. The image bytes live in object storage (Garage/S3);
 * this table holds only metadata. Surrogate `id` is the primary key (a bookmark can hold several
 * images); exactly one row per bookmark has `isMain = true` — that invariant is enforced in the
 * service layer (a DB partial-unique can't converge under `drizzle-kit push`). Rows cascade away with
 * their bookmark.
 *
 * The `id` PK swap + `isMain`/`sortOrder` columns are pre-applied idempotently in `migrate.ts` (the
 * PK change is destructive and NOT-NULL columns prompt push), so push's diff stays additive.
 */
export const bookmarkImages = pgTable("bookmark_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  // Object-storage key the bytes are stored under, e.g. "bookmarks/<bookmarkId>/<imageId>.webp".
  // Legacy single-image rows keep their original "bookmarks/<id>.webp" key; the serving route reads
  // this column rather than reconstructing it, so the two schemes coexist.
  objectKey: text("object_key").notNull(),
  // Always "image/webp" after the resize/encode pipeline.
  contentType: text("content_type").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  byteSize: integer("byte_size").notNull(),
  // "upload" | "og" — kept as text so new sources can be added without a migration.
  source: text("source").notNull(),
  // Exactly one row per bookmark is the main/primary image (service-enforced). Pre-applied in migrate.ts.
  isMain: boolean("is_main").notNull().default(false),
  // Display order among a bookmark's images (the main image sorts first regardless). Pre-applied in migrate.ts.
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  index("bookmark_images_bookmark_id_idx").on(table.bookmarkId),
]);

/**
 * `bookmark_screenshots` — 0..1 Browserless-captured screenshot per bookmark. Mirrors
 * `bookmark_images`: bytes live in object storage under `bookmarks/{id}-screenshot.webp`; this
 * table holds only metadata. Used as a fallback image when no `og:image` / upload image is set.
 */
export const bookmarkScreenshots = pgTable("bookmark_screenshots", {
  bookmarkId: uuid("bookmark_id").primaryKey().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  byteSize: integer("byte_size").notNull(),
  // Always "screenshot" — kept as text so existing infrastructure (source column) stays consistent.
  source: text("source").notNull(),
  // The capture settings last used to take this screenshot, remembered so the edit form can prefill
  // them next time. Nullable: null when a setting wasn't explicitly requested (e.g. the bulk
  // auto-fetch fallback, which calls takeAndStoreScreenshot with no options).
  delayMs: integer("delay_ms"),
  viewportWidth: integer("viewport_width"),
  viewportHeight: integer("viewport_height"),
  scrollDistance: integer("scroll_distance"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

/**
 * `bookmark_reel_archives` — 0..1 self-contained Instagram-reel video capture per bookmark. Mirrors
 * `bookmark_screenshots`: the video bytes live in object storage under `bookmarks/{id}-reel.mp4`;
 * this table holds only metadata. Captured on demand via Browserless (extract the video URL) + a
 * server-side fetch, so the reel survives being deleted from Instagram. `width`/`height`/
 * `durationSeconds` are nullable (not always determinable from the raw stream). Push-safe: this is a
 * new table with no NOT NULL columns added to an existing one, so `drizzle-kit push` applies it
 * without prompting — no `migrate.ts` step needed.
 */
export const bookmarkReelArchives = pgTable("bookmark_reel_archives", {
  bookmarkId: uuid("bookmark_id").primaryKey().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  width: integer("width"),
  height: integer("height"),
  durationSeconds: integer("duration_seconds"),
  // The Instagram URL the video was captured from (the bookmark's own stored URL at capture time).
  sourceUrl: text("source_url").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

/**
 * `reel_archive_jobs` — one background reel-capture job per row, mirroring the `imports` queue model.
 * A job archives a single bookmark's Instagram reel; `status` advances queued → processing →
 * complete | failed and powers the header progress indicator (polled while any job is in flight).
 * Push-safe: new table, no NOT NULL column added to an existing one.
 */
export const reelArchiveJobs = pgTable("reel_archive_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  // "queued" | "processing" | "complete" | "failed". Text so a new state needs no migration.
  status: text("status").notNull(),
  // Free-text reason when status = "failed" (e.g. "No reel video was found").
  errorReason: text("error_reason"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

/**
 * `media_objects` — a full manifest of every object in the storage bucket, reconciled by the
 * "Scan bucket" action. `objectKey` is the primary key. `bookmarkId` links the object to its
 * bookmark when one exists; the `set null` FK means deleting a bookmark auto-nulls the link, so the
 * row *becomes* an orphan (`bookmarkId IS NULL`) with no extra bookkeeping. `lastSeenAt` is stamped
 * each scan so rows for objects deleted out-of-band can be pruned.
 */
export const mediaObjects = pgTable("media_objects", {
  objectKey: text("object_key").primaryKey(),
  // MIME type derived from the key's extension; nullable since listings don't carry it.
  contentType: text("content_type"),
  // Size in bytes as reported by the store; nullable when unavailable.
  byteSize: integer("byte_size"),
  // Last-modified timestamp from object storage; nullable when unavailable.
  lastModified: timestamp("last_modified", {
    withTimezone: true,
  }),
  // The owning bookmark, or NULL for an orphan. `set null` so deleting a bookmark turns its object
  // into an orphan automatically rather than leaving a dangling reference.
  bookmarkId: uuid("bookmark_id").references(() => bookmarks.id, {
    onDelete: "set null",
  }),
  lastSeenAt: timestamp("last_seen_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

/**
 * `website_favicons` — 0..1 favicon per website. Mirrors `bookmark_images`: the bytes live in object
 * storage under `website-favicons/<id>.webp`; this table holds only metadata. `websiteId` is the
 * primary key (a replace is an upsert) and the row cascades away with its website.
 */
export const websiteFavicons = pgTable("website_favicons", {
  websiteId: uuid("website_id").primaryKey().references((): AnyPgColumn => websites.id, {
    onDelete: "cascade",
  }),
  // Object-storage key the bytes are stored under, e.g. "website-favicons/<id>.webp".
  objectKey: text("object_key").notNull(),
  // Always "image/webp" after the resize/encode pipeline.
  contentType: text("content_type").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  byteSize: integer("byte_size").notNull(),
  // "icon" | "og" — how the favicon was sourced; text so new sources can be added without a migration.
  source: text("source").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

/**
 * `websites` table — the built-in "Websites" taxonomy. One row per distinct host; bookmarks are
 * auto-linked to a website by the host of their URL. Seeded built-ins (e.g. youtube.com → "YouTube")
 * are protected from rename/delete.
 */
export const websites = pgTable("websites", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Normalized host (lower-cased, leading `www.` stripped), e.g. "github.com".
  domain: text("domain").notNull(),
  // Human-friendly name; defaults to the domain on creation and is renamable.
  siteName: text("site_name").notNull(),
  // URL-friendly identifier derived from the domain (e.g. "github" from "github.com"). Nullable at
  // the DB level so `drizzle-kit push` applies cleanly to existing rows; backfilled at boot.
  slug: text("slug"),
  // Seeded built-ins (e.g. youtube.com) can't be renamed or deleted; auto-created sites can.
  builtIn: boolean("built_in").notNull().default(false),
  // Verified shortened-link domains that resolve to this site (e.g. youtu.be → youtube.com), with
  // optional expansion templates. Drives URL canonicalization instead of hardcoded per-site logic.
  shortenedLinks: jsonb("shortened_links").$type<ShortenedLink[]>().notNull().default(sql`'[]'::jsonb`),
  // Path-scoped query-param whitelist; params outside the matching rule are stripped on canonicalize.
  paramRules: jsonb("param_rules").$type<WebsiteParamRule[]>().notNull().default(sql`'[]'::jsonb`),
  // Optional category association; set null when the category is deleted.
  categoryId: uuid("category_id").references((): AnyPgColumn => categories.id, {
    onDelete: "set null",
  }),
  // Optional default media type applied to new bookmarks saved from this site. Nullable (push-safe
  // additive); set null when the media type is deleted.
  mediaTypeId: uuid("media_type_id").references((): AnyPgColumn => mediaTypes.id, {
    onDelete: "set null",
  }),
  // Specific reason the last favicon auto-grab attempt failed. Nullable so `drizzle-kit push`
  // applies cleanly to existing rows (push-safe additive change). NULL means never attempted or
  // the last attempt succeeded.
  faviconAutoGrabError: text("favicon_auto_grab_error"),
  // Social media profile links (X, Instagram, Facebook, …). NOT NULL; pre-applied in migrate.ts.
  socialLinks: jsonb("social_links").$type<SocialLink[]>().notNull().default(sql`'[]'::jsonb`),
  // Extra names this site appends to bookmark titles (e.g. "GH" for GitHub). Used to strip title
  // suffixes during metadata fetch, mirroring YouTube channel selfIds. Nullable (push-safe additive).
  alternateNames: jsonb("alternate_names").$type<string[]>(),
  // Flags this site as having unreliable redirect resolution. When true, its bookmarks appear in
  // Settings → Redirect Failures for URL correction. NOT NULL; pre-applied in migrate.ts.
  redirectResolutionFailure: boolean("redirect_resolution_failure").notNull().default(false),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("websites_domain_unique").on(table.domain),
  unique("websites_slug_unique").on(table.slug),
]);

/**
 * `media_types` table — the built-in "Media Types" taxonomy. A small, mostly-seeded vocabulary
 * (Video, Article, Podcast, …) classifying what a bookmark is. Unlike websites it isn't URL-derived;
 * a bookmark's media type is chosen in the form or auto-set from fetched metadata.
 */
export const mediaTypes = pgTable("media_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable for clean `push`; backfilled at boot.
  slug: text("slug"),
  // Seeded built-ins (Video, Article, …) can't be renamed or deleted; users may add custom ones.
  builtIn: boolean("built_in").notNull().default(false),
  // Display ordering; lower sorts first. Seeded built-ins get a stable order.
  sortOrder: integer("sort_order").notNull().default(0),
  // Optional Lucide icon name shown in the MediaTypePill on bookmark cards.
  icon: text("icon"),
  // Parent media type for one level of nesting (e.g. Audio > Podcast). NULL means a root type.
  // Nullable, so it is a push-safe additive column. Cascade so deleting a parent removes its children.
  parentId: uuid("parent_id").references((): AnyPgColumn => mediaTypes.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("media_types_name_unique").on(table.name),
  unique("media_types_slug_unique").on(table.slug),
]);

/**
 * `languages` table — the built-in "Languages" taxonomy. A flat, seeded vocabulary (English,
 * Spanish, Japanese, …) classifying what language a bookmark's content is in. A bookmark's language
 * is chosen in the form or auto-detected from the scanned page / ISBN provider / YouTube metadata.
 */
export const languages = pgTable("languages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // ISO 639-1 code (e.g. "en") when known; nullable since a fully custom language may not have one.
  // Unique so autofetch can match a detected code to an existing row instead of creating a duplicate.
  isoCode: text("iso_code"),
  // Nullable for clean `push`; backfilled at boot.
  slug: text("slug"),
  // Seeded built-ins (English, Spanish, …) can't be renamed or deleted; users may add custom ones.
  builtIn: boolean("built_in").notNull().default(false),
  // Display ordering; lower sorts first. Seeded built-ins get a stable order.
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("languages_name_unique").on(table.name),
  unique("languages_slug_unique").on(table.slug),
  unique("languages_iso_code_unique").on(table.isoCode),
]);

/**
 * `language_usage_levels` table — a user-managed vocabulary describing *how* a language is used on an
 * item (see `language_usages`). Grouped by `kind`: `availability` levels (Dub, Subtitles,
 * Explanations…) qualify content entities, `proficiency` levels (Native, Fluent, Learning…) qualify
 * People. Mirrors `place_types` (nullable slug for push-safe addition, backfilled at boot) plus a
 * seeded `builtIn` flag like `languages`. `kind` is free text (not an enum) so a new kind can be
 * added without a migration.
 */
export const languageUsageLevels = pgTable("language_usage_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug"),
  // "availability" | "proficiency"
  kind: text("kind").notNull(),
  builtIn: boolean("built_in").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  // Names are unique per kind (a "Native" availability level and a "Native" proficiency level could
  // coexist, though the seeds don't overlap); slugs are globally unique for routing.
  // A composite `uniqueIndex`, NOT a table `unique()` constraint, on purpose — drizzle-kit 0.31.10
  // re-proposes composite unique CONSTRAINTs on every push, prompting to truncate the populated
  // table and crashing the non-TTY deploy (see the `tags_parent_name_unique` note in migrate.ts).
  uniqueIndex("language_usage_levels_kind_name_unique").on(table.kind, table.name),
  unique("language_usage_levels_slug_unique").on(table.slug),
]);

export type LanguageUsageLevelRow = typeof languageUsageLevels.$inferSelect;

/**
 * The owner entities a `language_usages` row can attach to. Polymorphic (`ownerId` carries no FK)
 * because one physical table can't carry a foreign key into six different owner tables — the same
 * trade `taxonomy_images` makes.
 */
export const LANGUAGE_USAGE_OWNER_TYPES = ["bookmark", "movie", "tvShow", "website", "youtubeChannel", "person"] as const;

/**
 * `language_usages` table — associates a language + a usage level with an owner entity (a bookmark,
 * movie, TV show, website, YouTube channel, or person), optionally annotated with a free-text `note`
 * (e.g. "sparse"). Polymorphic on `(ownerType, ownerId)` like `taxonomy_images`; a surrogate `id` PK
 * plus a unique index on the full tuple like `bookmark_relationships`. `languageId`/`usageLevelId`
 * are real FKs; `ownerId` is not, so each owner's delete service must call
 * `deleteLanguageUsagesForOwner` to avoid orphans.
 */
export const languageUsages = pgTable("language_usages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerType: text("owner_type").notNull(),
  ownerId: uuid("owner_id").notNull(),
  languageId: uuid("language_id").notNull().references(() => languages.id, {
    onDelete: "cascade",
  }),
  // No cascade: a usage level's delete is handled by the reassign-or-clear flow in its service.
  usageLevelId: uuid("usage_level_id").notNull().references(() => languageUsageLevels.id),
  note: text("note"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  index("language_usages_owner_idx").on(table.ownerType, table.ownerId),
  // A composite `uniqueIndex`, NOT a table `unique()` constraint — same drizzle-kit push
  // non-convergence as the kind/name index above (and `tags_parent_name_unique`); see migrate.ts.
  uniqueIndex("language_usages_owner_lang_level_unique").on(
    table.ownerType,
    table.ownerId,
    table.languageId,
    table.usageLevelId,
  ),
]);

export type LanguageUsageRow = typeof languageUsages.$inferSelect;

/**
 * The owner entities an `entity_names` row can attach to. Polymorphic (`ownerId` carries no FK),
 * the same trade `language_usages` / `taxonomy_images` make. Mirrors `ENTITY_NAME_OWNER_TYPES` in
 * `@eesimple/types`.
 */
export const ENTITY_NAME_OWNER_TYPES = [
  "bookmark", "category", "tag", "mediaType", "genreMood", "location", "person", "group",
  "book", "podcast", "movie", "tvShow", "episode", "album", "track",
] as const;

/**
 * `entity_names` table — multilingual titles for an owner entity (bookmark or taxonomy term). Each
 * row is one title labelled by a language; the row flagged `isPrimary` mirrors the owner's base
 * `name`/`title` column so every existing query/sort/hydration keeps working untouched (the table is
 * additive). Polymorphic on `(ownerType, ownerId)` like `language_usages`; `languageId` is a real FK
 * (cascade) but `ownerId` is not, so each owner's delete service must call
 * `deleteEntityNamesForOwner` to avoid orphans. See `services/entityNames.ts`.
 */
export const entityNames = pgTable("entity_names", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerType: text("owner_type").notNull(),
  ownerId: uuid("owner_id").notNull(),
  languageId: uuid("language_id").notNull().references(() => languages.id, {
    onDelete: "cascade",
  }),
  value: text("value").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  index("entity_names_owner_idx").on(table.ownerType, table.ownerId),
  // At most one name per (owner, language). A composite `uniqueIndex`, NOT a table `unique()`
  // constraint — the same drizzle-kit push non-convergence as `language_usages` (see migrate.ts).
  uniqueIndex("entity_names_owner_language_unique").on(
    table.ownerType,
    table.ownerId,
    table.languageId,
  ),
]);

export type EntityNameRow = typeof entityNames.$inferSelect;

/**
 * `group_types` table — a flat taxonomy classifying groups (e.g. Company, Creator Collaborative,
 * Podcast Multi-Host, Doujin Circle). Referenced by `groups.group_type_id`. Seeded on boot.
 */
export const groupTypes = pgTable("group_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // Nullable so drizzle-kit push applies cleanly to any future rows; backfilled at boot.
  slug: text("slug"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("group_types_name_unique").on(table.name),
  unique("group_types_slug_unique").on(table.slug),
]);

export type GroupTypeRow = typeof groupTypes.$inferSelect;

/**
 * `groups` table — taxonomy of groups and individuals (groups, studios, labels, …).
 * Bookmarks (especially books / offline items) may be attributed to a group. Optionally
 * linked to a website in the Websites taxonomy, and optionally classified by a group type.
 */
export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // Nullable so drizzle-kit push applies cleanly to any future rows; backfilled at boot.
  slug: text("slug"),
  // Optional link to an existing website entry. set null when the website is deleted.
  websiteId: uuid("website_id").references((): AnyPgColumn => websites.id, {
    onDelete: "set null",
  }),
  // Optional classifying group type. set null when the group type is deleted. Nullable → push-safe.
  groupTypeId: uuid("group_type_id").references((): AnyPgColumn => groupTypes.id, {
    onDelete: "set null",
  }),
  // Social media profile links. NOT NULL; pre-applied in migrate.ts.
  socialLinks: jsonb("social_links").$type<SocialLink[]>().notNull().default(sql`'[]'::jsonb`),
  // Fields absorbed from the former Artists taxonomy (a group/band is a Group). `sort_order` is
  // NOT NULL default 0 → pre-applied in migrate.ts (push would prompt); the rest are nullable → push-safe.
  sortOrder: integer("sort_order").notNull().default(0),
  plexRatingKey: text("plex_rating_key"),
  plexItemType: text("plex_item_type"),
  plexItemTitle: text("plex_item_title"),
  year: integer("year"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("groups_name_unique").on(table.name),
  unique("groups_slug_unique").on(table.slug),
]);

export type GroupRow = typeof groups.$inferSelect;

/**
 * `group_images` — a single avatar/poster image per group, mirroring `person_images`. The bytes
 * live in object storage; this table holds only metadata. Absorbed alongside the Artists → People/Groups
 * merge so a group creator gets a poster like a solo artist did.
 */
export const groupImages = pgTable("group_images", {
  groupId: uuid("group_id").primaryKey().references(() => groups.id, {
    onDelete: "cascade",
  }),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  byteSize: integer("byte_size").notNull(),
  // "upload" | "website" | "plex"
  source: text("source").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export type GroupImageRow = typeof groupImages.$inferSelect;

/**
 * `property_groups` table — optional groupings for custom properties. A property may belong to one
 * group; grouped properties render together (under the group's heading) on bookmark detail pages and
 * in the listings filter sidebar. Groups carry a `priority` (lower sorts first) and a description.
 */
export const propertyGroups = pgTable("property_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable for clean `push`; backfilled at boot.
  slug: text("slug"),
  // Free-text description surfaced on the group's detail page.
  description: text("description"),
  // Display ordering across groups; lower sorts first.
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("property_groups_name_unique").on(table.name),
  unique("property_groups_slug_unique").on(table.slug),
]);

/**
 * `media_properties` table — a taxonomy of franchises / IP groupings (e.g. "The Lord of the Rings").
 * A Book (below) may belong to one media property. Flat, user-managed vocabulary. Nullable slug for
 * push-safe addition; backfilled at boot.
 */
export const mediaProperties = pgTable("media_properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable for clean `push`; backfilled at boot.
  slug: text("slug"),
  // Display ordering; lower sorts first.
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("media_properties_name_unique").on(table.name),
  unique("media_properties_slug_unique").on(table.slug),
]);

/**
 * `books` table — a taxonomy of individual books, optionally grouped under a media property. A book
 * carries the Kavita linkage (series/library ids + denormalized series name) so bookmarks reference a
 * Book (via `bookmarks.book_id`) rather than a live Kavita series, and cover/ToC/deep-link features
 * resolve the series id from the linked Book. All Kavita columns + `mediaPropertyId` are nullable →
 * push-safe additive. Nullable slug for clean `push`; backfilled at boot.
 */
export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug"),
  sortOrder: integer("sort_order").notNull().default(0),
  // Optional franchise/IP grouping. set null when the media property is deleted.
  mediaPropertyId: uuid("media_property_id").references((): AnyPgColumn => mediaProperties.id, {
    onDelete: "set null",
  }),
  // Kavita series linkage (mirrors what the bookmark used to store): series id + library id build the
  // web-UI deep link; the series name is denormalized for display without a Kavita round-trip.
  kavitaSeriesId: integer("kavita_series_id"),
  kavitaLibraryId: integer("kavita_library_id"),
  kavitaSeriesName: text("kavita_series_name"),
  // ISBN/ASIN captured from the Add form's ISBN lookup (or entered/edited by hand). Nullable so
  // `drizzle-kit push` applies cleanly; also powers a later "pull cover from ISBN" re-fetch.
  isbn: text("isbn"),
  // Optional release year surfaced by the Kavita search.
  releaseYear: integer("release_year"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("books_name_unique").on(table.name),
  unique("books_slug_unique").on(table.slug),
]);

/**
 * Shared column block for the five Plex-backed media taxonomies (`movies` / `tv_shows` / `episodes` /
 * `albums` / `tracks`), which otherwise repeat an identical set of columns. It is a **factory** — not
 * a shared object literal — so every `pgTable` receives fresh column-builder instances; Drizzle column
 * builders are stateful configs and must not be shared across tables. The optional `parentFk` argument
 * is spread in immediately after `mediaPropertyId` so `episodes` (`tv_show_id`) and `tracks`
 * (`album_id`) keep their historical column ordering, which the generated DDL depends on.
 *
 * All Plex columns + `mediaPropertyId` are nullable → push-safe additive. Nullable slug for clean
 * `push`; backfilled at boot.
 */
const plexTaxonomyColumns = <T extends Record<string, PgColumnBuilderBase> = Record<never, never>>(parentFk?: T) => ({
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug"),
  sortOrder: integer("sort_order").notNull().default(0),
  // Optional franchise/IP grouping. set null when the media property is deleted.
  mediaPropertyId: uuid("media_property_id").references((): AnyPgColumn => mediaProperties.id, {
    onDelete: "set null",
  }),
  // A parent FK (episodes → tv_show_id, tracks → album_id) is spread here to preserve column order.
  ...((parentFk ?? {}) as T),
  // Plex linkage (mirrors what the bookmark used to store): rating key builds the web-UI deep link;
  // the item type is denormalized for the deep-link label without a Plex round-trip. The title is
  // also denormalized at link time (from the Plex search result) so the "Linked to Plex" display can
  // show the actual item name without a Plex round-trip.
  plexRatingKey: text("plex_rating_key"),
  plexItemType: text("plex_item_type"),
  plexItemTitle: text("plex_item_title"),
  // Optional release year surfaced by the Plex search.
  year: integer("year"),
  // Wikidata QID + Wikipedia article links resolved by "Autofetch from Plex" (mirrors `locations`).
  // All nullable → push-safe additive.
  wikidataId: text("wikidata_id"),
  wikipediaLinkEn: text("wikipedia_link_en"),
  wikipediaLinkLocal: text("wikipedia_link_local"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

/**
 * The `name` + `slug` unique constraints shared by every Plex taxonomy table. Parameterized by the
 * table's constraint-name prefix so the generated constraint names stay byte-identical to the
 * hand-written ones (`<prefix>_name_unique` / `<prefix>_slug_unique`).
 */
const plexTaxonomyUniques = (table: { name: AnyPgColumn;
  slug: AnyPgColumn; }, prefix: string) => [
  unique(`${prefix}_name_unique`).on(table.name),
  unique(`${prefix}_slug_unique`).on(table.slug),
];

/**
 * `movies` table — a taxonomy of individual movies, optionally grouped under a media property. A movie
 * carries the Plex linkage (rating key + item type) so bookmarks reference a Movie (via
 * `bookmarks.movie_id`) rather than a live Plex item, and poster/deep-link features resolve the Plex
 * rating key from the linked Movie.
 */
export const movies = pgTable("movies", {
  ...plexTaxonomyColumns(),
}, table => plexTaxonomyUniques(table, "movies"));

/**
 * `tv_shows` table — a taxonomy of TV shows, optionally grouped under a media property. Same shape as
 * `movies`: Plex linkage (rating key + item type) so bookmarks reference a TV Show (via
 * `bookmarks.tv_show_id`) rather than a live Plex item. All Plex columns + `mediaPropertyId` nullable →
 * push-safe additive. Nullable slug for clean `push`; backfilled at boot.
 */
export const tvShows = pgTable("tv_shows", {
  ...plexTaxonomyColumns(),
}, table => plexTaxonomyUniques(table, "tv_shows"));

/**
 * `episodes` table — a taxonomy of TV episodes. Same Plex-backed shape as `movies`, plus a nullable
 * `tv_show_id` parent FK (set null when the show is deleted): an episode belongs to a TV Show, and the
 * parent is auto-linked from Plex's grandparent metadata when it already exists.
 */
export const episodes = pgTable("episodes", {
  ...plexTaxonomyColumns({
    // Parent TV Show. set null when the show is deleted.
    tvShowId: uuid("tv_show_id").references((): AnyPgColumn => tvShows.id, {
      onDelete: "set null",
    }),
  }),
}, table => plexTaxonomyUniques(table, "episodes"));

/**
 * `albums` table — a taxonomy of music albums. Plex-backed like `movies`. Credited to People
 * (individuals) and Groups (groups) many-to-many via `album_people` / `album_groups`.
 */
export const albums = pgTable("albums", {
  ...plexTaxonomyColumns(),
}, table => plexTaxonomyUniques(table, "albums"));

/**
 * `tracks` table — a taxonomy of music tracks. Same Plex-backed shape as `movies`, plus a nullable
 * `album_id` parent FK (set null when the album is deleted): a track belongs to an Album, and the
 * parent is auto-linked from Plex's parent metadata when it already exists.
 */
export const tracks = pgTable("tracks", {
  ...plexTaxonomyColumns({
    // Parent Album. set null when the album is deleted.
    albumId: uuid("album_id").references((): AnyPgColumn => albums.id, {
      onDelete: "set null",
    }),
  }),
}, table => plexTaxonomyUniques(table, "tracks"));

/**
 * `podcasts` table — a taxonomy of podcasts, optionally grouped under a media property. Unlike the
 * Plex-backed siblings, a Podcast is sourced keylessly from its public RSS/XML feed and/or Apple
 * Podcasts (iTunes): `feed_url` is the sync source of truth, `itunes_id`/`itunes_url` link the Apple
 * Podcasts entry, and `author`/`description` are denormalized from the feed. All source columns +
 * `mediaPropertyId` nullable → push-safe additive. Nullable slug for clean `push`; backfilled at boot.
 */
export const podcasts = pgTable("podcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug"),
  sortOrder: integer("sort_order").notNull().default(0),
  mediaPropertyId: uuid("media_property_id").references((): AnyPgColumn => mediaProperties.id, {
    onDelete: "set null",
  }),
  // Podcast source linkage: the RSS/XML feed URL is the canonical sync source; the iTunes id/url link
  // the Apple Podcasts entry (from the keyless search picker) for a deep link + re-resolution.
  feedUrl: text("feed_url"),
  itunesId: integer("itunes_id"),
  itunesUrl: text("itunes_url"),
  // Other listening-service page links: Spotify is manual-paste (no keyless search); Pocket Casts is
  // cross-resolved from the feed. `defaultLinkProvider` picks which one the podcast links out to.
  spotifyUrl: text("spotify_url"),
  pocketCastsUuid: text("pocket_casts_uuid"),
  pocketCastsUrl: text("pocket_casts_url"),
  defaultLinkProvider: text("default_link_provider"),
  description: text("description"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("podcasts_name_unique").on(table.name),
  unique("podcasts_slug_unique").on(table.slug),
]);

/**
 * `taxonomy_images` — a shared, polymorphic multi-image gallery for the Plex/Kavita-backed media
 * taxonomies (Movies, TV Shows, Episodes, Albums, Tracks, Books, Podcasts). Mirrors `bookmark_images`
 * (up to {@link MAX_TAXONOMY_IMAGES} per owner, one flagged `isMain`) but keyed by
 * `(ownerType, ownerId)` instead of a single `bookmarkId` FK, since one physical table can't carry a
 * foreign key into seven different owner tables. `ownerType` is one of the shared
 * `TAXONOMY_IMAGE_OWNER_TYPES` (`@eesimple/types`) — re-exported here so schema consumers don't need
 * a second import for it.
 */
export { TAXONOMY_IMAGE_OWNER_TYPES };

export const taxonomyImages = pgTable("taxonomy_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerType: text("owner_type").notNull(),
  ownerId: uuid("owner_id").notNull(),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  byteSize: integer("byte_size").notNull(),
  // "upload" | "plex" | "kavita" | "isbn" — text so a new source can be added without a migration.
  source: text("source").notNull(),
  isMain: boolean("is_main").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  index("taxonomy_images_owner_idx").on(table.ownerType, table.ownerId),
]);

/** `album_people` join — M:M crediting an album to People (individual creators). */
export const albumPeople = pgTable("album_people", {
  albumId: uuid("album_id").notNull().references(() => albums.id, {
    onDelete: "cascade",
  }),
  personId: uuid("person_id").notNull().references((): AnyPgColumn => people.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.albumId, table.personId],
  }),
]);

/** `album_groups` join — M:M crediting an album to Groups (group creators). */
export const albumGroups = pgTable("album_groups", {
  albumId: uuid("album_id").notNull().references(() => albums.id, {
    onDelete: "cascade",
  }),
  groupId: uuid("group_id").notNull().references((): AnyPgColumn => groups.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.albumId, table.groupId],
  }),
]);

/** `podcast_people` join — M:M crediting a podcast to People (individual authors/hosts). */
export const podcastPeople = pgTable("podcast_people", {
  podcastId: uuid("podcast_id").notNull().references((): AnyPgColumn => podcasts.id, {
    onDelete: "cascade",
  }),
  personId: uuid("person_id").notNull().references((): AnyPgColumn => people.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.podcastId, table.personId],
  }),
]);

/** `podcast_groups` join — M:M crediting a podcast to Groups (organizations/networks). */
export const podcastGroups = pgTable("podcast_groups", {
  podcastId: uuid("podcast_id").notNull().references((): AnyPgColumn => podcasts.id, {
    onDelete: "cascade",
  }),
  groupId: uuid("group_id").notNull().references((): AnyPgColumn => groups.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.podcastId, table.groupId],
  }),
]);

/**
 * `relationship_types` table — the "Relationship Types" taxonomy (Similar, Parent/child, Opposite, …)
 * classifying how two bookmarks relate. `directional` types encode a parent→child direction;
 * symmetric types read the same from either side. Seeded built-ins can't be renamed/deleted; users
 * may add their own.
 */
export const relationshipTypes = pgTable("relationship_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable for clean `push`; backfilled at boot.
  slug: text("slug"),
  // Whether the relationship has a direction (parent→child) rather than being symmetric.
  directional: boolean("directional").notNull().default(false),
  // Seeded built-ins (Similar, Parent/child, Opposite) can't be renamed or deleted.
  builtIn: boolean("built_in").notNull().default(false),
  // Display ordering; lower sorts first.
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("relationship_types_name_unique").on(table.name),
  unique("relationship_types_slug_unique").on(table.slug),
]);

/**
 * `youtube_channels` table — the built-in "YouTube Channels" taxonomy. One row per distinct channel;
 * bookmarks for a YouTube video are auto-linked to their channel from the video's fetched metadata.
 */
export const youtubeChannels = pgTable("youtube_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Stable normalized identifier for the channel (its canonical URL/handle path), e.g. "@veritasium".
  channelKey: text("channel_key").notNull(),
  // Human-friendly channel name (from oEmbed `author_name`); renamable.
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable for clean `push`; backfilled at boot.
  slug: text("slug"),
  // Optional category association; set null when the category is deleted.
  categoryId: uuid("category_id").references((): AnyPgColumn => categories.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("youtube_channels_key_unique").on(table.channelKey),
  unique("youtube_channels_slug_unique").on(table.slug),
]);

/**
 * `youtube_channel_images` — 0..1 avatar per channel. Mirrors `bookmark_images`: the bytes live in
 * object storage under `youtube-channels/<id>.webp`; this table holds only metadata. `youtubeChannelId`
 * is the primary key (a replace is an upsert) and the row cascades away with its channel.
 */
export const youtubeChannelImages = pgTable("youtube_channel_images", {
  youtubeChannelId: uuid("youtube_channel_id").primaryKey().references((): AnyPgColumn => youtubeChannels.id, {
    onDelete: "cascade",
  }),
  // Object-storage key the bytes are stored under, e.g. "youtube-channels/<id>.webp".
  objectKey: text("object_key").notNull(),
  // Always "image/webp" after the resize/encode pipeline.
  contentType: text("content_type").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  byteSize: integer("byte_size").notNull(),
  // "og" | "upload" — kept as text so new sources can be added without a migration.
  source: text("source").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

/**
 * `youtube_channel_self_ids` — short self-identifiers a channel appends to its video titles
 * (e.g. "SNL" for Saturday Night Live). Used to strip the suffix on metadata fetch.
 */
export const youtubeChannelSelfIds = pgTable("youtube_channel_self_ids", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => youtubeChannels.id, {
    onDelete: "cascade",
  }),
  value: text("value").notNull(),
}, table => [
  unique("youtube_channel_self_ids_channel_value_unique").on(table.channelId, table.value),
]);

/** `website_tags` join — default tags applied to bookmarks saved for a given website. */
export const websiteTags = pgTable("website_tags", {
  websiteId: uuid("website_id").notNull().references(() => websites.id, {
    onDelete: "cascade",
  }),
  tagId: uuid("tag_id").notNull().references((): AnyPgColumn => tags.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.websiteId, table.tagId],
  }),
]);

/** `youtube_channel_tags` join — default tags applied to bookmarks saved for a given channel. */
export const youtubeChannelTags = pgTable("youtube_channel_tags", {
  channelId: uuid("channel_id").notNull().references(() => youtubeChannels.id, {
    onDelete: "cascade",
  }),
  tagId: uuid("tag_id").notNull().references((): AnyPgColumn => tags.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.channelId, table.tagId],
  }),
]);

/** `website_youtube_channels` join — YouTube channels associated with a website. Brand-new table; push-safe additive. */
export const websiteYoutubeChannels = pgTable("website_youtube_channels", {
  websiteId: uuid("website_id").notNull().references(() => websites.id, {
    onDelete: "cascade",
  }),
  channelId: uuid("channel_id").notNull().references(() => youtubeChannels.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.websiteId, table.channelId],
  }),
]);

/**
 * `newsletters` table — the "Newsletters" taxonomy. One row per newsletter publication
 * (e.g. "Smashing Magazine", "The Pragmatic Engineer"). Selected during a newsletter import; its
 * default category / tags / media type are applied to the bookmarks created on approval. A brand-new
 * table → push-safe additive, no migrate.ts step.
 */
export const newsletters = pgTable("newsletters", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Human-friendly publication name; renamable.
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name, generated on create.
  slug: text("slug").notNull(),
  // Optional default category applied to new bookmarks imported from this newsletter; set null when
  // the category is deleted.
  categoryId: uuid("category_id").references((): AnyPgColumn => categories.id, {
    onDelete: "set null",
  }),
  // Optional default media type applied to new bookmarks imported from this newsletter; set null when
  // the media type is deleted.
  mediaTypeId: uuid("media_type_id").references((): AnyPgColumn => mediaTypes.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("newsletters_name_unique").on(table.name),
  unique("newsletters_slug_unique").on(table.slug),
]);

/** `newsletter_tags` join — default tags applied to bookmarks imported from a given newsletter. */
export const newsletterTags = pgTable("newsletter_tags", {
  newsletterId: uuid("newsletter_id").notNull().references(() => newsletters.id, {
    onDelete: "cascade",
  }),
  tagId: uuid("tag_id").notNull().references((): AnyPgColumn => tags.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.newsletterId, table.tagId],
  }),
]);

/** `tags` table — a self-referencing tree. `parentId` NULL means a root tag. */
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable for clean `push`; backfilled at boot.
  slug: text("slug"),
  parentId: uuid("parent_id").references((): AnyPgColumn => tags.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
  editableOnCard: boolean("editable_on_card").notNull().default(false),
  /** When `true`, no autofill backfill operation will apply this tag to any bookmark. */
  excludeFromBackfill: boolean("exclude_from_backfill").notNull().default(false),
}, table => [
  // Sibling names are unique within a parent. NULL parents are distinct in
  // Postgres, so root-level uniqueness is enforced in the service layer instead.
  // NOTE: a uniqueIndex, NOT a table `unique()` constraint, on purpose. drizzle-kit 0.31.10 cannot
  // converge on a COMPOSITE unique CONSTRAINT — every `push` tries to drop+recreate it, and on the
  // populated `tags` table that recreate fires an interactive "truncate?" suggestion that crashes
  // the non-TTY deploy. A unique INDEX converges and applies without prompting. `migrate.ts`
  // migrates existing DBs from the old constraint to this index. Do not change back to `unique()`.
  uniqueIndex("tags_parent_name_unique").on(table.parentId, table.name),
  // Tag slugs are globally unique so each tag has a stable single-segment URL.
  unique("tags_slug_unique").on(table.slug),
]);

/** `bookmark_tag_blacklist` — tags the user has opted out of autofill auto-apply for a specific bookmark. */
export const bookmarkTagBlacklist = pgTable("bookmark_tag_blacklist", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.tagId],
  }),
]);

/** `bookmark_tags` join — many-to-many between bookmarks and tags. */
export const bookmarkTags = pgTable("bookmark_tags", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.tagId],
  }),
]);

export const tagsRelations = relations(tags, ({
  one, many,
}) => ({
  parent: one(tags, {
    fields: [tags.parentId],
    references: [tags.id],
    relationName: "tag_parent",
  }),
  children: many(tags, {
    relationName: "tag_parent",
  }),
  bookmarkTags: many(bookmarkTags),
}));

/**
 * `genre_moods` table — the "Genres & Moods" taxonomy, a self-referencing tree. `parentId` NULL
 * means a root entry. Many-to-many with bookmarks (and any other owner) via
 * `genre_mood_assignments`. New table + nullable `slug` → push-safe additive.
 */
export const genreMoods = pgTable("genre_moods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable for clean `push`; backfilled at boot.
  slug: text("slug"),
  parentId: uuid("parent_id").references((): AnyPgColumn => genreMoods.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  // Sibling names unique within a parent (a unique INDEX, not a constraint — see the `tags` note).
  uniqueIndex("genre_moods_parent_name_unique").on(table.parentId, table.name),
  unique("genre_moods_slug_unique").on(table.slug),
]);

/**
 * `genre_mood_assignments` — polymorphic M:M linking a Genres & Moods entry to any owner. `ownerType`
 * is one of `GENRE_MOOD_OWNER_TYPES` (a bookmark or a taxonomy entity). A real FK on the value side
 * (cascade), but `ownerId` carries no FK since one table can't reference a dozen owner tables — so
 * owner deletes must clean up their rows in the service layer (mirrors `taxonomy_images`).
 */
export const genreMoodAssignments = pgTable("genre_mood_assignments", {
  genreMoodId: uuid("genre_mood_id").notNull().references(() => genreMoods.id, {
    onDelete: "cascade",
  }),
  ownerType: text("owner_type").notNull(),
  ownerId: uuid("owner_id").notNull(),
}, table => [
  primaryKey({
    columns: [table.genreMoodId, table.ownerType, table.ownerId],
  }),
  index("genre_mood_assignments_owner_idx").on(table.ownerType, table.ownerId),
]);

export const genreMoodsRelations = relations(genreMoods, ({
  one, many,
}) => ({
  parent: one(genreMoods, {
    fields: [genreMoods.parentId],
    references: [genreMoods.id],
    relationName: "genre_mood_parent",
  }),
  children: many(genreMoods, {
    relationName: "genre_mood_parent",
  }),
  assignments: many(genreMoodAssignments),
}));

export const genreMoodAssignmentsRelations = relations(genreMoodAssignments, ({
  one,
}) => ({
  genreMood: one(genreMoods, {
    fields: [genreMoodAssignments.genreMoodId],
    references: [genreMoods.id],
  }),
}));

/**
 * `locations` table — a self-referencing tree of places (city → region → country). `parentId` NULL
 * means a root location. Carries a romanized title + free-form alternate names, an optional
 * coordinate, a map link, and a Google Plus Code. All new columns are additive / push-safe.
 */
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable for clean `push`; backfilled at boot.
  slug: text("slug"),
  // Extra names for different romanization styles.
  alternateNames: jsonb("alternate_names").$type<LocationAlternateName[]>().notNull().default(sql`'[]'::jsonb`),
  latitude: real("latitude"),
  longitude: real("longitude"),
  mapUrl: text("map_url"),
  plusCode: text("plus_code"),
  placeType: text("place_type"),
  countryCode: text("country_code"),
  // GeoJSON area outline (Nominatim polygon), nullable → push-safe additive. Backfilled on demand.
  boundary: jsonb("boundary").$type<LocationBoundary>(),
  // The Wikidata QID this location was resolved from, or null. Nullable → push-safe additive.
  wikidataId: text("wikidata_id"),
  // Official site / Wikipedia links. Nullable free-form URLs → push-safe additive.
  officialLink: text("official_link"),
  wikipediaLinkEn: text("wikipedia_link_en"),
  wikipediaLinkLocal: text("wikipedia_link_local"),
  // Whether lat/long came from Wikidata (gates Nominatim out of future refreshes). Nullable rather
  // than NOT NULL DEFAULT false — a NOT NULL column added to an existing table prompts `push` even
  // with a column default (see CLAUDE.md → Database schema changes); null reads as false.
  usesWikidataCoordinates: boolean("uses_wikidata_coordinates"),
  sortOrder: integer("sort_order").notNull().default(0),
  parentId: uuid("parent_id").references((): AnyPgColumn => locations.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  // Sibling names unique within a parent — a unique INDEX (not a constraint), same rationale as
  // `tags_parent_name_unique`: a composite unique CONSTRAINT can't converge under `drizzle-kit push`.
  uniqueIndex("locations_parent_name_unique").on(table.parentId, table.name),
  unique("locations_slug_unique").on(table.slug),
]);

/** `bookmark_locations` join — many-to-many between bookmarks and locations. */
export const bookmarkLocations = pgTable("bookmark_locations", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  locationId: uuid("location_id").notNull().references(() => locations.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.locationId],
  }),
]);

/** `bookmark_location_blacklist` — locations the user has opted out of autofill auto-apply for a specific bookmark. */
export const bookmarkLocationBlacklist = pgTable("bookmark_location_blacklist", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  locationId: uuid("location_id").notNull().references(() => locations.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.locationId],
  }),
]);

/** `location_tags` join — the "looser" tags (mood / biome / …) associated with a location. */
export const locationTags = pgTable("location_tags", {
  locationId: uuid("location_id").notNull().references(() => locations.id, {
    onDelete: "cascade",
  }),
  tagId: uuid("tag_id").notNull().references((): AnyPgColumn => tags.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.locationId, table.tagId],
  }),
]);

/**
 * `place_types` table — a user-managed vocabulary of place classifications (city, region, country…).
 * The slug is the stored value in `locations.placeType` (no FK). Nullable slug for push-safe
 * addition; backfilled at boot via `seedPlaceTypesFromLocations()`.
 */
export const placeTypes = pgTable("place_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("place_types_name_unique").on(table.name),
  unique("place_types_slug_unique").on(table.slug),
]);

export type PlaceTypeRow = typeof placeTypes.$inferSelect;

export const locationsRelations = relations(locations, ({
  one, many,
}) => ({
  parent: one(locations, {
    fields: [locations.parentId],
    references: [locations.id],
    relationName: "location_parent",
  }),
  children: many(locations, {
    relationName: "location_parent",
  }),
  bookmarkLocations: many(bookmarkLocations),
  locationTags: many(locationTags),
}));

/**
 * `bookmark_relationships` — typed edges between bookmarks. Each edge carries a `relationshipType`
 * and an optional free-text `label`. For SYMMETRIC types the pair is canonicalized
 * (`bookmarkAId < bookmarkBId`, enforced in the service layer) so it's stored once and reads the
 * same from either side; for DIRECTIONAL types the order encodes direction — `bookmarkAId` is the
 * parent/source and `bookmarkBId` is the child/target. A surrogate `id` PK plus a unique index on
 * `(bookmarkAId, bookmarkBId, relationshipTypeId)` lets a pair carry more than one typed edge while
 * preventing duplicates. All FKs cascade on delete.
 */
export const bookmarkRelationships = pgTable("bookmark_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookmarkAId: uuid("bookmark_a_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  bookmarkBId: uuid("bookmark_b_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  relationshipTypeId: uuid("relationship_type_id").notNull().references(() => relationshipTypes.id, {
    onDelete: "cascade",
  }),
  // Optional, more specific free-text label for this edge (e.g. "sequel", "same person").
  label: text("label"),
}, table => [
  unique("bookmark_relationships_pair_type_unique").on(
    table.bookmarkAId,
    table.bookmarkBId,
    table.relationshipTypeId,
  ),
]);

export const bookmarksRelations = relations(bookmarks, ({
  one, many,
}) => ({
  category: one(categories, {
    fields: [bookmarks.categoryId],
    references: [categories.id],
  }),
  website: one(websites, {
    fields: [bookmarks.websiteId],
    references: [websites.id],
  }),
  mediaType: one(mediaTypes, {
    fields: [bookmarks.mediaTypeId],
    references: [mediaTypes.id],
  }),
  youtubeChannel: one(youtubeChannels, {
    fields: [bookmarks.youtubeChannelId],
    references: [youtubeChannels.id],
  }),
  newsletter: one(newsletters, {
    fields: [bookmarks.newsletterId],
    references: [newsletters.id],
  }),
  import: one(imports, {
    fields: [bookmarks.importId],
    references: [imports.id],
  }),
  bookmarkTags: many(bookmarkTags),
  bookmarkLocations: many(bookmarkLocations),
  bookmarkPeople: many(bookmarkPeople),
  bookmarkGroups: many(bookmarkGroups),
  images: many(bookmarkImages),
  relationsA: many(bookmarkRelationships, {
    relationName: "bookmark_relation_a",
  }),
  relationsB: many(bookmarkRelationships, {
    relationName: "bookmark_relation_b",
  }),
}));

export const mediaTypesRelations = relations(mediaTypes, ({
  one, many,
}) => ({
  bookmarks: many(bookmarks),
  parent: one(mediaTypes, {
    fields: [mediaTypes.parentId],
    references: [mediaTypes.id],
    relationName: "media_type_parent",
  }),
  children: many(mediaTypes, {
    relationName: "media_type_parent",
  }),
}));

export const languagesRelations = relations(languages, ({
  many,
}) => ({
  bookmarks: many(bookmarks),
}));

export const youtubeChannelsRelations = relations(youtubeChannels, ({
  one,
  many,
}) => ({
  bookmarks: many(bookmarks),
  category: one(categories, {
    fields: [youtubeChannels.categoryId],
    references: [categories.id],
  }),
  channelTags: many(youtubeChannelTags),
}));

export const newslettersRelations = relations(newsletters, ({
  one,
  many,
}) => ({
  bookmarks: many(bookmarks),
  category: one(categories, {
    fields: [newsletters.categoryId],
    references: [categories.id],
  }),
  newsletterTags: many(newsletterTags),
}));

export const bookmarkImagesRelations = relations(bookmarkImages, ({
  one,
}) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkImages.bookmarkId],
    references: [bookmarks.id],
  }),
}));

export const websitesRelations = relations(websites, ({
  one,
  many,
}) => ({
  bookmarks: many(bookmarks),
  category: one(categories, {
    fields: [websites.categoryId],
    references: [categories.id],
  }),
  websiteTags: many(websiteTags),
}));

export const mediaObjectsRelations = relations(mediaObjects, ({
  one,
}) => ({
  bookmark: one(bookmarks, {
    fields: [mediaObjects.bookmarkId],
    references: [bookmarks.id],
  }),
}));

export const bookmarkTagsRelations = relations(bookmarkTags, ({
  one,
}) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkTags.bookmarkId],
    references: [bookmarks.id],
  }),
  tag: one(tags, {
    fields: [bookmarkTags.tagId],
    references: [tags.id],
  }),
}));

export const bookmarkRelationshipsRelations = relations(bookmarkRelationships, ({
  one,
}) => ({
  bookmarkA: one(bookmarks, {
    fields: [bookmarkRelationships.bookmarkAId],
    references: [bookmarks.id],
    relationName: "bookmark_relation_a",
  }),
  bookmarkB: one(bookmarks, {
    fields: [bookmarkRelationships.bookmarkBId],
    references: [bookmarks.id],
    relationName: "bookmark_relation_b",
  }),
}));

/** `custom_properties` table — user-defined fields that become dynamic bookmark filters. */
export const customProperties = pgTable("custom_properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable at the DB level so `drizzle-kit push`
  // applies cleanly to existing rows; the service layer backfills it at boot and always returns a
  // slug on the wire type.
  slug: text("slug"),
  // "number" | "boolean" | "calculate" | "datetime" — kept as text so new kinds can be added later.
  type: text("type").notNull(),
  // The built-in "Video Length" property; built-ins cannot be renamed, retyped, or deleted.
  builtIn: boolean("built_in").notNull().default(false),
  // How a number/calculate value is rendered: "plain" (default) or "duration" (seconds → H:MM:SS).
  // Nullable/text so it's an additive, push-safe column and new formats can be added later.
  numberFormat: text("number_format"),
  // What a `datetime` property captures: "date" | "time" | "datetime". NULL for non-datetime types.
  // Nullable/text so it's an additive, push-safe column.
  dateTimeFormat: text("date_time_format"),
  // Half-width of the `value ± range` quick-filter window for `number`/`datetime` props, in the
  // value's own units (seconds for duration/datetime). NULL = exact-value match. Nullable/additive.
  quickFilterRange: real("quick_filter_range"),
  // Free-text description surfaced as a hint where the property's field is rendered.
  description: text("description"),
  // Range-slider bounds for a `number`/`calculate` property; NULL means no bound / derive from data.
  numberMin: real("number_min"),
  numberMax: real("number_max"),
  // Optional unit labels for a `number`/`calculate` value (e.g. "star"/"stars").
  unitSingular: text("unit_singular"),
  unitPlural: text("unit_plural"),
  // Optional prefix shown before a value (e.g. "$"), and labels for the 0 and max ("no limit") values.
  valuePrefix: text("value_prefix"),
  zeroLabel: text("zero_label"),
  maxLabel: text("max_label"),
  // Form placement: showInForm = main area vs. Advanced section (only when not hidden);
  // hiddenFromForm = not shown in the bookmark form at all.
  showInForm: boolean("show_in_form").notNull().default(false),
  hiddenFromForm: boolean("hidden_from_form").notNull().default(false),
  // When true, the property's value is shown on bookmark cards in listings.
  showInListings: boolean("show_in_listings").notNull().default(true),
  // image/file-specific. When true, an image property's uploaded objects count toward the Gallery /
  // storage quota manifest. NOT NULL DEFAULT true → pre-applied in migrate.ts to keep push additive.
  showInGallery: boolean("show_in_gallery").notNull().default(true),
  // image/file-specific. When true, the property's value renders on the bookmark detail page.
  // NOT NULL DEFAULT true → pre-applied in migrate.ts to keep push additive.
  showInDetails: boolean("show_in_details").notNull().default(true),
  // When true, the property applies to every category, including ones created later.
  allCategories: boolean("all_categories").notNull().default(false),
  // When true, the property applies to every media type, including ones created later.
  // NOT NULL on the populated `custom_properties` table → pre-applied in migrate.ts to keep push additive.
  allMediaTypes: boolean("all_media_types").notNull().default(false),
  // When true, the property's value can be edited inline from a bookmark card's "More" menu.
  editableOnCard: boolean("editable_on_card").notNull().default(false),
  // When true, the property appears in the CMD+K command palette for inline editing.
  editableViaCmdk: boolean("editable_via_cmdk").notNull().default(false),
  // When true, the property appears in the Inbox pre-fill defaults box. Nullable/additive (push-safe).
  enabledInInbox: boolean("enabled_in_inbox"),
  // When false, the property is globally inactive: hidden from filters, conditions, category
  // assignment, and the bookmark form. Existing rows default to true via the column default.
  enabled: boolean("enabled").notNull().default(true),
  // When false, this property is hidden from the category defaults editor.
  allowDefault: boolean("allow_default").notNull().default(true),
  // Boolean value-formatting. "yes-no" | "true-false" | "enabled-disabled" | "icons" | "stars" |
  // "custom". null → "yes-no". The per-card display knobs (show-if-false, hide-label, clickable,
  // colon, value-before-label) moved to the Card Display Rule field placements (`CardFieldPlacement`).
  booleanLabelPreset: text("boolean_label_preset"),
  // Custom labels used only when booleanLabelPreset = "custom".
  booleanTrueLabel: text("boolean_true_label"),
  booleanFalseLabel: text("boolean_false_label"),
  // Rating-scale display settings. All nullable (additive, push-safe). Ratings store their value
  // in `bookmark_number_values` like numbers, so only this config is rating-specific.
  // ratingMax: 3 | 5 (null → 5). ratingAllowZero/Half/ShowLabel: null → false. ratingLabel after stars.
  ratingMax: integer("rating_max"),
  ratingAllowZero: boolean("rating_allow_zero"),
  ratingAllowHalf: boolean("rating_allow_half"),
  ratingShowLabel: boolean("rating_show_label"),
  ratingLabel: text("rating_label"),
  // Optional group this property belongs to; grouped properties render together. Nullable + set-null
  // on delete so it's a push-safe additive column and deleting a group simply un-groups its members.
  propertyGroupId: uuid("property_group_id").references(() => propertyGroups.id, {
    onDelete: "set null",
  }),
  // choices-type config (all nullable → push-safe additive columns for non-choices properties).
  // choicesItems: the property's defined selectable options, stored as a ChoicesItem[] JSON array.
  // choicesDisplay: "checkbox" | "radio" | "combobox" | "dropdown" — how the field renders.
  // choicesMultiple: when true, the user may select more than one value per bookmark.
  choicesItems: jsonb("choices_items"),
  choicesDisplay: text("choices_display"),
  choicesMultiple: boolean("choices_multiple"),
  // itemInItems-type config (all nullable → push-safe additive columns for non-itemInItems properties).
  // Text segments wrapping the two numbers: {beforeText}{current}{betweenText}{total}{afterText}.
  itemInItemsBeforeText: text("item_in_items_before_text"),
  itemInItemsBetweenText: text("item_in_items_between_text"),
  itemInItemsAfterText: text("item_in_items_after_text"),
  // sections-type config (all nullable → push-safe additive columns).
  sectionsDefaultType: text("sections_default_type"),
  sectionsAllowedTypes: jsonb("sections_allowed_types"),
  // DEPRECATED: corner placement + overlay styling moved to card_display_rules.field_zones. These
  // columns are retained (no longer read/written) so the boot backfill can migrate their values into
  // the Default rule on first boot and so drizzle-kit push stays additive-only. Drop in a follow-up.
  cardImageCorner: text("card_image_corner"),
  cardImageCornerScale: real("card_image_corner_scale"),
  cardImageCornerMobileScale: real("card_image_corner_mobile_scale"),
  cardImageCornerHideLabel: boolean("card_image_corner_hide_label"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("custom_properties_slug_unique").on(table.slug),
]);

/** `bookmark_number_values` — one numeric value per (bookmark, number/calculate property). */
export const bookmarkNumberValues = pgTable("bookmark_number_values", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  value: real("value").notNull(),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.propertyId],
  }),
]);

/** `bookmark_boolean_values` — one true/false value per (bookmark, boolean property). */
export const bookmarkBooleanValues = pgTable("bookmark_boolean_values", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  value: boolean("value").notNull(),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.propertyId],
  }),
]);

/** `bookmark_datetime_values` — one date/time value per (bookmark, datetime property). */
export const bookmarkDateTimeValues = pgTable("bookmark_datetime_values", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  // Canonical string encoding for the property's DateTimeFormat:
  // "YYYY-MM-DD" | "HH:MM" | "YYYY-MM-DDTHH:MM" (chosen so it sorts lexicographically).
  value: text("value").notNull(),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.propertyId],
  }),
]);

/**
 * `bookmark_file_values` — one image/file value per (bookmark, image/file property). Mirrors
 * `bookmark_images`: the bytes live in object storage; this table holds only metadata. The composite
 * PK `(bookmarkId, propertyId)` makes a replace an upsert, and both FKs cascade so the row vanishes
 * when its bookmark or property is deleted (the object becomes a Gallery orphan, as bookmark images do).
 */
export const bookmarkFileValues = pgTable("bookmark_file_values", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  // Object-storage key the bytes are stored under, e.g. "property-files/<bookmarkId>/<propertyId>.webp".
  objectKey: text("object_key").notNull(),
  // MIME type: "image/webp" after the resize/encode pipeline for `image`, the original type for `file`.
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  // Original upload filename (used for `file` downloads); nullable.
  originalFilename: text("original_filename"),
  // Pixel dimensions — set for `image` values, NULL for `file` values.
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.propertyId],
  }),
]);

/**
 * `bookmark_choices_values` — selected option values for a `choices` custom property on a bookmark.
 * `values` is a JSON array of selected choice value slugs from the property's `choicesItems`.
 * The composite PK `(bookmarkId, propertyId)` makes a replace an upsert, and both FKs cascade so
 * the row vanishes when its bookmark or property is deleted.
 */
export const bookmarkChoicesValues = pgTable("bookmark_choices_values", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  // JSON array of selected choice value slugs, e.g. ["reading", "shortlist"].
  values: jsonb("values").notNull(),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.propertyId],
  }),
]);

/**
 * `bookmark_progress_values` — the `current` and `total` counts for an `itemInItems` custom
 * property on a bookmark (e.g. "10 of 100 pages"). The composite PK makes upsert idempotent;
 * both FKs cascade so the row vanishes when its bookmark or property is deleted.
 */
export const bookmarkProgressValues = pgTable("bookmark_progress_values", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  current: real("current").notNull(),
  total: real("total").notNull(),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.propertyId],
  }),
]);

/**
 * `bookmark_sections_values` — section entries list + exhaustive flag per (bookmark, sections property).
 */
export const bookmarkSectionsValues = pgTable("bookmark_sections_values", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  exhaustive: boolean("exhaustive").notNull().default(false),
  sections: jsonb("sections").notNull().default([]),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.propertyId],
  }),
]);

/**
 * `bookmark_text_values` — plain-text value per (bookmark, text property).
 */
export const bookmarkTextValues = pgTable("bookmark_text_values", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  value: text("value").notNull(),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.propertyId],
  }),
]);

/**
 * `calculate_property_operands` — for a `calculate` property, the `number` properties
 * whose values are summed to produce it. `propertyId` is the calculate property.
 */
export const calculatePropertyOperands = pgTable("calculate_property_operands", {
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  operandPropertyId: uuid("operand_property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.propertyId, table.operandPropertyId],
  }),
]);

/** `categories` table — named groups that own bookmarks and group custom properties. */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable at the DB level so
  // `drizzle-kit push` applies cleanly to existing rows; the service layer
  // backfills it at boot and always returns a slug on the wire type.
  slug: text("slug"),
  description: text("description"),
  // Lucide icon name (e.g. "Star"); NULL falls back to a default icon in the UI.
  icon: text("icon"),
  // The built-in "Default" category; built-ins cannot be renamed or deleted.
  builtIn: boolean("built_in").notNull().default(false),
  // Whether bookmarks in this category appear on the homepage.
  isHomepage: boolean("is_homepage").notNull().default(false),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("categories_name_unique").on(table.name),
  unique("categories_slug_unique").on(table.slug),
]);

/**
 * `category_root_tags` — per-category allowlist of enabled root tags. A category with no
 * rows enables all root tags; otherwise only the listed root tags (and their subtrees)
 * are offered when tagging a bookmark in that category.
 */
export const categoryRootTags = pgTable("category_root_tags", {
  categoryId: uuid("category_id").notNull().references(() => categories.id, {
    onDelete: "cascade",
  }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.categoryId, table.tagId],
  }),
]);

/**
 * `homepage_tags` — tags selected (in Settings → Categories) to surface their bookmarks on
 * the homepage. A bookmark appears on the homepage if it carries one of these tags (or a
 * descendant), unioned with bookmarks in homepage categories.
 */
export const homepageTags = pgTable("homepage_tags", {
  tagId: uuid("tag_id").primaryKey().references(() => tags.id, {
    onDelete: "cascade",
  }),
});

/**
 * `homepage_filter` — the single global condition tree that decides which bookmarks appear on
 * the homepage. Exactly one row (id = 1). This supersedes the older `homepage_tags` +
 * `categories.is_homepage` mechanism, which is now read only to seed this row on first boot.
 */
export const homepageFilter = pgTable("homepage_filter", {
  id: integer("id").primaryKey().default(1),
  conditions: jsonb("conditions").$type<ConditionTree>().notNull(),
});

/**
 * `app_settings` — global application settings singleton (exactly one row, id = 1). Seeded on boot.
 */
export const appSettings = pgTable("app_settings", {
  id: integer("id").primaryKey().default(1),
  // Generic URL-shortener domains (e.g. bit.ly) that can't be expanded to a vendor; always nudge.
  shortenerIgnoreList: jsonb("shortener_ignore_list").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // Domains whose redirect chains should never be followed (e.g. docs.google.com). The redirect
  // resolver skips these when scanning a bookmark URL or processing newsletter imports.
  redirectIgnoreList: jsonb("redirect_ignore_list").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // User-defined query params to strip in addition to TRACKING_PARAMS (e.g. "ref", "source").
  customStripParams: jsonb("custom_strip_params").$type<string[]>(),
  // Imports blacklist: links matching these entries are dropped from future imports. NOT NULL on the
  // populated app_settings table → pre-applied in migrate.ts to keep push additive (renamed from
  // `newsletter_blacklist` via a guarded migrate.ts step; see the ADD COLUMN / RENAME steps).
  importBlacklist: jsonb("import_blacklist").$type<ImportBlacklistEntry[]>().notNull().default(sql`'[]'::jsonb`),
  // Markdown rendered at the top of the homepage.
  homepageText: text("homepage_text").notNull().default(""),
  // Desktop width of the homepage text block: "full" | "half".
  homepageTextWidth: text("homepage_text_width").notNull().default("full"),
  // When true, the Bookmark Quick Add form appears on the homepage.
  bookmarkQuickAddEnabled: boolean("bookmark_quick_add_enabled").notNull().default(false),
  // Desktop width of the homepage Quick Add block: "full" | "half".
  bookmarkQuickAddWidth: text("bookmark_quick_add_width").notNull().default("full"),
  // How the homepage Quick Add form is presented: "collapsible" | "expanded".
  bookmarkQuickAddDisplay: text("bookmark_quick_add_display").notNull().default("collapsible"),
  // When true, the default "Homepage" title and description are hidden on the homepage.
  homepageHeaderHidden: boolean("homepage_header_hidden").notNull().default(false),
  // When false, the homepage text block is hidden even if homepage_text is non-empty.
  homepageTextEnabled: boolean("homepage_text_enabled").notNull().default(true),
  // When on, the left sidebar shows a link to the Coolify instance (opens in a new tab).
  coolifyLinkEnabled: boolean("coolify_link_enabled").notNull().default(false),
  // URL of the Coolify instance shown in the sidebar when coolify_link_enabled is on.
  coolifyUrl: text("coolify_url").notNull().default(""),
  // When on, the left sidebar shows a link to the Swagger/OpenAPI docs at /docs.
  docsLinkEnabled: boolean("docs_link_enabled").notNull().default(false),
  // When on, the left sidebar shows a link to the Storybook UI at /storybook.
  storybookLinkEnabled: boolean("storybook_link_enabled").notNull().default(false),
  // When on, the left sidebar shows a link to the Drizzle Gateway instance (opens in a new tab).
  drizzleGatewayLinkEnabled: boolean("drizzle_gateway_link_enabled").notNull().default(false),
  // URL of the Drizzle Gateway instance shown in the sidebar when drizzle_gateway_link_enabled is on.
  drizzleGatewayUrl: text("drizzle_gateway_url").notNull().default(""),
  // When on, the left sidebar shows a link to the GitHub repository (opens in a new tab).
  githubLinkEnabled: boolean("github_link_enabled").notNull().default(false),
  // --- Sidebar customization (group A): which left-sidebar items/groups are hidden. ---
  // Category IDs hidden in the left sidebar. Empty = all visible.
  hiddenCategoryIds: jsonb("hidden_category_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // Category IDs shown under "See More" in the left sidebar (not hidden outright).
  seeMoreCategoryIds: jsonb("see_more_category_ids").$type<string[]>(),
  // Taxonomy item keys hidden in the left sidebar.
  hiddenTaxonomyItems: jsonb("hidden_taxonomy_items").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // Taxonomy item keys shown under "See More" in the left sidebar (not hidden outright).
  seeMoreTaxonomyItems: jsonb("see_more_taxonomy_items").$type<string[]>(),
  // Customization item keys hidden in the left sidebar.
  hiddenCustomizationItems: jsonb("hidden_customization_items").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // Customization item keys shown under "See More" in the left sidebar (not hidden outright).
  seeMoreCustomizationItems: jsonb("see_more_customization_items").$type<string[]>(),
  // Management item keys hidden in the left sidebar.
  hiddenManagementItems: jsonb("hidden_management_items").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // Group keys for entire sidebar sections that are disabled.
  hiddenSidebarGroups: jsonb("hidden_sidebar_groups").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // Connector link-out keys hidden from the sidebar's Connectors section. Nullable (read as `?? []`).
  hiddenConnectorLinks: jsonb("hidden_connector_links").$type<string[]>(),
  // Connector link-out keys shown under "See More" in the Connectors section. Nullable (read as `?? []`).
  seeMoreConnectorLinks: jsonb("see_more_connector_links").$type<string[]>(),
  // --- Automation & behavior (group B). ---
  // When on, blurring the bookmark URL field auto-fetches the page title.
  autoFetchTitle: boolean("auto_fetch_title").notNull().default(true),
  // When on, the Add Bookmark Images section starts collapsed and the page image is fetched on save.
  autoFetchImage: boolean("auto_fetch_image").notNull().default(true),
  // When on, saving a bookmark whose title contains a tag's name auto-applies that tag.
  autoApplyTitleTags: boolean("auto_apply_title_tags").notNull().default(false),
  // When on, saving a bookmark whose title contains a location's name auto-applies that location.
  // Nullable (no NOT NULL) so `drizzle-kit push` applies it without an interactive prompt; the
  // service reads it as `?? false`.
  autoApplyTitleLocations: boolean("auto_apply_title_locations"),
  // Modifier held while clicking Edit to open the item in the drawer: "alt" | "ctrl" | "shift" | "meta".
  sidebarOpenModifier: text("sidebar_open_modifier").notNull().default("alt"),
  // --- Display & detail preferences (group C). ---
  // Bookmark detail image size: "small" | "medium" | "large".
  bookmarkDetailImageSize: text("bookmark_detail_image_size").notNull().default("medium"),
  // Bookmark detail video size: "standard" | "half" | "twoThirds" | "fullwidth".
  bookmarkDetailVideoSize: text("bookmark_detail_video_size").notNull().default("standard"),
  // Bookmark detail layout: "single" | "tabbed".
  bookmarkDetailLayout: text("bookmark_detail_layout").notNull().default("single"),
  // Interface language: "en" | "ja".
  interfaceLanguage: text("interface_language").notNull().default("en"),
  // When true, listing pages open filters in the right-hand drawer by default.
  filtersInDrawer: boolean("filters_in_drawer").notNull().default(false),
  // When true, the left filter rail is hidden on listing pages.
  filtersHidden: boolean("filters_hidden").notNull().default(false),
  // When true, the right-hand panel docks as a persistent column by default.
  panelPinned: boolean("panel_pinned").notNull().default(false),
  // Viewport widths (px) below which the drawer floats even when pinned. Default [768].
  drawerUnpinnedBreakpoints: jsonb("drawer_unpinned_breakpoints").$type<number[]>().notNull().default(sql`'[768]'::jsonb`),
  // Width component of the built-in "Cropped" aspect ratio (default 16).
  croppedWidth: integer("cropped_width").notNull().default(16),
  // Height component of the built-in "Cropped" aspect ratio (default 9).
  croppedHeight: integer("cropped_height").notNull().default(9),
  // Per-type icon overrides for the Custom Properties listing. Null = all defaults.
  customPropertyTypeIcons: jsonb("custom_property_type_icons").$type<Record<string, string>>(),
  // Filter facet keys / custom-property ids that are NOT shown by default in the filter rail
  // (added on demand via the "Add filter" control). Null/[] = every filter shows by default.
  onDemandFilters: jsonb("on_demand_filters").$type<string[]>(),
  // Language to assume for Han-only (no-kana) names, which are ambiguous Japanese vs. Chinese:
  // "ja" | "zh". Nullable so `drizzle-kit push` stays additive; the resolver defaults it to "ja".
  hanScriptLanguage: text("han_script_language"),
  // Prompt text used to instruct an AI to summarize bookmarks in the AI Summary Queue.
  aiSummarizationPrompt: text("ai_summarization_prompt").notNull().default(""),
  // Hosted metadata provider (Microlink-compatible) configured from Settings → Connectors.
  // Nullable = push-safe additive; env vars are used as fallback when these are null.
  hostedMetadataEndpoint: text("hosted_metadata_endpoint"),
  // API key for the hosted metadata provider; stored encrypted when APP_SECRET is configured.
  hostedMetadataApiKey: text("hosted_metadata_api_key"),
  hostedMetadataProvider: text("hosted_metadata_provider"),
  // ArchiveBox base URL configured from Settings → Connectors. Nullable = push-safe additive;
  // ARCHIVEBOX_ENDPOINT env var is used as fallback when null.
  archiveBoxEndpoint: text("archive_box_endpoint"),
  // Kavita base URL configured from Settings → Connectors. Nullable = push-safe additive;
  // KAVITA_ENDPOINT env var is used as fallback when null.
  kavitaEndpoint: text("kavita_endpoint"),
  // API key for the Kavita server; stored encrypted when APP_SECRET is configured.
  // KAVITA_API_KEY env var is used as fallback when null.
  kavitaApiKey: text("kavita_api_key"),
  // Plex base URL configured from Settings → Connectors. Nullable = push-safe additive;
  // PLEX_ENDPOINT env var is used as fallback when null.
  plexEndpoint: text("plex_endpoint"),
  // X-Plex-Token for the Plex server; stored encrypted when APP_SECRET is configured.
  // PLEX_TOKEN env var is used as fallback when null.
  plexToken: text("plex_token"),
  // API key for the YouTube Data API v3, configured from Settings → Connectors; stored encrypted
  // when APP_SECRET is configured. Nullable = push-safe additive; the YOUTUBE_API_KEY env var is
  // used as fallback when null.
  youtubeApiKey: text("youtube_api_key"),
  // Image-URL blacklist (Settings → Connectors): patterns that exclude matching candidate images
  // from a URL scan. Display/scan-only, never touches the bookmark cache. Nullable = push-safe
  // additive; the service reads `?? []`.
  imageUrlBlacklist: jsonb("image_url_blacklist").$type<string[]>(),
  // Per-Nominatim-placeType map display config (Settings → Locations + the map "Levels" overlay):
  // a sparse Record<placeTypeKey, { displayMode: "pin"|"area", visible, sortOrder }>. Display-only,
  // so it never touches the bookmark cache. Nullable = push-safe additive; the service reads `?? {}`.
  placeTypeDisplay: jsonb("place_type_display").$type<PlaceTypeDisplayConfig>(),
  // Named "level" groups of Nominatim place types (Settings → Locations + the map "Levels" overlay):
  // an ordered array of { id, name, placeTypes[], displayMode, visible, sortOrder }. The source of
  // truth the UI edits; the per-placeType display config the map/sort consume is derived from it.
  // Display-only, so it never touches the bookmark cache. Nullable = push-safe additive.
  placeTypeLevelGroups: jsonb("place_type_level_groups").$type<PlaceTypeLevelGroupConfig>(),
  // Per-Nominatim-placeType map-pin icon overrides (Settings → Locations "Place Type Icons"):
  // a sparse Record<placeTypeKey, lucideIconName>. Configured per place type (not per level group)
  // so types in one group can differ. Display-only, never touches the bookmark cache. Nullable =
  // push-safe additive; the service reads `?? {}`.
  placeTypeIcons: jsonb("place_type_icons").$type<PlaceTypeIconConfig>(),
  // Per-Nominatim-placeType map color overrides (Settings → Locations "Pin Style"): a sparse
  // Record<placeTypeKey, "#rrggbb">. Configured per place type (not per level group) so types in one
  // group can render in distinct colors; resolved override-wins over the group color. Display-only,
  // never touches the bookmark cache. Nullable = push-safe additive; the service reads `?? {}`.
  placeTypeColors: jsonb("place_type_colors").$type<PlaceTypeColorConfig>(),
  // Minimum area (km²) an "area"-mode location's boundary must have to still render as a polygon on
  // the map; smaller boundaries render as a pin instead. 0/null disables the threshold. Nullable =
  // push-safe additive; the service reads `?? 0`.
  minAreaPinThresholdKm2: real("min_area_pin_threshold_km2"),
  // How many bookmarks to show per page on listing pages. Nullable = push-safe additive; the
  // service clamps to a positive integer and falls back to the default (25) when null.
  bookmarksPerPage: integer("bookmarks_per_page"),
  // Scale factor applied to every rendered map pin's size (1 = default size). Nullable = push-safe
  // additive; the service clamps to [MAP_PIN_SCALE_MIN, MAP_PIN_SCALE_MAX] and falls back to 1 when null.
  mapPinScale: real("map_pin_scale"),
  // Default values pre-filled into the "Page screenshot" controls on a bookmark's Edit → Image tab
  // (Settings → Media → Screenshot Defaults). Nullable = push-safe additive; the service clamps and
  // falls back to the hardcoded capture defaults (no delay, 1280x720, no scroll) when null.
  screenshotDefaultDelayMs: integer("screenshot_default_delay_ms"),
  screenshotDefaultWidth: integer("screenshot_default_width"),
  screenshotDefaultHeight: integer("screenshot_default_height"),
  screenshotDefaultScrollDistance: integer("screenshot_default_scroll_distance"),
  // --- Add Bookmark form field placement (Settings → Display → Add Bookmark Form). ---
  // Standard field keys placed in the collapsible Advanced section. Nullable = push-safe additive;
  // the service reads `?? DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.advancedFields` (a stored `[]` is a
  // valid value and is NOT treated as unset).
  bookmarkFormAdvancedFields: jsonb("bookmark_form_advanced_fields").$type<string[]>(),
  // Standard field keys hidden from the Add Bookmark form entirely. Nullable = push-safe additive;
  // same `?? default` / stored-`[]`-is-valid rule as above.
  bookmarkFormHiddenFields: jsonb("bookmark_form_hidden_fields").$type<string[]>(),
  // Placement ("default" | "advanced" | "hidden") per built-in detail custom-property slug, keyed by
  // slug. Nullable = push-safe additive; the service merges this over
  // `DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.builtInPropertyPlacements` so a future built-in that defaults
  // to hidden stays hidden for users with a saved settings row that predates it.
  bookmarkFormBuiltInPlacements: jsonb("bookmark_form_built_in_placements").$type<Record<string, string>>(),
  // Placement ("default" | "advanced" | "hidden") per standard field, keyed by field. Nullable =
  // push-safe additive. The service merges this over
  // `DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.standardFieldPlacements` so a newly-added standard field
  // inherits its default (e.g. hidden) for users with a saved settings row that predates it. This
  // replaces the legacy `bookmarkFormAdvancedFields`/`bookmarkFormHiddenFields` arrays above, which
  // are kept only so an existing row's choices can be derived on first read (see the service).
  bookmarkFormStandardPlacements: jsonb("bookmark_form_standard_placements").$type<Record<string, string>>(),
});

/**
 * `homepage_sections` — user-defined, ordered sections that appear on the homepage. Each section
 * has its own condition filter; bookmarks matching that filter are shown under the section's title
 * and description. `sort_order` controls the display sequence.
 */
export const homepageSections = pgTable("homepage_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  conditions: jsonb("conditions").$type<ConditionTree>().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  hideIfEmpty: boolean("hide_if_empty").notNull().default(false),
  columns: integer("columns").notNull().default(2),
  imageMode: boolean("image_mode").notNull().default(true),
  imageCropMode: text("image_crop_mode"),
  imageLayout: text("image_layout").notNull().default("above"),
  imageVisibility: text("image_visibility").notNull().default("shown"),
  viewMode: text("view_mode").notNull().default("cards"),
  // Per-zone field placements for this section's cards (card-body sub-zones + image corners). NULL =
  // fall back to the Default card display rule (legacy sections); concrete once edited. Supersedes
  // hidden_card_fields + corner_overlays. Nullable jsonb = push-safe additive.
  fieldZones: jsonb("field_zones").$type<CardFieldZones>(),
  // Per-body-zone layout (flex vs grid). NULL = fall back to defaults. Nullable jsonb = push-safe.
  cardZoneLayouts: jsonb("card_zone_layouts").$type<CardZoneLayouts>(),
  hiddenCardFields: jsonb("hidden_card_fields").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // When true, custom properties placed in an image corner are overlaid on this section's card
  // images; when false they fall back to badges. NOT NULL on the populated table → pre-applied in
  // migrate.ts to keep push additive.
  cornerOverlays: boolean("corner_overlays").notNull().default(true),
  // When true, the website pill is hidden on this section's cards for a bookmark that also has a
  // YouTube channel. Owned per-section so homepage cards never fall back to the Default card display
  // rule. NOT NULL DEFAULT false on the populated table → pre-applied in migrate.ts to keep push additive.
  hideWebsiteForYouTube: boolean("hide_website_for_youtube").notNull().default(false),
  // Bookmark ordering for this section (matches the Listings page Sort control), or NULL for the
  // default order. Applied client-side. Nullable jsonb = push-safe additive.
  sort: jsonb("sort").$type<BookmarkSort>(),
  // Maximum number of bookmarks to show in this section, applied client-side after sorting, or NULL
  // for no limit. Nullable integer = push-safe additive.
  bookmarkLimit: integer("bookmark_limit"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

/**
 * `card_display_rules` — prioritized rules that override per-card display for bookmarks matching a
 * `conditions` tree. Resolved client-side at render: for each card the highest-priority matching rule
 * supplies each display attribute (layered merge), falling back to the singleton Default rule
 * (`is_default`, always matches, lowest priority, fully concrete). Display columns are nullable so a
 * non-default rule can leave an attribute to "inherit". Unlike `homepage_sections` there are no
 * `columns`/`view_mode` columns — grid column count and card/table view stay page-level. Push-safe:
 * a brand-new table with nullable display columns.
 */
export const cardDisplayRules = pgTable("card_display_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // Nullable so existing rows are push-safe; backfilled to a unique value on boot.
  slug: text("slug"),
  description: text("description"),
  conditions: jsonb("conditions").$type<ConditionTree>().notNull(),
  // Lower sorts first (higher priority). The Default rule is kept pinned last.
  sortOrder: integer("sort_order").notNull().default(0),
  // The singleton baseline rule: always matches, cannot be deleted, carries concrete display values.
  isDefault: boolean("is_default").notNull().default(false),
  // Display overrides. NULL = inherit (fall through to a lower-priority rule / the Default).
  // Per-zone field placements (card / image corners). A field key absent from all zones is hidden;
  // supersedes hidden_card_fields + the per-property corner columns. Nullable jsonb = push-safe.
  fieldZones: jsonb("field_zones").$type<CardFieldZones>(),
  // Per-body-zone layout (flex vs grid). NULL = inherit. Concrete on the Default rule. Nullable jsonb
  // = push-safe additive.
  cardZoneLayouts: jsonb("card_zone_layouts").$type<CardZoneLayouts>(),
  imageMode: text("image_mode"),
  imageVisibility: text("image_visibility"),
  imageLayout: text("image_layout"),
  hideWebsiteForYouTube: boolean("hide_website_for_youtube"),
  // DEPRECATED: superseded by field_zones (which folds in visibility + corner placement). Retained
  // so the boot backfill can read it and push stays additive-only. Drop in a follow-up.
  hiddenCardFields: jsonb("hidden_card_fields").$type<string[]>(),
  cornerOverlays: boolean("corner_overlays"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("card_display_rules_slug_unique").on(table.slug),
]);

/**
 * `imports` — one row per ingest event (paste / fetched URL / uploaded file). Groups the extracted
 * candidate links (`import_items`) so the Inbox review queue can show "review this import's N links".
 * An import optionally belongs to a newsletter publication (its one source today); later sources
 * (e.g. listicles) reuse the same table with `newsletterId` null. Renamed from `newsletter_imports`
 * via a guarded `migrate.ts` step.
 */
export const imports = pgTable("imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  // "paste" | "url" | "upload" — text so a new ingest source needs no migration (mirrors bookmark_images.source).
  source: text("source").notNull(),
  // Optional human label / uploaded filename for the import.
  title: text("title"),
  // The fetched "view in browser" post URL when source = "url"; NULL otherwise.
  sourceUrl: text("source_url"),
  // The newsletter (taxonomy) this import belongs to, chosen in the import form. Its default
  // category / tags / media type are applied to the bookmarks created on approval. Nullable
  // (push-safe additive); set null when the newsletter is deleted.
  newsletterId: uuid("newsletter_id").references((): AnyPgColumn => newsletters.id, {
    onDelete: "set null",
  }),
  // Default category applied to every link approved from this import (per-item override wins).
  // Nullable FK → push-safe additive, no migrate.ts step.
  defaultCategoryId: uuid("default_category_id").references((): AnyPgColumn => categories.id, {
    onDelete: "set null",
  }),
  // Background-queue status: "queued" | "processing" | "complete" | "failed". Text so new states
  // need no migration (mirrors `source`). Nullable → push-safe additive; NULL = legacy import
  // created before queuing, treated as complete.
  status: text("status"),
  // Live progress filled in by the worker: total links to process and how many are done. Nullable
  // integers → push-safe additive, no migrate.ts step.
  totalCount: integer("total_count"),
  processedCount: integer("processed_count"),
  // Free-text reason when status = "failed" (e.g. the page fetch failed).
  errorReason: text("error_reason"),
  // Accumulated URLs of items that were approved, blocked, or rejected (appended on each transition).
  // Nullable text[] columns → push-safe additive; NULL coalesces to [] in the service layer.
  // Populated so the URL history survives the Import Settings purge and can later drive rule suggestions.
  allowedUrls: text("allowed_urls").array(),
  blockedUrls: text("blocked_urls").array(),
  rejectedUrls: text("rejected_urls").array(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

/**
 * `import_items` — one extracted candidate article link per row, awaiting review in the Inbox.
 * Nothing here is a real bookmark: approving an item creates one via the bookmark service and flags
 * the item for deletion. Staging-only data, so writes here never touch the bookmark evaluation cache.
 * Renamed from `newsletter_import_items` via a guarded `migrate.ts` step.
 */
export const importItems = pgTable("import_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  importId: uuid("import_id").notNull().references(() => imports.id, {
    onDelete: "cascade",
  }),
  // The URL we'll save — the original link after redirect-unwrap + canonicalize. NULL when unwrap
  // failed (the row is kept for review with status = "error").
  url: text("url"),
  // The original (possibly tracker-wrapped) href as extracted from the source.
  rawUrl: text("raw_url").notNull(),
  // Seed title (anchor text, later overwritten by enrichment or a user edit).
  title: text("title"),
  description: text("description"),
  imageUrl: text("image_url"),
  // The surrounding source passage (paragraph + nearest heading) the link was found in. Nullable.
  newsletterContext: text("newsletter_context"),
  // The visible anchor text the link was extracted from.
  anchorText: text("anchor_text"),
  // Per-item category override applied on approval. Nullable FK → push-safe additive.
  categoryId: uuid("category_id").references((): AnyPgColumn => categories.id, {
    onDelete: "set null",
  }),
  // "pending" | "approved" | "rejected" | "duplicate" | "error" | "blocked" — text so new states need no migration.
  status: text("status").notNull().default("pending"),
  // Flagged for deletion once a bookmark has been created from it (or it was blocked). The Import
  // Settings purge sweeps marked-for-deletion + blocked rows. NOT NULL DEFAULT false → pre-applied in
  // migrate.ts to keep push additive (see the ADD COLUMN IF NOT EXISTS step).
  markedForDeletion: boolean("marked_for_deletion").notNull().default(false),
  // When status = "duplicate", the existing bookmark this collided with. `set null` so deleting it
  // doesn't cascade away the staged row.
  duplicateBookmarkId: uuid("duplicate_bookmark_id").references((): AnyPgColumn => bookmarks.id, {
    onDelete: "set null",
  }),
  // When status = "approved", the bookmark created from this item.
  createdBookmarkId: uuid("created_bookmark_id").references((): AnyPgColumn => bookmarks.id, {
    onDelete: "set null",
  }),
  // Free-text reason when status = "error".
  errorReason: text("error_reason"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export const importsRelations = relations(imports, ({
  one,
  many,
}) => ({
  items: many(importItems),
  newsletter: one(newsletters, {
    fields: [imports.newsletterId],
    references: [newsletters.id],
  }),
  bookmarks: many(bookmarks),
}));

export const importItemsRelations = relations(importItems, ({
  one,
}) => ({
  import: one(imports, {
    fields: [importItems.importId],
    references: [imports.id],
  }),
}));

/** `property_categories` join — many-to-many between custom properties and categories. */
export const propertyCategories = pgTable("property_categories", {
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  categoryId: uuid("category_id").notNull().references(() => categories.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.propertyId, table.categoryId],
  }),
]);

/** `property_media_types` join — many-to-many between custom properties and media types. */
export const propertyMediaTypes = pgTable("property_media_types", {
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  mediaTypeId: uuid("media_type_id").notNull().references(() => mediaTypes.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.propertyId, table.mediaTypeId],
  }),
]);

/**
 * `autofill_rules` — user-defined rules that prefill the Add-Bookmark form. A rule matches a
 * bookmark against its `conditions` tree, then applies a category, tags, and custom-property
 * values (stored in the child tables below).
 */
export const autofillRules = pgTable("autofill_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name (e.g. "github-recipes"). Backfilled at boot.
  slug: text("slug"),
  // Optional free-form description shown alongside the rule.
  description: text("description"),
  // The match predicate tree describing when this rule applies. Nullable only during rollout:
  // existing rows are backfilled from the legacy columns below at boot, then the service always
  // writes it.
  conditions: jsonb("conditions").$type<ConditionTree>(),
  // @deprecated Superseded by `conditions`. Kept (nullable) so existing rows can be backfilled
  // before a follow-up migration drops them.
  field: text("field"),
  operator: text("operator"),
  pattern: text("pattern"),
  // The category this rule assigns; NULL means the rule leaves the category alone.
  setCategoryId: uuid("set_category_id").references((): AnyPgColumn => categories.id, {
    onDelete: "set null",
  }),
  // The media type this rule assigns; NULL means the rule leaves the media type alone.
  setMediaTypeId: uuid("set_media_type_id").references((): AnyPgColumn => mediaTypes.id, {
    onDelete: "set null",
  }),
  // Lower sorts first; later (higher) rules win for single-valued targets when several match.
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("autofill_rules_slug_unique").on(table.slug),
]);

/** `autofill_rule_tags` — tiered tags a rule applies to a matching bookmark. */
export const autofillRuleTags = pgTable("autofill_rule_tags", {
  ruleId: uuid("rule_id").notNull().references(() => autofillRules.id, {
    onDelete: "cascade",
  }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.ruleId, table.tagId],
  }),
]);

/** `autofill_rule_locations` — locations a rule applies to a matching bookmark. */
export const autofillRuleLocations = pgTable("autofill_rule_locations", {
  ruleId: uuid("rule_id").notNull().references(() => autofillRules.id, {
    onDelete: "cascade",
  }),
  locationId: uuid("location_id").notNull().references(() => locations.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.ruleId, table.locationId],
  }),
]);

/** `autofill_rule_number_values` — number custom-property values a rule applies. */
export const autofillRuleNumberValues = pgTable("autofill_rule_number_values", {
  ruleId: uuid("rule_id").notNull().references(() => autofillRules.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  value: real("value").notNull(),
}, table => [
  primaryKey({
    columns: [table.ruleId, table.propertyId],
  }),
]);

/** `autofill_rule_boolean_values` — boolean custom-property values a rule applies. */
export const autofillRuleBooleanValues = pgTable("autofill_rule_boolean_values", {
  ruleId: uuid("rule_id").notNull().references(() => autofillRules.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  value: boolean("value").notNull(),
}, table => [
  primaryKey({
    columns: [table.ruleId, table.propertyId],
  }),
]);

/** `autofill_rule_datetime_values` — date/time custom-property values a rule applies. */
export const autofillRuleDateTimeValues = pgTable("autofill_rule_datetime_values", {
  ruleId: uuid("rule_id").notNull().references(() => autofillRules.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  value: text("value").notNull(),
}, table => [
  primaryKey({
    columns: [table.ruleId, table.propertyId],
  }),
]);

/** `autofill_rule_exemptions` — bookmarks the user has opted out of backfill for a specific rule. */
export const autofillRuleExemptions = pgTable("autofill_rule_exemptions", {
  ruleId: uuid("rule_id").notNull().references(() => autofillRules.id, {
    onDelete: "cascade",
  }),
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  primaryKey({
    columns: [table.ruleId, table.bookmarkId],
  }),
]);

/** `import_rules` — ordered rules evaluated against each candidate URL during inbox ingestion. */
export const importRules = pgTable("import_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  conditions: jsonb("conditions").$type<ConditionTree>().notNull(),
  action: text("action").notNull().default("reject"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("import_rules_slug_unique").on(table.slug),
]);

export type ImportRuleRow = typeof importRules.$inferSelect;

/** `category_number_defaults` — default number property values for new bookmarks in a category. */
export const categoryNumberDefaults = pgTable("category_number_defaults", {
  categoryId: uuid("category_id").notNull().references(() => categories.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  value: real("value").notNull(),
}, table => [
  primaryKey({
    columns: [table.categoryId, table.propertyId],
  }),
]);

/** `category_boolean_defaults` — default boolean property values for new bookmarks in a category. */
export const categoryBooleanDefaults = pgTable("category_boolean_defaults", {
  categoryId: uuid("category_id").notNull().references(() => categories.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  value: boolean("value").notNull(),
}, table => [
  primaryKey({
    columns: [table.categoryId, table.propertyId],
  }),
]);

/** `category_datetime_defaults` — default date/time property values for new bookmarks in a category. */
export const categoryDateTimeDefaults = pgTable("category_datetime_defaults", {
  categoryId: uuid("category_id").notNull().references(() => categories.id, {
    onDelete: "cascade",
  }),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  value: text("value").notNull(),
}, table => [
  primaryKey({
    columns: [table.categoryId, table.propertyId],
  }),
]);

export const autofillRulesRelations = relations(autofillRules, ({
  one, many,
}) => ({
  category: one(categories, {
    fields: [autofillRules.setCategoryId],
    references: [categories.id],
  }),
  mediaType: one(mediaTypes, {
    fields: [autofillRules.setMediaTypeId],
    references: [mediaTypes.id],
  }),
  tags: many(autofillRuleTags),
  locations: many(autofillRuleLocations),
  numberValues: many(autofillRuleNumberValues),
  booleanValues: many(autofillRuleBooleanValues),
  dateTimeValues: many(autofillRuleDateTimeValues),
}));

export const customPropertiesRelations = relations(customProperties, ({
  many,
}) => ({
  numberValues: many(bookmarkNumberValues),
  booleanValues: many(bookmarkBooleanValues),
  propertyCategories: many(propertyCategories),
  propertyMediaTypes: many(propertyMediaTypes),
}));

export const categoriesRelations = relations(categories, ({
  many,
}) => ({
  bookmarks: many(bookmarks),
  propertyCategories: many(propertyCategories),
  categoryRootTags: many(categoryRootTags),
  youtubeChannels: many(youtubeChannels),
  websites: many(websites),
}));

export const propertyCategoriesRelations = relations(propertyCategories, ({
  one,
}) => ({
  property: one(customProperties, {
    fields: [propertyCategories.propertyId],
    references: [customProperties.id],
  }),
  category: one(categories, {
    fields: [propertyCategories.categoryId],
    references: [categories.id],
  }),
}));

export const propertyMediaTypesRelations = relations(propertyMediaTypes, ({
  one,
}) => ({
  property: one(customProperties, {
    fields: [propertyMediaTypes.propertyId],
    references: [customProperties.id],
  }),
  mediaType: one(mediaTypes, {
    fields: [propertyMediaTypes.mediaTypeId],
    references: [mediaTypes.id],
  }),
}));

export const categoryRootTagsRelations = relations(categoryRootTags, ({
  one,
}) => ({
  category: one(categories, {
    fields: [categoryRootTags.categoryId],
    references: [categories.id],
  }),
  tag: one(tags, {
    fields: [categoryRootTags.tagId],
    references: [tags.id],
  }),
}));

export const websiteTagsRelations = relations(websiteTags, ({
  one,
}) => ({
  website: one(websites, {
    fields: [websiteTags.websiteId],
    references: [websites.id],
  }),
  tag: one(tags, {
    fields: [websiteTags.tagId],
    references: [tags.id],
  }),
}));

export const youtubeChannelTagsRelations = relations(youtubeChannelTags, ({
  one,
}) => ({
  channel: one(youtubeChannels, {
    fields: [youtubeChannelTags.channelId],
    references: [youtubeChannels.id],
  }),
  tag: one(tags, {
    fields: [youtubeChannelTags.tagId],
    references: [tags.id],
  }),
}));

export const bookmarkNumberValuesRelations = relations(bookmarkNumberValues, ({
  one,
}) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkNumberValues.bookmarkId],
    references: [bookmarks.id],
  }),
  property: one(customProperties, {
    fields: [bookmarkNumberValues.propertyId],
    references: [customProperties.id],
  }),
}));

export const bookmarkBooleanValuesRelations = relations(bookmarkBooleanValues, ({
  one,
}) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkBooleanValues.bookmarkId],
    references: [bookmarks.id],
  }),
  property: one(customProperties, {
    fields: [bookmarkBooleanValues.propertyId],
    references: [customProperties.id],
  }),
}));

export const calculatePropertyOperandsRelations = relations(calculatePropertyOperands, ({
  one,
}) => ({
  property: one(customProperties, {
    fields: [calculatePropertyOperands.propertyId],
    references: [customProperties.id],
    relationName: "calculate_property",
  }),
  operand: one(customProperties, {
    fields: [calculatePropertyOperands.operandPropertyId],
    references: [customProperties.id],
    relationName: "operand_property",
  }),
}));

/**
 * `saved_filters` — named snapshots of bookmark listing filter state that users can apply to any
 * listing page's filter sidebar in one click.
 */
export const savedFilters = pgTable("saved_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug"),
  description: text("description"),
  filters: jsonb("filters").$type<Record<string, unknown>>().notNull(),
  viewableOnline: boolean("viewable_online").notNull().default(false),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("saved_filters_name_unique").on(table.name),
  unique("saved_filters_slug_unique").on(table.slug),
]);

export type BookmarkRow = typeof bookmarks.$inferSelect;
export type NewBookmarkRow = typeof bookmarks.$inferInsert;
export type BookmarkImageRow = typeof bookmarkImages.$inferSelect;
export type NewBookmarkImageRow = typeof bookmarkImages.$inferInsert;
export type BookmarkScreenshotRow = typeof bookmarkScreenshots.$inferSelect;
export type BookmarkReelArchiveRow = typeof bookmarkReelArchives.$inferSelect;
export type ReelArchiveJobRow = typeof reelArchiveJobs.$inferSelect;
export type MediaObjectRow = typeof mediaObjects.$inferSelect;
export type NewMediaObjectRow = typeof mediaObjects.$inferInsert;
export type WebsiteRow = typeof websites.$inferSelect;
export type NewWebsiteRow = typeof websites.$inferInsert;
export type WebsiteFaviconRow = typeof websiteFavicons.$inferSelect;
export type NewWebsiteFaviconRow = typeof websiteFavicons.$inferInsert;
export type MediaTypeRow = typeof mediaTypes.$inferSelect;
export type NewMediaTypeRow = typeof mediaTypes.$inferInsert;
export type LanguageRow = typeof languages.$inferSelect;
export type NewLanguageRow = typeof languages.$inferInsert;
export type PropertyGroupRow = typeof propertyGroups.$inferSelect;
export type NewPropertyGroupRow = typeof propertyGroups.$inferInsert;
export type MediaPropertyRow = typeof mediaProperties.$inferSelect;
export type NewMediaPropertyRow = typeof mediaProperties.$inferInsert;
export type BookRow = typeof books.$inferSelect;
export type MovieRow = typeof movies.$inferSelect;
export type TvShowRow = typeof tvShows.$inferSelect;
export type EpisodeRow = typeof episodes.$inferSelect;
export type AlbumRow = typeof albums.$inferSelect;
export type TrackRow = typeof tracks.$inferSelect;
export type AlbumPersonRow = typeof albumPeople.$inferSelect;
export type AlbumGroupRow = typeof albumGroups.$inferSelect;
export type PodcastRow = typeof podcasts.$inferSelect;
export type NewBookRow = typeof books.$inferInsert;
export type NewPodcastRow = typeof podcasts.$inferInsert;
export type TaxonomyImageRow = typeof taxonomyImages.$inferSelect;
export type NewTaxonomyImageRow = typeof taxonomyImages.$inferInsert;
export type TaxonomyImageOwnerType = typeof TAXONOMY_IMAGE_OWNER_TYPES[number];
export type RelationshipTypeRow = typeof relationshipTypes.$inferSelect;
export type NewRelationshipTypeRow = typeof relationshipTypes.$inferInsert;
export type YouTubeChannelRow = typeof youtubeChannels.$inferSelect;
export type NewYouTubeChannelRow = typeof youtubeChannels.$inferInsert;
export type YouTubeChannelImageRow = typeof youtubeChannelImages.$inferSelect;
export type NewYouTubeChannelImageRow = typeof youtubeChannelImages.$inferInsert;
export type YouTubeChannelSelfIdRow = typeof youtubeChannelSelfIds.$inferSelect;
export type NewsletterRow = typeof newsletters.$inferSelect;
export type NewNewsletterRow = typeof newsletters.$inferInsert;
export type TagRow = typeof tags.$inferSelect;
export type NewTagRow = typeof tags.$inferInsert;
export type BookmarkTagRow = typeof bookmarkTags.$inferSelect;
export type GenreMoodRow = typeof genreMoods.$inferSelect;
export type NewGenreMoodRow = typeof genreMoods.$inferInsert;
export type GenreMoodAssignmentRow = typeof genreMoodAssignments.$inferSelect;
export type NewGenreMoodAssignmentRow = typeof genreMoodAssignments.$inferInsert;
export type BookmarkRelationshipRow = typeof bookmarkRelationships.$inferSelect;
export type CustomPropertyRow = typeof customProperties.$inferSelect;
export type NewCustomPropertyRow = typeof customProperties.$inferInsert;
export type BookmarkNumberValueRow = typeof bookmarkNumberValues.$inferSelect;
export type BookmarkBooleanValueRow = typeof bookmarkBooleanValues.$inferSelect;
export type BookmarkFileValueRow = typeof bookmarkFileValues.$inferSelect;
export type CalculatePropertyOperandRow = typeof calculatePropertyOperands.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;
export type PropertyCategoryRow = typeof propertyCategories.$inferSelect;
export type PropertyMediaTypeRow = typeof propertyMediaTypes.$inferSelect;
export type CategoryRootTagRow = typeof categoryRootTags.$inferSelect;
export type WebsiteTagRow = typeof websiteTags.$inferSelect;
export type YouTubeChannelTagRow = typeof youtubeChannelTags.$inferSelect;
export type HomepageTagRow = typeof homepageTags.$inferSelect;
export type HomepageFilterRow = typeof homepageFilter.$inferSelect;
export type AppSettingsRow = typeof appSettings.$inferSelect;
export type AutofillRuleRow = typeof autofillRules.$inferSelect;
export type NewAutofillRuleRow = typeof autofillRules.$inferInsert;
export type AutofillRuleTagRow = typeof autofillRuleTags.$inferSelect;
export type AutofillRuleLocationRow = typeof autofillRuleLocations.$inferSelect;
export type LocationRow = typeof locations.$inferSelect;
export type NewLocationRow = typeof locations.$inferInsert;
export type AutofillRuleNumberValueRow = typeof autofillRuleNumberValues.$inferSelect;
export type AutofillRuleBooleanValueRow = typeof autofillRuleBooleanValues.$inferSelect;
export type AutofillRuleDateTimeValueRow = typeof autofillRuleDateTimeValues.$inferSelect;
export type CategoryNumberDefaultRow = typeof categoryNumberDefaults.$inferSelect;
export type CategoryBooleanDefaultRow = typeof categoryBooleanDefaults.$inferSelect;
export type CategoryDateTimeDefaultRow = typeof categoryDateTimeDefaults.$inferSelect;
export type SavedFilterRow = typeof savedFilters.$inferSelect;
export type ImportRow = typeof imports.$inferSelect;
export type ImportItemRow = typeof importItems.$inferSelect;

/**
 * `custom_aspect_ratios` — user-defined named aspect ratios that appear alongside the built-in
 * options (Natural, Cropped, Square, OpenGraph) in the Aspect dropdown for bookmark listings.
 */
export const customAspectRatios = pgTable("custom_aspect_ratios", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export type CustomAspectRatioRow = typeof customAspectRatios.$inferSelect;

/**
 * `pinned_sidebar_items` — entities and saved filters pinned as quick-access links in the sidebar,
 * displayed below the Bookmarks link. Composite unique constraint prevents duplicates.
 */
export const pinnedSidebarItems = pgTable("pinned_sidebar_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("pinned_sidebar_items_entity_unique").on(table.entityType, table.entityId),
]);

export type PinnedSidebarItemRow = typeof pinnedSidebarItems.$inferSelect;

/**
 * `favorite_settings_pages` — Settings (and settings-like management) pages favorited by the user
 * for quick access from the sidebar Settings flyout. Keyed by route `path`; the unique constraint
 * prevents duplicate favorites of the same page.
 */
export const favoriteSettingsPages = pgTable("favorite_settings_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  path: text("path").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("favorite_settings_pages_path_unique").on(table.path),
]);

export type FavoriteSettingsPageRow = typeof favoriteSettingsPages.$inferSelect;

/** `people` table — people or entities credited as creators of bookmarked items. */
export const people = pgTable("people", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable for clean `push`; backfilled at boot.
  slug: text("slug"),
  personWebsiteUrl: text("person_website_url"),
  biographyUrl: text("biography_url"),
  // Social media profile links. NOT NULL; pre-applied in migrate.ts.
  socialLinks: jsonb("social_links").$type<SocialLink[]>().notNull().default(sql`'[]'::jsonb`),
  // Fields absorbed from the former Artists taxonomy (a solo artist is a Person). `sort_order` is
  // NOT NULL default 0 → pre-applied in migrate.ts (push would prompt); the rest are nullable → push-safe.
  sortOrder: integer("sort_order").notNull().default(0),
  mediaPropertyId: uuid("media_property_id").references((): AnyPgColumn => mediaProperties.id, {
    onDelete: "set null",
  }),
  plexRatingKey: text("plex_rating_key"),
  plexItemType: text("plex_item_type"),
  plexItemTitle: text("plex_item_title"),
  year: integer("year"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("people_name_unique").on(table.name),
  unique("people_slug_unique").on(table.slug),
]);

export type PersonRow = typeof people.$inferSelect;

/** `person_images` — avatar stored in object storage; one row per person (1:1). */
export const personImages = pgTable("person_images", {
  personId: uuid("person_id").primaryKey().references(() => people.id, {
    onDelete: "cascade",
  }),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  byteSize: integer("byte_size").notNull(),
  source: text("source").notNull(), // "upload" | "website" | "biography"
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export type PersonImageRow = typeof personImages.$inferSelect;

/** `bookmark_people` join — many-to-many between bookmarks and people (individual creator credits). */
export const bookmarkPeople = pgTable("bookmark_people", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  personId: uuid("person_id").notNull().references((): AnyPgColumn => people.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.personId],
  }),
]);

/**
 * `bookmark_groups` join — many-to-many between bookmarks and groups (group creator credits,
 * e.g. bands/companies). Distinct from the single `bookmarks.group_id` FK, which is the item's
 * publishing house.
 */
export const bookmarkGroups = pgTable("bookmark_groups", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  groupId: uuid("group_id").notNull().references((): AnyPgColumn => groups.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.groupId],
  }),
]);

export type BookmarkGroupRow = typeof bookmarkGroups.$inferSelect;

/** `person_youtube_channels` join — M:M between people and YouTube channels. */
export const personYoutubeChannels = pgTable("person_youtube_channels", {
  personId: uuid("person_id").notNull().references(() => people.id, {
    onDelete: "cascade",
  }),
  channelId: uuid("channel_id").notNull().references(() => youtubeChannels.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.personId, table.channelId],
  }),
]);

export type PersonYoutubeChannelRow = typeof personYoutubeChannels.$inferSelect;

/** `person_websites` join — M:M between people and websites. */
export const personWebsites = pgTable("person_websites", {
  personId: uuid("person_id").notNull().references(() => people.id, {
    onDelete: "cascade",
  }),
  websiteId: uuid("website_id").notNull().references(() => websites.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.personId, table.websiteId],
  }),
]);

export type PersonWebsiteRow = typeof personWebsites.$inferSelect;

/** `person_groups` join — M:M between people and groups. */
export const personGroups = pgTable("person_groups", {
  personId: uuid("person_id").notNull().references(() => people.id, {
    onDelete: "cascade",
  }),
  groupId: uuid("group_id").notNull().references(() => groups.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.personId, table.groupId],
  }),
]);

export type PersonGroupRow = typeof personGroups.$inferSelect;

/** `group_youtube_channels` join — M:M between groups and YouTube channels. */
export const groupYoutubeChannels = pgTable("group_youtube_channels", {
  groupId: uuid("group_id").notNull().references(() => groups.id, {
    onDelete: "cascade",
  }),
  channelId: uuid("channel_id").notNull().references(() => youtubeChannels.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.groupId, table.channelId],
  }),
]);

export type GroupYoutubeChannelRow = typeof groupYoutubeChannels.$inferSelect;

/** `group_websites` join — M:M between groups and websites. */
export const groupWebsites = pgTable("group_websites", {
  groupId: uuid("group_id").notNull().references(() => groups.id, {
    onDelete: "cascade",
  }),
  websiteId: uuid("website_id").notNull().references(() => websites.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.groupId, table.websiteId],
  }),
]);

export type GroupWebsiteRow = typeof groupWebsites.$inferSelect;

/**
 * `card_field_templates` — user-saved named configurations of card field zone placements.
 * Reusable across card display rules: save once, apply to any rule's Card Fields override.
 * Push-safe: brand-new table, all non-nullable columns have defaults.
 */
export const cardFieldTemplates = pgTable("card_field_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  fieldZones: jsonb("field_zones").$type<CardFieldZones>().notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export type CardFieldTemplateRow = typeof cardFieldTemplates.$inferSelect;

export const peopleRelations = relations(people, ({
  many,
}) => ({
  bookmarkPeople: many(bookmarkPeople),
  personYoutubeChannels: many(personYoutubeChannels),
  personWebsites: many(personWebsites),
  personGroups: many(personGroups),
  albumPeople: many(albumPeople),
}));

export const bookmarkPeopleRelations = relations(bookmarkPeople, ({
  one,
}) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkPeople.bookmarkId],
    references: [bookmarks.id],
  }),
  person: one(people, {
    fields: [bookmarkPeople.personId],
    references: [people.id],
  }),
}));

export const bookmarkGroupsRelations = relations(bookmarkGroups, ({
  one,
}) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkGroups.bookmarkId],
    references: [bookmarks.id],
  }),
  group: one(groups, {
    fields: [bookmarkGroups.groupId],
    references: [groups.id],
  }),
}));

export const albumPeopleRelations = relations(albumPeople, ({
  one,
}) => ({
  album: one(albums, {
    fields: [albumPeople.albumId],
    references: [albums.id],
  }),
  person: one(people, {
    fields: [albumPeople.personId],
    references: [people.id],
  }),
}));

export const albumGroupsRelations = relations(albumGroups, ({
  one,
}) => ({
  album: one(albums, {
    fields: [albumGroups.albumId],
    references: [albums.id],
  }),
  group: one(groups, {
    fields: [albumGroups.groupId],
    references: [groups.id],
  }),
}));

export const podcastPeopleRelations = relations(podcastPeople, ({
  one,
}) => ({
  podcast: one(podcasts, {
    fields: [podcastPeople.podcastId],
    references: [podcasts.id],
  }),
  person: one(people, {
    fields: [podcastPeople.personId],
    references: [people.id],
  }),
}));

export const podcastGroupsRelations = relations(podcastGroups, ({
  one,
}) => ({
  podcast: one(podcasts, {
    fields: [podcastGroups.podcastId],
    references: [podcasts.id],
  }),
  group: one(groups, {
    fields: [podcastGroups.groupId],
    references: [groups.id],
  }),
}));

export const personYoutubeChannelsRelations = relations(personYoutubeChannels, ({
  one,
}) => ({
  person: one(people, {
    fields: [personYoutubeChannels.personId],
    references: [people.id],
  }),
  channel: one(youtubeChannels, {
    fields: [personYoutubeChannels.channelId],
    references: [youtubeChannels.id],
  }),
}));

export const personWebsitesRelations = relations(personWebsites, ({
  one,
}) => ({
  person: one(people, {
    fields: [personWebsites.personId],
    references: [people.id],
  }),
  website: one(websites, {
    fields: [personWebsites.websiteId],
    references: [websites.id],
  }),
}));

export const groupYoutubeChannelsRelations = relations(groupYoutubeChannels, ({
  one,
}) => ({
  group: one(groups, {
    fields: [groupYoutubeChannels.groupId],
    references: [groups.id],
  }),
  channel: one(youtubeChannels, {
    fields: [groupYoutubeChannels.channelId],
    references: [youtubeChannels.id],
  }),
}));

export const groupWebsitesRelations = relations(groupWebsites, ({
  one,
}) => ({
  group: one(groups, {
    fields: [groupWebsites.groupId],
    references: [groups.id],
  }),
  website: one(websites, {
    fields: [groupWebsites.websiteId],
    references: [websites.id],
  }),
}));

export const personGroupsRelations = relations(personGroups, ({
  one,
}) => ({
  person: one(people, {
    fields: [personGroups.personId],
    references: [people.id],
  }),
  group: one(groups, {
    fields: [personGroups.groupId],
    references: [groups.id],
  }),
}));
