import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { propertyGroups } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/propertyGroups.ts` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`) — this suite has no live-Postgres harness. `mock.module` swaps `@/db` before
 * the service module is first imported (ESM import caching), so the mock must be installed up front.
 */

const propertyGroupRows: Record<string, unknown>[] = [];

function resetRows(rows: Record<string, unknown>[] = []): void {
  resetFakeIds();
  propertyGroupRows.length = 0;
  propertyGroupRows.push(...rows);
}

const db = createFakeDb([{
  table: propertyGroups,
  rows: propertyGroupRows,
}]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  backfillPropertyGroupSlugs,
  deletePropertyGroup,
} = await import("@/services/propertyGroups");
const {
  bookmarkCacheVersion,
} = await import("@/services/bookmarkCacheVersion");

test.beforeEach(() => {
  resetRows();
});

test("deletePropertyGroup: a missing id returns false", async () => {
  const deleted = await deletePropertyGroup("nonexistent-id");
  assert.equal(deleted, false);
});

test("deletePropertyGroup: a plain delete never invalidates the bookmark cache — the set-null FK un-groups member properties", async () => {
  resetRows([{
    id: "pg-1",
    name: "Book Metadata",
  }]);

  const versionBefore = bookmarkCacheVersion();
  const deleted = await deletePropertyGroup("pg-1");
  assert.equal(deleted, true);
  assert.equal(propertyGroupRows.some(row => row.id === "pg-1"), false);
  assert.equal(bookmarkCacheVersion(), versionBefore);
});

test("backfillPropertyGroupSlugs: slugs the raw name (no slugify pre-pass), leaves existing slugs untouched", async () => {
  resetRows([
    {
      id: "pg-no-slug",
      name: "Movie & TV Metadata!",
      slug: null,
    },
    {
      id: "pg-has-slug",
      name: "Book Metadata",
      slug: "book-metadata",
    },
  ]);

  await backfillPropertyGroupSlugs();

  const noSlugRow = propertyGroupRows.find(r => r.id === "pg-no-slug");
  assert.equal(noSlugRow?.slug, "movie-tv-metadata");
  const hasSlugRow = propertyGroupRows.find(r => r.id === "pg-has-slug");
  assert.equal(hasSlugRow?.slug, "book-metadata");
});
