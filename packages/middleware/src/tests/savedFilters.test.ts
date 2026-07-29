import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { Bookmark } from "@eesimple/types";
import { savedFilters } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/savedFilters.ts` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`) — this suite has no live-Postgres harness. `mock.module` swaps `@/db` before
 * the service module is first imported (ESM import caching), so the mock must be installed up front.
 * The bookmark cache + hydration are mocked as seams (the homepageSections.test.ts precedent); the
 * shared `@eesimple/types` predicates themselves are not retested here — only how the list wires
 * into them for the per-filter `bookmarkCount`.
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

// Identity resolver — subtree-cascade tests override per call.
const identityDescendants = (id: string) => new Set([id]);

let baseRows: { id: string }[] = [];
let hydratedBookmarks: Bookmark[] = [];
let evaluationDataCalls = 0;

mock.module("@/services/bookmarkCache", {
  namedExports: {
    getBookmarkEvaluationData: async () => {
      evaluationDataCalls++;
      return {
        baseRows,
        tagDescendants: identityDescendants,
      };
    },
  },
});
mock.module("@/services/bookmarkHydration", {
  namedExports: {
    hydrateBookmarkRows: async (_rows: { id: string }[]) => hydratedBookmarks,
  },
});

const {
  countBookmarksMatchingFilter,
  deleteSavedFilter,
  listSavedFilters,
} = await import("@/services/savedFilters");

/** Minimal bookmark carrying every field the shared search facets read. */
function fakeBookmark(overrides: Partial<Bookmark>): Bookmark {
  return {
    id: "b1",
    categoryId: null,
    mediaType: null,
    youtubeChannel: null,
    website: null,
    tags: [],
    genreMoods: [],
    locations: [],
    people: [],
    numberValues: [],
    booleanValues: [],
    dateTimeValues: [],
    fileValues: [],
    progressValues: [],
    choicesValues: [],
    sectionsValues: [],
    relationships: [],
    languageUsages: [],
    plexRatingKey: null,
    kavitaSeriesId: null,
    isbn: null,
    feedUrl: null,
    hasFillableFields: false,
    hasAnyFillableField: false,
    ...overrides,
  } as unknown as Bookmark;
}

function savedFilterRow(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "sf-1",
    name: "Filter",
    slug: "filter",
    description: null,
    filters: {},
    viewableOnline: false,
    isFavorite: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test.beforeEach(() => {
  resetRows();
  baseRows = [];
  hydratedBookmarks = [];
  evaluationDataCalls = 0;
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

test("listSavedFilters: attaches per-filter bookmarkCount via the shared search predicate", async () => {
  resetRows([
    savedFilterRow({
      id: "sf-all",
      name: "All",
      slug: "all",
      filters: {},
    }),
    savedFilterRow({
      id: "sf-cat",
      name: "Dev only",
      slug: "dev-only",
      filters: {
        categories: ["c1"],
      },
    }),
  ]);
  baseRows = [{
    id: "b1",
  }, {
    id: "b2",
  }];
  hydratedBookmarks = [
    fakeBookmark({
      id: "b1",
      categoryId: "c1",
    }),
    fakeBookmark({
      id: "b2",
      categoryId: "c2",
    }),
  ];

  const filters = await listSavedFilters();
  // Name-ordered: "All" first, "Dev only" second.
  assert.deepEqual(filters.map(f => [f.id, f.bookmarkCount]), [["sf-all", 2], ["sf-cat", 1]]);
});

test("listSavedFilters: an empty table skips loading bookmarks entirely", async () => {
  const filters = await listSavedFilters();
  assert.deepEqual(filters, []);
  assert.equal(evaluationDataCalls, 0);
});

test("countBookmarksMatchingFilter: tag inclusion is expanded to the tag's whole subtree", () => {
  const bookmarks = [
    fakeBookmark({
      id: "b-child",
      tags: [{
        id: "t-child",
      }] as Bookmark["tags"],
    }),
    fakeBookmark({
      id: "b-other",
      tags: [{
        id: "t-other",
      }] as Bookmark["tags"],
    }),
  ];
  const tagDescendants = (id: string) =>
    id === "t-parent" ? new Set(["t-parent", "t-child"]) : new Set([id]);

  assert.equal(countBookmarksMatchingFilter({
    tags: ["t-parent"],
  }, bookmarks, tagDescendants), 1);
});
