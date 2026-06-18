import { relations } from "drizzle-orm";
import { type AnyPgColumn, boolean, integer, jsonb, pgTable, primaryKey, real, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import type { ConditionTree } from "@eesimple/types";

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
 * `websites` table — the built-in "Websites" taxonomy. One row per distinct host; bookmarks are
 * auto-linked to a website by the host of their URL.
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
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("media_types_name_unique").on(table.name),
  unique("media_types_slug_unique").on(table.slug),
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
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  unique("youtube_channels_key_unique").on(table.channelKey),
  unique("youtube_channels_slug_unique").on(table.slug),
]);

/** `tags` table — a self-referencing tree. `parentId` NULL means a root tag. */
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => tags.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  // Sibling names are unique within a parent. NULL parents are distinct in
  // Postgres, so root-level uniqueness is enforced in the service layer instead.
  unique("tags_parent_name_unique").on(table.parentId, table.name),
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
}));

export const mediaTypesRelations = relations(mediaTypes, ({
  many,
}) => ({
  bookmarks: many(bookmarks),
}));

export const youtubeChannelsRelations = relations(youtubeChannels, ({
  many,
}) => ({
  bookmarks: many(bookmarks),
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
  many,
}) => ({
  bookmarks: many(bookmarks),
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

/** `custom_properties` table — user-defined fields that become dynamic bookmark filters. */
export const customProperties = pgTable("custom_properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // URL-friendly identifier derived from the name. Nullable at the DB level so `drizzle-kit push`
  // applies cleanly to existing rows; the service layer backfills it at boot and always returns a
  // slug on the wire type.
  slug: text("slug"),
  // "number" | "boolean" | "calculate" — kept as text so new kinds can be added later.
  type: text("type").notNull(),
  // The built-in "Video Length" property; built-ins cannot be renamed, retyped, or deleted.
  builtIn: boolean("built_in").notNull().default(false),
  // How a number/calculate value is rendered: "plain" (default) or "duration" (seconds → H:MM:SS).
  // Nullable/text so it's an additive, push-safe column and new formats can be added later.
  numberFormat: text("number_format"),
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
  // When true, the property applies to every category, including ones created later.
  allCategories: boolean("all_categories").notNull().default(false),
  // When true, the property's value can be edited inline from a bookmark card's "More" menu.
  editableOnCard: boolean("editable_on_card").notNull().default(false),
  // When false, the property is globally inactive: hidden from filters, conditions, category
  // assignment, and the bookmark form. Existing rows default to true via the column default.
  enabled: boolean("enabled").notNull().default(true),
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

export const autofillRulesRelations = relations(autofillRules, ({
  one, many,
}) => ({
  category: one(categories, {
    fields: [autofillRules.setCategoryId],
    references: [categories.id],
  }),
  tags: many(autofillRuleTags),
  numberValues: many(autofillRuleNumberValues),
  booleanValues: many(autofillRuleBooleanValues),
}));

export const customPropertiesRelations = relations(customProperties, ({
  many,
}) => ({
  numberValues: many(bookmarkNumberValues),
  booleanValues: many(bookmarkBooleanValues),
  propertyCategories: many(propertyCategories),
}));

export const categoriesRelations = relations(categories, ({
  many,
}) => ({
  bookmarks: many(bookmarks),
  propertyCategories: many(propertyCategories),
  categoryRootTags: many(categoryRootTags),
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

export type BookmarkRow = typeof bookmarks.$inferSelect;
export type NewBookmarkRow = typeof bookmarks.$inferInsert;
export type BookmarkImageRow = typeof bookmarkImages.$inferSelect;
export type NewBookmarkImageRow = typeof bookmarkImages.$inferInsert;
export type MediaObjectRow = typeof mediaObjects.$inferSelect;
export type NewMediaObjectRow = typeof mediaObjects.$inferInsert;
export type WebsiteRow = typeof websites.$inferSelect;
export type NewWebsiteRow = typeof websites.$inferInsert;
export type MediaTypeRow = typeof mediaTypes.$inferSelect;
export type NewMediaTypeRow = typeof mediaTypes.$inferInsert;
export type YouTubeChannelRow = typeof youtubeChannels.$inferSelect;
export type NewYouTubeChannelRow = typeof youtubeChannels.$inferInsert;
export type TagRow = typeof tags.$inferSelect;
export type NewTagRow = typeof tags.$inferInsert;
export type BookmarkTagRow = typeof bookmarkTags.$inferSelect;
export type CustomPropertyRow = typeof customProperties.$inferSelect;
export type NewCustomPropertyRow = typeof customProperties.$inferInsert;
export type BookmarkNumberValueRow = typeof bookmarkNumberValues.$inferSelect;
export type BookmarkBooleanValueRow = typeof bookmarkBooleanValues.$inferSelect;
export type CalculatePropertyOperandRow = typeof calculatePropertyOperands.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;
export type PropertyCategoryRow = typeof propertyCategories.$inferSelect;
export type CategoryRootTagRow = typeof categoryRootTags.$inferSelect;
export type HomepageTagRow = typeof homepageTags.$inferSelect;
export type HomepageFilterRow = typeof homepageFilter.$inferSelect;
export type AutofillRuleRow = typeof autofillRules.$inferSelect;
export type NewAutofillRuleRow = typeof autofillRules.$inferInsert;
export type AutofillRuleTagRow = typeof autofillRuleTags.$inferSelect;
export type AutofillRuleNumberValueRow = typeof autofillRuleNumberValues.$inferSelect;
export type AutofillRuleBooleanValueRow = typeof autofillRuleBooleanValues.$inferSelect;
export type CategoryNumberDefaultRow = typeof categoryNumberDefaults.$inferSelect;
export type CategoryBooleanDefaultRow = typeof categoryBooleanDefaults.$inferSelect;
