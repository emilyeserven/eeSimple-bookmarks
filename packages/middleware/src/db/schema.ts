import { relations } from "drizzle-orm";
import { type AnyPgColumn, boolean, integer, pgTable, primaryKey, real, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

/** `bookmarks` table — one row per saved bookmark. Tags now live in `bookmark_tags`. */
export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  favorite: boolean("favorite").notNull().default(false),
  pinned: boolean("pinned").notNull().default(false),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

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
  many,
}) => ({
  bookmarkTags: many(bookmarkTags),
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
  // "tiered_tags" | "number" — kept as text so new kinds can be added later.
  type: text("type").notNull(),
  // Range-slider bounds for a `number` property; NULL means derive from data.
  numberMin: real("number_min"),
  numberMax: real("number_max"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

/**
 * `custom_property_tags` — each tiered-tags property's own self-referencing tree,
 * scoped by `propertyId`. `parentId` NULL means a root tag within that property.
 */
export const customPropertyTags = pgTable("custom_property_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id").notNull().references(() => customProperties.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => customPropertyTags.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, table => [
  // Sibling names are unique within a parent (per property). NULL parents are
  // distinct in Postgres, so root-level uniqueness is enforced in the service.
  unique("custom_property_tags_parent_name_unique").on(table.propertyId, table.parentId, table.name),
]);

/** `bookmark_property_tags` join — many-to-many between bookmarks and property tags. */
export const bookmarkPropertyTags = pgTable("bookmark_property_tags", {
  bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, {
    onDelete: "cascade",
  }),
  propertyTagId: uuid("property_tag_id").notNull().references(() => customPropertyTags.id, {
    onDelete: "cascade",
  }),
}, table => [
  primaryKey({
    columns: [table.bookmarkId, table.propertyTagId],
  }),
]);

/** `bookmark_number_values` — one numeric value per (bookmark, number property). */
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

export const customPropertiesRelations = relations(customProperties, ({
  many,
}) => ({
  tags: many(customPropertyTags),
  numberValues: many(bookmarkNumberValues),
}));

export const customPropertyTagsRelations = relations(customPropertyTags, ({
  one, many,
}) => ({
  property: one(customProperties, {
    fields: [customPropertyTags.propertyId],
    references: [customProperties.id],
  }),
  parent: one(customPropertyTags, {
    fields: [customPropertyTags.parentId],
    references: [customPropertyTags.id],
    relationName: "property_tag_parent",
  }),
  children: many(customPropertyTags, {
    relationName: "property_tag_parent",
  }),
  bookmarkPropertyTags: many(bookmarkPropertyTags),
}));

export const bookmarkPropertyTagsRelations = relations(bookmarkPropertyTags, ({
  one,
}) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkPropertyTags.bookmarkId],
    references: [bookmarks.id],
  }),
  propertyTag: one(customPropertyTags, {
    fields: [bookmarkPropertyTags.propertyTagId],
    references: [customPropertyTags.id],
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

export type BookmarkRow = typeof bookmarks.$inferSelect;
export type NewBookmarkRow = typeof bookmarks.$inferInsert;
export type TagRow = typeof tags.$inferSelect;
export type NewTagRow = typeof tags.$inferInsert;
export type BookmarkTagRow = typeof bookmarkTags.$inferSelect;
export type CustomPropertyRow = typeof customProperties.$inferSelect;
export type NewCustomPropertyRow = typeof customProperties.$inferInsert;
export type CustomPropertyTagRow = typeof customPropertyTags.$inferSelect;
export type NewCustomPropertyTagRow = typeof customPropertyTags.$inferInsert;
export type BookmarkPropertyTagRow = typeof bookmarkPropertyTags.$inferSelect;
export type BookmarkNumberValueRow = typeof bookmarkNumberValues.$inferSelect;
