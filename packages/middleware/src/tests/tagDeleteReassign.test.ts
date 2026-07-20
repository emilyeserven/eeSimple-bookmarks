import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { SectionEntry } from "@eesimple/types";
import {
  bookmarkSectionsValues,
  bookmarkTags,
  entityNames,
  tags,
  taxonomyAssignments,
} from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `deleteTag`'s reassignment path is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`) — this suite has no live-Postgres harness. The whole path uses only the
 * query-builder surface the fake db understands (`select`/`insert`/`update`/`delete` with `eq` /
 * `and(eq, eq)` conditions), so no raw `execute` override is needed. `mock.module` swaps `@/db`
 * before the service module is first imported.
 *
 * The fake db has no FK cascade, so these tests assert only what `deleteTag` writes explicitly (the
 * bookmark-tag reassignment, the section-tag rewrite, the tag-row removal) — the descendant-tag /
 * leftover-link cascade is Postgres's job and out of scope here.
 */

const tagRows: Record<string, unknown>[] = [];
const bookmarkTagRows: Record<string, unknown>[] = [];
const sectionRows: Record<string, unknown>[] = [];
const assignmentRows: Record<string, unknown>[] = [];
const entityNameRows: Record<string, unknown>[] = [];

function resetRows(opts: {
  tags?: Record<string, unknown>[];
  bookmarkTags?: Record<string, unknown>[];
  sections?: Record<string, unknown>[];
} = {}): void {
  resetFakeIds();
  tagRows.length = 0;
  tagRows.push(...(opts.tags ?? []));
  bookmarkTagRows.length = 0;
  bookmarkTagRows.push(...(opts.bookmarkTags ?? []));
  sectionRows.length = 0;
  sectionRows.push(...(opts.sections ?? []));
  assignmentRows.length = 0;
  entityNameRows.length = 0;
}

const db = createFakeDb([
  {
    table: tags,
    rows: tagRows,
  },
  {
    table: bookmarkTags,
    rows: bookmarkTagRows,
  },
  {
    table: bookmarkSectionsValues,
    rows: sectionRows,
  },
  {
    table: taxonomyAssignments,
    rows: assignmentRows,
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

const {
  InvalidTagReassignError,
  deleteTag,
} = await import("@/services/tags");
const {
  bookmarkCacheVersion,
} = await import("@/services/bookmarkCacheVersion");

/** A tier-1 section entry fixture with optional tags/children. */
function section(id: string, tagIds?: string[], children?: SectionEntry[]): SectionEntry {
  return {
    id,
    name: id,
    type: "page",
    startValue: "",
    ...(tagIds
      ? {
        tagIds,
      }
      : {}),
    ...(children
      ? {
        children,
      }
      : {}),
  };
}

const tagFixtures = [
  {
    id: "t-parent",
    name: "Parent",
    parentId: null,
  },
  {
    id: "t-child",
    name: "Child",
    parentId: "t-parent",
  },
  {
    id: "t-target",
    name: "Target",
    parentId: null,
  },
  {
    id: "t-other",
    name: "Other",
    parentId: null,
  },
];

test.beforeEach(() => {
  resetRows();
});

test("deleteTag: a missing id returns false with no writes", async () => {
  resetRows({
    tags: [...tagFixtures],
  });
  const versionBefore = bookmarkCacheVersion();
  const deleted = await deleteTag("nonexistent-id", "t-target");
  assert.equal(deleted, false);
  assert.equal(bookmarkCacheVersion(), versionBefore);
});

test("deleteTag: reassignTo === id is rejected", async () => {
  resetRows({
    tags: [...tagFixtures],
  });
  await assert.rejects(() => deleteTag("t-parent", "t-parent"), InvalidTagReassignError);
});

test("deleteTag: reassignTo pointing at a descendant (in the deleted subtree) is rejected", async () => {
  resetRows({
    tags: [...tagFixtures],
  });
  await assert.rejects(() => deleteTag("t-parent", "t-child"), InvalidTagReassignError);
});

test("deleteTag: reassignTo pointing at a nonexistent tag is rejected", async () => {
  resetRows({
    tags: [...tagFixtures],
  });
  await assert.rejects(() => deleteTag("t-parent", "missing-target"), InvalidTagReassignError);
});

test("deleteTag: no reassignTo removes the tag and returns true", async () => {
  resetRows({
    tags: [...tagFixtures],
  });
  const deleted = await deleteTag("t-parent");
  assert.equal(deleted, true);
  assert.equal(tagRows.some(row => row.id === "t-parent"), false);
});

test("deleteTag: reassigns the whole subtree's bookmark memberships, deduping an existing target", async () => {
  resetRows({
    tags: [...tagFixtures],
    bookmarkTags: [
      {
        bookmarkId: "bm-1",
        tagId: "t-parent",
      },
      // A descendant-tag link is also reassigned (whole-subtree scope).
      {
        bookmarkId: "bm-2",
        tagId: "t-child",
      },
      // bm-3 already carries the target — its subtree link is dropped, no duplicate inserted.
      {
        bookmarkId: "bm-3",
        tagId: "t-parent",
      },
      {
        bookmarkId: "bm-3",
        tagId: "t-target",
      },
      // An unrelated tag's link is untouched.
      {
        bookmarkId: "bm-4",
        tagId: "t-other",
      },
    ],
  });

  const deleted = await deleteTag("t-parent", "t-target");
  assert.equal(deleted, true);

  const pairs = bookmarkTagRows
    .map(row => `${row.bookmarkId as string}:${row.tagId as string}`)
    .sort();
  assert.deepEqual(pairs, [
    "bm-1:t-target",
    "bm-2:t-target",
    "bm-3:t-target",
    "bm-4:t-other",
  ]);
  // No bookmark carries more than one row for the target (the PK dedup held).
  const targetForBm3 = bookmarkTagRows.filter(
    row => row.bookmarkId === "bm-3" && row.tagId === "t-target",
  );
  assert.equal(targetForBm3.length, 1);
});

test("deleteTag: rewrites section tag references across the subtree to the target", async () => {
  resetRows({
    tags: [...tagFixtures],
    sections: [
      {
        bookmarkId: "bm-2",
        propertyId: "prop-1",
        sections: [section("s1", ["t-parent"], [section("c1", ["t-child"])])],
      },
      // A row referencing only an unrelated tag is left exactly as-is.
      {
        bookmarkId: "bm-9",
        propertyId: "prop-1",
        sections: [section("s9", ["t-other"])],
      },
    ],
  });

  const deleted = await deleteTag("t-parent", "t-target");
  assert.equal(deleted, true);

  const changed = sectionRows.find(row => row.bookmarkId === "bm-2");
  const changedSections = changed?.sections as SectionEntry[];
  assert.deepEqual(changedSections[0]?.tagIds, ["t-target"]);
  assert.deepEqual(changedSections[0]?.children?.[0]?.tagIds, ["t-target"]);

  const untouched = sectionRows.find(row => row.bookmarkId === "bm-9");
  const untouchedSections = untouched?.sections as SectionEntry[];
  assert.deepEqual(untouchedSections[0]?.tagIds, ["t-other"]);
});

test("deleteTag: bumps the bookmark cache version on a successful reassign-delete", async () => {
  resetRows({
    tags: [...tagFixtures],
  });
  const versionBefore = bookmarkCacheVersion();
  await deleteTag("t-parent", "t-target");
  assert.ok(bookmarkCacheVersion() > versionBefore);
});
