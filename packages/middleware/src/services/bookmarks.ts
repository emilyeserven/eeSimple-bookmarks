/**
 * Barrel for the bookmark service. The implementation is split by concern into sibling modules
 * (`bookmarkCrud` core + bulk / backfill / duplicates / orphans); this file preserves the public
 * `@/services/bookmarks` import path so every existing consumer is unchanged. Split for #1369.
 */
export * from "@/services/bookmarkCrud";
export * from "@/services/bookmarkBulk";
export * from "@/services/bookmarkBackfill";
export * from "@/services/bookmarkDuplicates";
export * from "@/services/bookmarkOrphans";
