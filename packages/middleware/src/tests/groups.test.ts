import assert from "node:assert/strict";
import { mock, test } from "node:test";
import {
  entityNames,
  genreMoodAssignments,
  groupImages,
  groups,
} from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/groups.ts` is exercised against the shared in-memory fake `db` (`testDbHelpers.ts`) —
 * this suite has no live-Postgres harness. `mock.module` swaps `@/db` before the service module is
 * first imported (ESM import caching), so the mock must be installed up front.
 *
 * `@/utils/objectStore` is mocked too: `deleteGroup` calls `deleteObject` for a group with a stored
 * image, and the real implementation opens an S3 client that isn't configured in this environment.
 */

const groupRows: Record<string, unknown>[] = [];
const groupImageRows: Record<string, unknown>[] = [];
const genreMoodAssignmentRows: Record<string, unknown>[] = [];
const entityNameRows: Record<string, unknown>[] = [];
const deletedObjectKeys: string[] = [];

function resetRows(opts: {
  groups?: Record<string, unknown>[];
  groupImages?: Record<string, unknown>[];
  genreMoodAssignments?: Record<string, unknown>[];
  entityNames?: Record<string, unknown>[];
}): void {
  resetFakeIds();
  groupRows.length = 0;
  groupRows.push(...(opts.groups ?? []));
  groupImageRows.length = 0;
  groupImageRows.push(...(opts.groupImages ?? []));
  genreMoodAssignmentRows.length = 0;
  genreMoodAssignmentRows.push(...(opts.genreMoodAssignments ?? []));
  entityNameRows.length = 0;
  entityNameRows.push(...(opts.entityNames ?? []));
  deletedObjectKeys.length = 0;
}

const db = createFakeDb([
  {
    table: groups,
    rows: groupRows,
  },
  {
    table: groupImages,
    rows: groupImageRows,
  },
  {
    table: genreMoodAssignments,
    rows: genreMoodAssignmentRows,
  },
  {
    table: entityNames,
    rows: entityNameRows,
  },
]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});
// `groupImages.ts` (and transitively `gallery.ts`) import other named exports of this module too —
// ESM linking is static, so the mock must re-export everything real, overriding only `deleteObject`.
const realObjectStore = await import("@/utils/objectStore");
mock.module("@/utils/objectStore", {
  namedExports: {
    ...realObjectStore,
    deleteObject: async (key: string) => {
      deletedObjectKeys.push(key);
    },
  },
});

const {
  deleteGroup,
} = await import("@/services/groups");
const {
  bookmarkCacheVersion,
} = await import("@/services/bookmarkCacheVersion");

test.beforeEach(() => {
  resetRows({});
});

test("deleteGroup: a missing id returns false with no side effects", async () => {
  const deleted = await deleteGroup("nonexistent-id");
  assert.equal(deleted, false);
  assert.equal(genreMoodAssignmentRows.length, 0);
  assert.equal(entityNameRows.length, 0);
  assert.deepEqual(deletedObjectKeys, []);
});

test("deleteGroup: cleans up genre/mood + entity-name rows and deletes a stored image object", async () => {
  resetRows({
    groups: [{
      id: "group-1",
      name: "Doujin Circle X",
    }],
    groupImages: [{
      groupId: "group-1",
      objectKey: "groups/group-1/avatar.webp",
    }],
    genreMoodAssignments: [
      {
        id: "gma-1",
        ownerType: "group",
        ownerId: "group-1",
        genreMoodId: "gm-1",
      },
      {
        id: "gma-2",
        ownerType: "bookmark",
        ownerId: "bm-1",
        genreMoodId: "gm-1",
      },
    ],
    entityNames: [{
      id: "en-1",
      ownerType: "group",
      ownerId: "group-1",
      name: "Doujin Circle X",
    }],
  });

  const deleted = await deleteGroup("group-1");
  assert.equal(deleted, true);

  assert.equal(groupRows.some(row => row.id === "group-1"), false);
  assert.deepEqual(genreMoodAssignmentRows.map(row => row.id), ["gma-2"]);
  assert.equal(entityNameRows.length, 0);
  assert.deepEqual(deletedObjectKeys, ["groups/group-1/avatar.webp"]);
});

test("deleteGroup: a group with no stored image skips the object-store delete", async () => {
  resetRows({
    groups: [{
      id: "group-2",
      name: "Company Y",
    }],
  });

  const deleted = await deleteGroup("group-2");
  assert.equal(deleted, true);
  assert.deepEqual(deletedObjectKeys, []);
});

test("deleteGroup: never invalidates the bookmark cache — groups aren't matchable bookmark data", async () => {
  resetRows({
    groups: [{
      id: "group-3",
      name: "Company Z",
    }],
  });

  const versionBefore = bookmarkCacheVersion();
  await deleteGroup("group-3");
  assert.equal(bookmarkCacheVersion(), versionBefore);
});
