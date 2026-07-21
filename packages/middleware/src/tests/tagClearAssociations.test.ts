import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { SectionEntry } from "@eesimple/types";
import {
  bookmarkSectionsValues,
  bookmarkTags,
  tags,
} from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `removeTagBookmarkAssociations` clears a non-leaf tag's OWN associations without deleting the tag —
 * exercised against the shared in-memory fake `db` (`testDbHelpers.ts`), same as `tagDeleteReassign`.
 * The whole path uses only the query-builder surface the fake db understands. Scope is own-only, so
 * these tests assert a child tag's links/section refs survive while the tag itself is never removed.
 */

const tagRows: Record<string, unknown>[] = [];
const bookmarkTagRows: Record<string, unknown>[] = [];
const sectionRows: Record<string, unknown>[] = [];

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
]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  removeTagBookmarkAssociations,
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
    id: "t-other",
    name: "Other",
    parentId: null,
  },
];

test.beforeEach(() => {
  resetRows();
});

test("removeTagBookmarkAssociations: a missing id returns false with no cache bump", async () => {
  resetRows({
    tags: [...tagFixtures],
  });
  const versionBefore = bookmarkCacheVersion();
  const removed = await removeTagBookmarkAssociations("nonexistent-id");
  assert.equal(removed, false);
  assert.equal(bookmarkCacheVersion(), versionBefore);
});

test("removeTagBookmarkAssociations: drops the tag's own links, keeping child + unrelated links", async () => {
  resetRows({
    tags: [...tagFixtures],
    bookmarkTags: [
      {
        bookmarkId: "bm-1",
        tagId: "t-parent",
      },
      // A child-tag link survives (own-only scope, not subtree).
      {
        bookmarkId: "bm-2",
        tagId: "t-child",
      },
      // An unrelated tag's link is untouched.
      {
        bookmarkId: "bm-3",
        tagId: "t-other",
      },
    ],
  });

  const removed = await removeTagBookmarkAssociations("t-parent");
  assert.equal(removed, true);

  const pairs = bookmarkTagRows
    .map(row => `${row.bookmarkId as string}:${row.tagId as string}`)
    .sort();
  assert.deepEqual(pairs, [
    "bm-2:t-child",
    "bm-3:t-other",
  ]);
});

test("removeTagBookmarkAssociations: keeps the tag row and its children", async () => {
  resetRows({
    tags: [...tagFixtures],
    bookmarkTags: [
      {
        bookmarkId: "bm-1",
        tagId: "t-parent",
      },
    ],
  });

  await removeTagBookmarkAssociations("t-parent");
  assert.equal(tagRows.some(row => row.id === "t-parent"), true);
  assert.equal(tagRows.some(row => row.id === "t-child"), true);
});

test("removeTagBookmarkAssociations: strips this tag's section refs, keeping child + unrelated refs", async () => {
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

  const removed = await removeTagBookmarkAssociations("t-parent");
  assert.equal(removed, true);

  const changed = sectionRows.find(row => row.bookmarkId === "bm-2");
  const changedSections = changed?.sections as SectionEntry[];
  // The tag's own ref is dropped...
  assert.deepEqual(changedSections[0]?.tagIds, []);
  // ...but the child tag's section ref survives (own-only scope).
  assert.deepEqual(changedSections[0]?.children?.[0]?.tagIds, ["t-child"]);

  const untouched = sectionRows.find(row => row.bookmarkId === "bm-9");
  const untouchedSections = untouched?.sections as SectionEntry[];
  assert.deepEqual(untouchedSections[0]?.tagIds, ["t-other"]);
});

test("removeTagBookmarkAssociations: bumps the bookmark cache version on success", async () => {
  resetRows({
    tags: [...tagFixtures],
  });
  const versionBefore = bookmarkCacheVersion();
  await removeTagBookmarkAssociations("t-parent");
  assert.ok(bookmarkCacheVersion() > versionBefore);
});
