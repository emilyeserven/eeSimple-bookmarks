import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { relationshipTypes } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/relationshipTypes.ts` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`) — this suite has no live-Postgres harness. `mock.module` swaps `@/db` before
 * the service module is first imported (ESM import caching), so the mock must be installed up front.
 */

const relationshipTypeRows: Record<string, unknown>[] = [];

function resetRows(rows: Record<string, unknown>[] = []): void {
  resetFakeIds();
  relationshipTypeRows.length = 0;
  relationshipTypeRows.push(...rows);
}

const db = createFakeDb([{
  table: relationshipTypes,
  rows: relationshipTypeRows,
}]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  BuiltInRelationshipTypeError,
  bulkDeleteRelationshipTypes,
  deleteRelationshipType,
  ensureBuiltInRelationshipTypes,
  updateRelationshipType,
} = await import("@/services/relationshipTypes");
const {
  bookmarkCacheVersion,
} = await import("@/services/bookmarkCacheVersion");

test.beforeEach(() => {
  resetRows();
});

test("deleteRelationshipType: a built-in cannot be deleted", async () => {
  resetRows([{
    id: "rt-1",
    name: "Similar",
    builtIn: true,
  }]);

  await assert.rejects(() => deleteRelationshipType("rt-1"), BuiltInRelationshipTypeError);
  assert.equal(relationshipTypeRows.some(row => row.id === "rt-1"), true);
});

test("deleteRelationshipType: a missing id returns false and does not bump the bookmark cache", async () => {
  const versionBefore = bookmarkCacheVersion();
  const deleted = await deleteRelationshipType("nonexistent-id");
  assert.equal(deleted, false);
  assert.equal(bookmarkCacheVersion(), versionBefore);
});

test("deleteRelationshipType: deleting a non-built-in row invalidates the bookmark cache — cascaded edges are matchable data", async () => {
  resetRows([{
    id: "rt-2",
    name: "Sequel of",
    builtIn: false,
  }]);

  const versionBefore = bookmarkCacheVersion();
  const deleted = await deleteRelationshipType("rt-2");
  assert.equal(deleted, true);
  assert.equal(relationshipTypeRows.some(row => row.id === "rt-2"), false);
  assert.equal(bookmarkCacheVersion(), versionBefore + 1);
});

test("updateRelationshipType: renaming a built-in throws", async () => {
  resetRows([{
    id: "rt-3",
    name: "Similar",
    builtIn: true,
  }]);

  await assert.rejects(
    () => updateRelationshipType("rt-3", {
      name: "Not Similar",
    }),
    BuiltInRelationshipTypeError,
  );
});

test("bulkDeleteRelationshipTypes: a built-in in the batch is reported as skipped without aborting the rest", async () => {
  resetRows([
    {
      id: "rt-builtin",
      name: "Similar",
      builtIn: true,
    },
    {
      id: "rt-custom",
      name: "Sequel of",
      builtIn: false,
    },
  ]);

  const results = await bulkDeleteRelationshipTypes(["rt-builtin", "rt-custom", "rt-missing"]);

  assert.deepEqual(results.map(r => r.status), ["skipped-built-in", "deleted", "not-found"]);
  assert.equal(relationshipTypeRows.some(row => row.id === "rt-builtin"), true);
  assert.equal(relationshipTypeRows.some(row => row.id === "rt-custom"), false);
});

test("ensureBuiltInRelationshipTypes: idempotent — seeds the 4 built-ins once, skips them on a repeat call", async () => {
  resetRows();

  await ensureBuiltInRelationshipTypes();
  assert.equal(relationshipTypeRows.length, 4);
  const namesAfterFirst = relationshipTypeRows.map(row => row.name).sort();

  await ensureBuiltInRelationshipTypes();
  assert.equal(relationshipTypeRows.length, 4);
  assert.deepEqual(relationshipTypeRows.map(row => row.name).sort(), namesAfterFirst);
});
