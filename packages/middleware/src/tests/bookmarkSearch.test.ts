import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { Bookmark } from "@eesimple/types";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

// searchBookmarks wires together the hydrated-bookmark cache (built via hydrateBookmarkRows), the
// evaluation cache's descendant resolvers, and the shared @eesimple/types predicates. The predicates
// themselves (bookmarkMatchesSearch/bookmarkMatchesText/bookmarkMatchesScope/sortBookmarks) are
// covered in @eesimple/types, per the what-not-to-test skill — this suite pins how the service wires
// into them: scope → tag inclusion → facets → text → sort → slice → fresh page hydration, plus the
// version-keyed memoization of the hydrated cache.

const fakeDb = createFakeDb();

// Identity resolver by default; individual tests override with a real subtree.
const identityDescendants = (id: string) => new Set([id]);
let tagDescendants = identityDescendants;

const hydrateCalls: { rows: { id: string }[] }[] = [];

mock.module("@/db", {
  namedExports: {
    db: fakeDb.db,
  },
});
mock.module("@/services/bookmarkCache", {
  namedExports: {
    getBookmarkEvaluationData: async () => ({
      tagDescendants,
      locationDescendants: identityDescendants,
      taxonomyTermDescendants: identityDescendants,
    }),
  },
});
mock.module("@/services/bookmarkHydration", {
  namedExports: {
    // The fixtures registered on schema.bookmarks already ARE bookmark-shaped, so hydration is the
    // identity — the seam only records what it was asked to hydrate.
    hydrateBookmarkRows: async (rows: { id: string }[]) => {
      hydrateCalls.push({
        rows,
      });
      return rows as unknown as Bookmark[];
    },
  },
});
mock.module("@/services/customProperties", {
  namedExports: {
    listCustomProperties: async () => [],
  },
});

const {
  resetHydratedBookmarkCache,
  searchBookmarks,
} = await import("@/services/bookmarkSearchService");
const {
  invalidateBookmarkCache,
} = await import("@/services/bookmarkCacheVersion");

function makeFakeBookmark(overrides: Partial<Bookmark> & { id: string }): Bookmark {
  return {
    url: null,
    title: overrides.id,
    description: null,
    categoryId: null,
    mediaType: null,
    website: null,
    youtubeChannel: null,
    import: null,
    names: [],
    tags: [],
    genreMoods: [],
    taxonomyTerms: [],
    locations: [],
    people: [],
    groups: [],
    numberValues: [],
    booleanValues: [],
    dateTimeValues: [],
    choicesValues: [],
    progressValues: [],
    sectionsValues: [],
    textValues: [],
    fileValues: [],
    relationships: [],
    languageUsages: [],
    plexRatingKey: null,
    kavitaSeriesId: null,
    isbn: null,
    feedUrl: null,
    hasFillableFields: false,
    hasAnyFillableField: false,
    priority: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: null,
    ...overrides,
  } as unknown as Bookmark;
}

function reset(rows: Bookmark[]): void {
  fakeDb.reset();
  fakeDb.setRows(schema.bookmarks, rows);
  tagDescendants = identityDescendants;
  hydrateCalls.length = 0;
  // Each test starts from a cold hydrated cache AND a fresh version.
  resetHydratedBookmarkCache();
  invalidateBookmarkCache();
}

test("free text matches descriptions and section names, and reports the pre-slice total", async () => {
  reset([
    makeFakeBookmark({
      id: "b-desc",
      description: "An essay about seahorses.",
    }),
    makeFakeBookmark({
      id: "b-section",
      sectionsValues: [{
        propertyId: "p1",
        exhaustive: false,
        sections: [{
          id: "s1",
          name: "Seahorse chapter",
          type: "name",
          startValue: "",
        }],
      }],
    }),
    makeFakeBookmark({
      id: "b-other",
      title: "Unrelated",
    }),
  ]);

  const result = await searchBookmarks({
    search: {},
    q: "seahorse",
    offset: 0,
    limit: 10,
  });
  assert.deepEqual(result.bookmarks.map(b => b.id), ["b-desc", "b-section"]);
  assert.equal(result.total, 2);
});

test("offset/limit slice the sorted set; total stays the full match count", async () => {
  reset(["b1", "b2", "b3", "b4", "b5"].map(id => makeFakeBookmark({
    id,
  })));

  const page2 = await searchBookmarks({
    search: {},
    offset: 2,
    limit: 2,
  });
  assert.deepEqual(page2.bookmarks.map(b => b.id), ["b3", "b4"]);
  assert.equal(page2.total, 5);

  const beyond = await searchBookmarks({
    search: {},
    offset: 10,
    limit: 2,
  });
  assert.deepEqual(beyond.bookmarks, []);
  assert.equal(beyond.total, 5);
});

test("an explicit sort orders via the shared engine before slicing", async () => {
  reset([
    makeFakeBookmark({
      id: "b-b",
      title: "Banana",
    }),
    makeFakeBookmark({
      id: "b-a",
      title: "Apple",
    }),
    makeFakeBookmark({
      id: "b-c",
      title: "Cherry",
    }),
  ]);

  const result = await searchBookmarks({
    search: {
      sort: {
        primary: {
          field: "title",
          direction: "asc",
        },
      },
    },
    offset: 0,
    limit: 2,
  });
  assert.deepEqual(result.bookmarks.map(b => b.id), ["b-a", "b-b"]);
  assert.equal(result.total, 3);
});

test("tag inclusion expands each selected tag to its subtree (and is skipped in exclude mode)", async () => {
  const rows = [
    makeFakeBookmark({
      id: "b-child-tag",
      tags: [{
        id: "t-child",
      }] as Bookmark["tags"],
    }),
    makeFakeBookmark({
      id: "b-untagged",
    }),
  ];
  reset(rows);
  tagDescendants = id => (id === "t-root" ? new Set(["t-root", "t-child"]) : new Set([id]));

  const included = await searchBookmarks({
    search: {
      tags: ["t-root"],
    },
    offset: 0,
    limit: 10,
  });
  assert.deepEqual(included.bookmarks.map(b => b.id), ["b-child-tag"]);

  // In exclude mode inclusion is skipped; the shared facet keeps only bookmarks without the exact tags.
  const excluded = await searchBookmarks({
    search: {
      tags: ["t-child"],
      tagPresence: "exclude",
    },
    offset: 0,
    limit: 10,
  });
  assert.deepEqual(excluded.bookmarks.map(b => b.id), ["b-untagged"]);
});

test("scope narrows before facets/text, and numberBounds cover the scoped (pre-facet) set", async () => {
  reset([
    makeFakeBookmark({
      id: "b-in-1",
      categoryId: "cat-1",
      title: "Alpha",
      numberValues: [{
        propertyId: "prop-n",
        value: 5,
      }] as Bookmark["numberValues"],
    }),
    makeFakeBookmark({
      id: "b-in-2",
      categoryId: "cat-1",
      title: "Beta",
      numberValues: [{
        propertyId: "prop-n",
        value: 10,
      }] as Bookmark["numberValues"],
    }),
    makeFakeBookmark({
      id: "b-out",
      categoryId: "cat-2",
      title: "Alpha too",
      numberValues: [{
        propertyId: "prop-n",
        value: 99,
      }] as Bookmark["numberValues"],
    }),
  ]);

  const result = await searchBookmarks({
    search: {},
    q: "alpha",
    offset: 0,
    limit: 10,
    scope: {
      kind: "category",
      id: "cat-1",
    },
  });
  // Text narrowed to Alpha within the category scope — the out-of-scope Alpha never matches.
  assert.deepEqual(result.bookmarks.map(b => b.id), ["b-in-1"]);
  assert.equal(result.total, 1);
  // Bounds span the whole scoped set (both cat-1 bookmarks), not just the text matches.
  assert.deepEqual(result.numberBounds, {
    "prop-n": [5, 10],
  });
});

test("the hydrated cache is reused across searches and rebuilt after an invalidation", async () => {
  reset([makeFakeBookmark({
    id: "b1",
  })]);

  await searchBookmarks({
    search: {},
    offset: 0,
    limit: 10,
  });
  // Cold cache: one hydrate for the full set + one fresh hydrate for the page.
  assert.equal(hydrateCalls.length, 2);

  await searchBookmarks({
    search: {},
    offset: 0,
    limit: 10,
  });
  // Warm cache: only the fresh page hydration runs.
  assert.equal(hydrateCalls.length, 3);

  invalidateBookmarkCache();
  await searchBookmarks({
    search: {},
    offset: 0,
    limit: 10,
  });
  // Version bump: the full-set hydration runs again, plus the page hydration.
  assert.equal(hydrateCalls.length, 5);
});

test("an empty page skips the page re-select and returns no bookmarks", async () => {
  reset([]);
  const result = await searchBookmarks({
    search: {},
    offset: 0,
    limit: 10,
  });
  assert.deepEqual(result.bookmarks, []);
  assert.equal(result.total, 0);
  assert.deepEqual(result.numberBounds, {});
  // Only the cache build hydrated (with zero rows) — no page hydration call.
  assert.equal(hydrateCalls.length, 1);
});
