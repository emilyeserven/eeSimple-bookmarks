import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

/**
 * Covers `applyTagReparentPlan`'s own orchestration: the new-tag creation guard (blank name / missing
 * existing parent → `notFound`, no insert), the tempId→realId map building, and per-item move counting.
 * The real `createTag`/`updateTag` run against the fixture-per-table fake db (it ignores `where` and
 * echoes inserted rows back), so this asserts on the observable insert calls + the result counts, not
 * on generated ids. The cycle path is not exercised here — `wouldCreateCycle` is unit-tested in
 * `tags.test.ts` and `updateTag` reuses it. Mirrors `aiAutotag.test.ts`.
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
  applyTagReparentPlan,
} = await import("@/services/tags");

function reset(): void {
  fakeDb.reset();
  invalidateCalls = 0;
}

/** Number of inserts recorded against the tags table. */
function tagInserts(): number {
  return fakeDb.inserted.filter(entry => entry.table === schema.tags).length;
}

test("no-ops on an empty plan", async () => {
  reset();
  fakeDb.setRows(schema.tags, []);
  const result = await applyTagReparentPlan({
    newTags: [],
    moves: [],
  });
  assert.deepEqual(result, {
    created: 0,
    moved: 0,
    notFound: [],
  });
  assert.equal(tagInserts(), 0);
});

test("skips a new tag with a blank name or a missing existing parent", async () => {
  reset();
  fakeDb.setRows(schema.tags, [{
    id: "p1",
    slug: "p1",
  }]);

  const result = await applyTagReparentPlan({
    newTags: [
      {
        tempId: "blank",
        name: "   ",
        parentId: null,
      },
      {
        tempId: "orphan",
        name: "Orphan",
        parentId: "does-not-exist",
      },
      {
        tempId: "ok",
        name: "Frontend",
        parentId: null,
      },
    ],
    moves: [],
  });

  assert.equal(result.created, 1);
  assert.deepEqual([...result.notFound].sort(), ["blank", "orphan"]);
  // Only the valid new tag was inserted.
  assert.equal(tagInserts(), 1);
});

test("creates a new tag under an existing parent and counts a root-move", async () => {
  reset();
  fakeDb.setRows(schema.tags, [{
    id: "p1",
    name: "p1",
    slug: "p1",
    parentId: null,
    description: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    editableOnCard: false,
    excludeFromBackfill: false,
    isFavorite: false,
  }]);

  const result = await applyTagReparentPlan({
    newTags: [{
      tempId: "grp",
      name: "Group",
      parentId: "p1",
    }],
    moves: [{
      id: "p1",
      parentId: null,
    }],
  });

  assert.equal(result.created, 1);
  assert.equal(result.moved, 1);
  assert.deepEqual(result.notFound, []);
  assert.equal(tagInserts(), 1);
  // createTag + updateTag each invalidate the bookmark cache.
  assert.ok(invalidateCalls >= 2);
});
