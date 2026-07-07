import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { groupTypes } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/groupTypes.ts` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`) — this suite has no live-Postgres harness. `mock.module` swaps `@/db` before
 * the service module is first imported (ESM import caching), so the mock must be installed up front.
 */

const groupTypeRows: Record<string, unknown>[] = [];

function resetRows(rows: Record<string, unknown>[] = []): void {
  resetFakeIds();
  groupTypeRows.length = 0;
  groupTypeRows.push(...rows);
}

const db = createFakeDb([{
  table: groupTypes,
  rows: groupTypeRows,
}]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  backfillGroupTypeSlugs,
  deleteGroupType,
  ensureDefaultGroupTypes,
} = await import("@/services/groupTypes");
const {
  bookmarkCacheVersion,
} = await import("@/services/bookmarkCacheVersion");

test.beforeEach(() => {
  resetRows();
});

test("deleteGroupType: a missing id returns false", async () => {
  const deleted = await deleteGroupType("nonexistent-id");
  assert.equal(deleted, false);
});

test("deleteGroupType: a plain delete never invalidates the bookmark cache — the set-null FK un-classifies member groups", async () => {
  resetRows([{
    id: "gt-1",
    name: "Company",
  }]);

  const versionBefore = bookmarkCacheVersion();
  const deleted = await deleteGroupType("gt-1");
  assert.equal(deleted, true);
  assert.equal(groupTypeRows.some(row => row.id === "gt-1"), false);
  assert.equal(bookmarkCacheVersion(), versionBefore);
});

test("backfillGroupTypeSlugs: fills in slugs for group types missing one, leaves existing slugs untouched", async () => {
  resetRows([
    {
      id: "gt-no-slug",
      name: "Doujin Circle",
      slug: null,
    },
    {
      id: "gt-has-slug",
      name: "Company",
      slug: "company",
    },
  ]);

  await backfillGroupTypeSlugs();

  const noSlugRow = groupTypeRows.find(r => r.id === "gt-no-slug");
  assert.equal(noSlugRow?.slug, "doujin-circle");
  const hasSlugRow = groupTypeRows.find(r => r.id === "gt-has-slug");
  assert.equal(hasSlugRow?.slug, "company");
});

test("ensureDefaultGroupTypes: idempotent — seeds the 4 built-ins once, skips them on a repeat call", async () => {
  resetRows();

  await ensureDefaultGroupTypes();
  assert.equal(groupTypeRows.length, 4);
  const namesAfterFirst = groupTypeRows.map(row => row.name).sort();

  await ensureDefaultGroupTypes();
  assert.equal(groupTypeRows.length, 4);
  assert.deepEqual(groupTypeRows.map(row => row.name).sort(), namesAfterFirst);
});
