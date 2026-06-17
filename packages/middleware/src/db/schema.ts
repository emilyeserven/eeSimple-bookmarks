import { relations } from "drizzle-orm";
import { type AnyPgColumn, boolean, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

/** `bookmarks` table — one row per saved bookmark. Tags now live in `bookmark_tags`. */
export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  favorite: boolean("favorite").notNull().default(false),
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

export type BookmarkRow = typeof bookmarks.$inferSelect;
export type NewBookmarkRow = typeof bookmarks.$inferInsert;
export type TagRow = typeof tags.$inferSelect;
export type NewTagRow = typeof tags.$inferInsert;
export type BookmarkTagRow = typeof bookmarkTags.$inferSelect;
