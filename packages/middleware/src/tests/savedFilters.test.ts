import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { savedFilters } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/savedFilters.ts` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`) — this suite has no live-Postgres harness. `mock.module` swaps `@/db` before
 * the service module is first imported (ESM import caching), so the mock must be installed up front.
 */

const savedFilterRows: Record<string, unknown>[] = [];

function resetRows(rows: Record<string, unknown>[] = []): void {
  resetFakeIds();
  savedFilterRows.length = 0;
  savedFilterRows.push(...rows);
}

const db = createFakeDb([{
  table: savedFilters,
  rows: savedFilterRows,
}]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  backfillSavedFilterSlugs,
  deleteSavedFilter,
} = await import("@/services/savedFilters");

test.beforeEach(() => {
  resetRows();
});

test("deleteSavedFilter: a missing id returns false", async () => {
  const deleted = await deleteSavedFilter("nonexistent-id");
  assert.equal(deleted, false);
});

test("deleteSavedFilter: removes the row", async () => {
  resetRows([{
    id: "sf-1",
    name: "Recent anime",
  }]);

  const deleted = await deleteSavedFilter("sf-1");
  assert.equal(deleted, true);
  assert.equal(savedFilterRows.some(row => row.id === "sf-1"), false);
});

test("backfillSavedFilterSlugs: fills in slugs for saved filters missing one, leaves existing slugs untouched", async () => {
  resetRows([
    {
      id: "sf-no-slug",
      name: "Unread Manga",
      slug: null,
    },
    {
      id: "sf-has-slug",
      name: "Recent anime",
      slug: "recent-anime",
    },
  ]);

  await backfillSavedFilterSlugs();

  const noSlugRow = savedFilterRows.find(r => r.id === "sf-no-slug");
  assert.equal(noSlugRow?.slug, "unread-manga");
  const hasSlugRow = savedFilterRows.find(r => r.id === "sf-has-slug");
  assert.equal(hasSlugRow?.slug, "recent-anime");
});
