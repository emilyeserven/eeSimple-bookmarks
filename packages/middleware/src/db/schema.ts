import { relations, sql } from "drizzle-orm";
import { type AnyPgColumn, boolean, integer, jsonb, pgTable, primaryKey, real, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { CardFieldZones, ConditionTree, ShortenedLink, WebsiteParamRule } from "@eesimple/types";

/** `bookmarks` table — one row per saved bookmark. Tags now live in `bookmark_tags`. */
export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
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
  priority: integer("priority").notNull().default(0),
  // Specific reason the last image auto-grab attempt failed. Nullable so `drizzle-kit push`
  // applies cleanly to existing rows (push-safe additive change). NULL means never attempted or
  // the last attempt succeeded.
  imageAutoGrabError: text("image_auto_grab_error"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("bookmarks_url_unique").on(table.url),
]);

/**
 * `bookmark_images` — 0..1 image per bookmark. The image bytes live in object storage (Garage/S3);
 * this table holds only metadata. `bookmarkId` is the primary key, so a replace is an upsert and the
 * row cascades away with its bookmark.
 */
export const bookmarkImages = pgTable("bookmark_images", {
  bookmarkId: uuid("bookmark_id").primaryKey().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  // Object-storage key the bytes are stored under, e.g. "bookmarks/<id>.webp".
  objectKey: text("object_key").notNull(),
  // Always "image/webp" after the resize/encode pipeline.
  contentType: text("content_type").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  byteSize: integer("byte_size").notNull(),
  // "upload" | "og" — kept as text so new sources can be added without a migration.
  source: text("source").notNull(),
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
  // Optional default media type applied to new bookmarks saved from this channel. Nullable (push-safe
  // additive); set null when the media type is deleted.
  mediaTypeId: uuid("media_type_id").references((): AnyPgColumn => mediaTypes.id, {
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
  // Optional, more specific free-text label for this edge (e.g. "sequel", "same author").
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
  bookmarkTags: many(bookmarkTags),
  image: one(bookmarkImages),
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
  // When false, the property is globally inactive: hidden from filters, conditions, category
  // assignment, and the bookmark form. Existing rows default to true via the column default.
  enabled: boolean("enabled").notNull().default(true),
  // When false, this property is hidden from the category defaults editor.
  allowDefault: boolean("allow_default").notNull().default(true),
  // Boolean-specific display settings. All nullable (additive, push-safe). null → false / "yes-no".
  showIfFalse: boolean("show_if_false"),
  // "yes-no" | "true-false" | "enabled-disabled" | "icons" | "stars" | "custom". null → "yes-no".
  booleanLabelPreset: text("boolean_label_preset"),
  // Custom labels used only when booleanLabelPreset = "custom".
  booleanTrueLabel: text("boolean_true_label"),
  booleanFalseLabel: text("boolean_false_label"),
  // Icon-preset layout options. null → true (showLabelColon) / false (showValueBeforeLabel).
  showLabelColon: boolean("show_label_colon"),
  showValueBeforeLabel: boolean("show_value_before_label"),
  // When true, the property name label is omitted; only the value is shown. null → false.
  hideLabel: boolean("hide_label"),
  // When true, the value in the bookmark detail view is a clickable toggle. null → false.
  clickableInView: boolean("clickable_in_view"),
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
  hiddenCardFields: jsonb("hidden_card_fields").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // When true, custom properties placed in an image corner are overlaid on this section's card
  // images; when false they fall back to badges. NOT NULL on the populated table → pre-applied in
  // migrate.ts to keep push additive.
  cornerOverlays: boolean("corner_overlays").notNull().default(true),
  // When true, the website pill is hidden on this section's cards for a bookmark that also has a
  // YouTube channel. Owned per-section so homepage cards never fall back to the Default card display
  // rule. NOT NULL DEFAULT false on the populated table → pre-applied in migrate.ts to keep push additive.
  hideWebsiteForYouTube: boolean("hide_website_for_youtube").notNull().default(false),
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
});

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
  description: text("description"),
  filters: jsonb("filters").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("saved_filters_name_unique").on(table.name),
]);

export type BookmarkRow = typeof bookmarks.$inferSelect;
export type NewBookmarkRow = typeof bookmarks.$inferInsert;
export type BookmarkImageRow = typeof bookmarkImages.$inferSelect;
export type NewBookmarkImageRow = typeof bookmarkImages.$inferInsert;
export type MediaObjectRow = typeof mediaObjects.$inferSelect;
export type NewMediaObjectRow = typeof mediaObjects.$inferInsert;
export type WebsiteRow = typeof websites.$inferSelect;
export type NewWebsiteRow = typeof websites.$inferInsert;
export type WebsiteFaviconRow = typeof websiteFavicons.$inferSelect;
export type NewWebsiteFaviconRow = typeof websiteFavicons.$inferInsert;
export type MediaTypeRow = typeof mediaTypes.$inferSelect;
export type NewMediaTypeRow = typeof mediaTypes.$inferInsert;
export type PropertyGroupRow = typeof propertyGroups.$inferSelect;
export type NewPropertyGroupRow = typeof propertyGroups.$inferInsert;
export type RelationshipTypeRow = typeof relationshipTypes.$inferSelect;
export type NewRelationshipTypeRow = typeof relationshipTypes.$inferInsert;
export type YouTubeChannelRow = typeof youtubeChannels.$inferSelect;
export type NewYouTubeChannelRow = typeof youtubeChannels.$inferInsert;
export type YouTubeChannelImageRow = typeof youtubeChannelImages.$inferSelect;
export type NewYouTubeChannelImageRow = typeof youtubeChannelImages.$inferInsert;
export type YouTubeChannelSelfIdRow = typeof youtubeChannelSelfIds.$inferSelect;
export type TagRow = typeof tags.$inferSelect;
export type NewTagRow = typeof tags.$inferInsert;
export type BookmarkTagRow = typeof bookmarkTags.$inferSelect;
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
export type AutofillRuleNumberValueRow = typeof autofillRuleNumberValues.$inferSelect;
export type AutofillRuleBooleanValueRow = typeof autofillRuleBooleanValues.$inferSelect;
export type AutofillRuleDateTimeValueRow = typeof autofillRuleDateTimeValues.$inferSelect;
export type CategoryNumberDefaultRow = typeof categoryNumberDefaults.$inferSelect;
export type CategoryBooleanDefaultRow = typeof categoryBooleanDefaults.$inferSelect;
export type CategoryDateTimeDefaultRow = typeof categoryDateTimeDefaults.$inferSelect;
export type SavedFilterRow = typeof savedFilters.$inferSelect;

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
