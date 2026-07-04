import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { Column, is, Param, SQL } from "drizzle-orm";

/**
 * `deleteTaxonomyImagesForOwner` (services/taxonomyImages.ts) is exercised against a tiny in-memory
 * fake `db` + a stubbed `deleteObject`, since this suite has no live-Postgres/S3 harness (every other
 * service test here is pure-function only — see `bulkDelete.test.ts`). `mock.module` swaps `@/db` and
 * `@/utils/objectStore` once, before the service module is first imported (ES module imports are
 * cached process-wide, so the mocks must be in place before that first import — hence the shared
 * mutable fixtures below rather than re-mocking per test). The fake `db` interprets only the
 * `eq`/`and` shapes this service builds, walked via drizzle-orm's *public* `is`/`Column`/`Param`/`SQL`
 * — no private/internal APIs.
 */

interface FakeRow {
  id: string;
  ownerType: string;
  ownerId: string;
  objectKey: string;
}

/** Flatten an `and(eq(col, val), …)` condition into `{ columnName: value }`. */
function extractEqFilters(condition: unknown): Record<string, unknown> {
  const flat: ({ kind: "col";
    name: string; } | { kind: "val";
      value: unknown; })[] = [];
  const walk = (node: unknown): void => {
    if (node == null) return;
    if (is(node, Column)) {
      flat.push({
        kind: "col",
        name: node.name,
      });
      return;
    }
    if (is(node, Param)) {
      flat.push({
        kind: "val",
        value: node.value,
      });
      return;
    }
    if (node instanceof SQL && Array.isArray(node.queryChunks)) {
      for (const chunk of node.queryChunks) walk(chunk);
    }
  };
  walk(condition);

  const filters: Record<string, unknown> = {};
  for (let i = 0; i < flat.length - 1; i++) {
    const col = flat[i];
    const val = flat[i + 1];
    if (col.kind === "col" && val.kind === "val") filters[col.name] = val.value;
  }
  return filters;
}

function rowMatches(row: FakeRow, filters: Record<string, unknown>): boolean {
  return Object.entries(filters).every(([column, value]) => {
    if (column === "owner_type") return row.ownerType === value;
    if (column === "owner_id") return row.ownerId === value;
    return true;
  });
}

// Shared, mutable fixtures — reset at the top of each test. The fake `db`/`deleteObject` below close
// over these by reference, so the arrays are never reassigned, only replaced in place.
const rows: FakeRow[] = [];
const deletedKeys: string[] = [];

function resetRows(next: FakeRow[]): void {
  rows.length = 0;
  rows.push(...next);
}

/** A minimal stand-in for the drizzle `db` supporting only the chains `taxonomyImages.ts` uses. */
const fakeDb = {
  select: () => ({
    from: () => ({
      where: (cond: unknown) => ({
        orderBy: () => Promise.resolve(rows.filter(row => rowMatches(row, extractEqFilters(cond)))),
      }),
    }),
  }),
  delete: () => ({
    where: (cond: unknown) => {
      const filters = extractEqFilters(cond);
      const kept = rows.filter(row => !rowMatches(row, filters));
      rows.length = 0;
      rows.push(...kept);
      return Promise.resolve(undefined);
    },
  }),
};

mock.module("@/db", {
  namedExports: {
    db: fakeDb,
  },
});
mock.module("@/utils/objectStore", {
  namedExports: {
    deleteObject: (key: string) => {
      deletedKeys.push(key);
      return Promise.resolve(undefined);
    },
    putObject: () => Promise.resolve(undefined),
  },
});

const {
  deleteTaxonomyImagesForOwner,
} = await import("@/services/taxonomyImages");

test("deleteTaxonomyImagesForOwner deletes only the owner's rows/objects, leaving other owners untouched", async () => {
  deletedKeys.length = 0;
  resetRows([
    {
      id: "1",
      ownerType: "movie",
      ownerId: "movie-a",
      objectKey: "taxonomy-images/movie/movie-a/1.webp",
    },
    {
      id: "2",
      ownerType: "movie",
      ownerId: "movie-a",
      objectKey: "taxonomy-images/movie/movie-a/2.webp",
    },
    // A different owner id of the same owner type.
    {
      id: "3",
      ownerType: "movie",
      ownerId: "movie-b",
      objectKey: "taxonomy-images/movie/movie-b/3.webp",
    },
    // A different owner type sharing the same owner id.
    {
      id: "4",
      ownerType: "book",
      ownerId: "movie-a",
      objectKey: "taxonomy-images/book/movie-a/4.webp",
    },
  ]);

  await deleteTaxonomyImagesForOwner("movie", "movie-a");

  assert.deepEqual(deletedKeys.sort(), [
    "taxonomy-images/movie/movie-a/1.webp",
    "taxonomy-images/movie/movie-a/2.webp",
  ]);
  // The other movie's row and the same-id-different-type row both survive.
  assert.deepEqual(rows.map(row => row.id).sort(), ["3", "4"]);
});

test("deleteTaxonomyImagesForOwner is a no-op (no object deletes) when the owner has no images", async () => {
  deletedKeys.length = 0;
  resetRows([
    {
      id: "1",
      ownerType: "movie",
      ownerId: "movie-b",
      objectKey: "taxonomy-images/movie/movie-b/1.webp",
    },
  ]);

  await deleteTaxonomyImagesForOwner("movie", "movie-a");

  assert.deepEqual(deletedKeys, []);
  assert.deepEqual(rows.map(row => row.id), ["1"]);
});
