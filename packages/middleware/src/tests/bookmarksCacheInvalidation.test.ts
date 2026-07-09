import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

/**
 * Covers the `invalidateBookmarkCache()` call-site conditions in `services/bookmarks.ts` — the
 * cache-invalidation behavior issue #1110 calls out, which actually lives here rather than in
 * `bookmarkWrites.ts` (see that file's tests for why). Kept in its own file rather than added to
 * the existing `bookmarks.test.ts`: that file statically imports `@/app`, which eagerly imports the
 * real `@/db` before any test runs, so `mock.module("@/db", ...)` here would be installed too late
 * for a module already loaded into the process-wide ESM cache.
 *
 * Scope is deliberately the small, self-contained write paths (`bulkDeleteBookmarks`,
 * `deleteBookmark`, `deleteOrphanedBookmarks`, `backfillTitleTags`, `updateBookmarkRelationships`) —
 * `createBookmark`/`updateBookmark`'s own invalidation conditions pull in a much deeper dependency
 * chain (YouTube/website/channel/automation-settings lookups) and are left for a follow-up rather
 * than forcing a much larger fake-db surface here. `backfillTitleLocations` is structurally
 * identical to `backfillTitleTags` (same guard, same insert-then-invalidate shape) and isn't
 * separately retested.
 */

const fakeDb = createFakeDb();
let invalidateCalls = 0;

mock.module("@/db", {
  namedExports: {
    db: fakeDb.db,
  },
});
mock.module("@/services/bookmarkCache", {
  namedExports: {
    invalidateBookmarkCache: () => {
      invalidateCalls++;
    },
  },
});
const {
  backfillTitleTags,
  bulkDeleteBookmarks,
  deleteBookmark,
  deleteOrphanedBookmarks,
  updateBookmarkRelationships,
} = await import("@/services/bookmarks");

function resetFixtures(): void {
  fakeDb.reset();
  invalidateCalls = 0;
  for (const table of [
    schema.bookmarks,
    schema.taxonomyAssignments,
    schema.entityNames,
    schema.bookmarkTags,
    schema.tags,
    schema.bookmarkLocations,
    schema.locations,
    schema.relationshipTypes,
    schema.bookmarkRelationships,
    schema.languageUsages,
    schema.languages,
  ]) {
    fakeDb.setRows(table, []);
  }
}

test("bulkDeleteBookmarks does not invalidate the cache when nothing was deleted", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, []); // delete().returning() resolves to no rows
  const result = await bulkDeleteBookmarks(["missing-1"]);
  assert.deepEqual(result, [{
    id: "missing-1",
    status: "not-found",
  }]);
  assert.equal(invalidateCalls, 0);
});

test("bulkDeleteBookmarks invalidates the cache exactly once when rows were deleted, regardless of count", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, [
    {
      id: "bm-1",
    },
    {
      id: "bm-2",
    },
  ]);
  const result = await bulkDeleteBookmarks(["bm-1", "bm-2"]);
  assert.deepEqual(result.map(r => r.status), ["deleted", "deleted"]);
  assert.equal(invalidateCalls, 1);
});

test("deleteBookmark does not invalidate the cache when the id doesn't exist", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, []);
  const deleted = await deleteBookmark("missing-1");
  assert.equal(deleted, false);
  assert.equal(invalidateCalls, 0);
});

test("deleteBookmark invalidates the cache when the bookmark existed", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, [{
    id: "bm-1",
  }]);
  const deleted = await deleteBookmark("bm-1");
  assert.equal(deleted, true);
  // deleteLanguageUsagesForOwner also invalidates internally for a bookmark owner, so this is
  // "at least once" rather than exactly once — the cache counter is idempotent-safe either way.
  assert.ok(invalidateCalls >= 1);
});

test("deleteOrphanedBookmarks does not invalidate the cache when there are no orphans", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, []);
  const result = await deleteOrphanedBookmarks();
  assert.equal(result.deleted, 0);
  assert.equal(invalidateCalls, 0);
});

test("deleteOrphanedBookmarks invalidates the cache once when orphans were deleted", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, [
    {
      id: "orphan-1",
    },
    {
      id: "orphan-2",
    },
  ]);
  const result = await deleteOrphanedBookmarks();
  assert.equal(result.deleted, 2);
  assert.equal(invalidateCalls, 1);
});

test("backfillTitleTags does not invalidate the cache when no title matches any tag", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, [{
    id: "bm-1",
    title: "Nothing relevant here",
  }]);
  fakeDb.setRows(schema.tags, [{
    id: "tag-1",
    name: "rust",
  }]);
  const result = await backfillTitleTags();
  assert.equal(result.tagsApplied, 0);
  assert.equal(invalidateCalls, 0);
});

test("backfillTitleTags invalidates the cache once when a title match inserts a new tag link", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, [{
    id: "bm-1",
    title: "Learning Rust programming",
  }]);
  fakeDb.setRows(schema.tags, [{
    id: "tag-1",
    name: "rust",
  }]);
  const result = await backfillTitleTags();
  assert.equal(result.tagsApplied, 1);
  assert.equal(invalidateCalls, 1);
});

test("updateBookmarkRelationships invalidates the cache unconditionally, even with no relationships left", async () => {
  resetFixtures();
  await updateBookmarkRelationships("bm-1", {
    relationships: [],
  });
  assert.equal(invalidateCalls, 1);
});
