import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as schema from "@/db/schema";
import type { BookmarkRow } from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

// bookmarkHydration.ts reaches for the module-level `db` singleton directly, so it needs
// `mock.module("@/db", ...)` installed *before* the dynamic import below (ES module imports are
// cached process-wide). resolveDefaultCategoryId/loadLanguageUsages/loadEntityNames are stubbed
// directly rather than modeled in the fake db — they're out of scope for this file and stubbing
// them keeps the fixture surface focused on hydration's own grouping/precedence logic.

const fakeDb = createFakeDb();

mock.module("@/db", {
  namedExports: {
    db: fakeDb.db,
  },
});
mock.module("@/services/categories", {
  namedExports: {
    resolveDefaultCategoryId: async () => "default-cat-id",
  },
});
mock.module("@/services/languageUsages", {
  namedExports: {
    loadLanguageUsages: async () => new Map(),
  },
});
mock.module("@/services/entityNames", {
  namedExports: {
    loadEntityNames: async () => new Map(),
  },
});

const {
  hydrateBookmarkRows,
} = await import("@/services/bookmarkHydration");

function makeBookmarkRow(overrides: Partial<BookmarkRow> & { id: string }): BookmarkRow {
  return {
    url: null,
    originalUrl: null,
    title: "Untitled",
    description: null,
    categoryId: null,
    websiteId: null,
    mediaTypeId: null,
    youtubeChannelId: null,
    newsletterId: null,
    importId: null,
    groupId: null,
    kavitaSeriesId: null,
    kavitaLibraryId: null,
    kavitaSeriesName: null,
    plexRatingKey: null,
    plexItemType: null,
    plexItemTitle: null,
    isbn: null,
    year: null,
    wikidataId: null,
    wikipediaLinkEn: null,
    wikipediaLinkLocal: null,
    feedUrl: null,
    itunesId: null,
    itunesUrl: null,
    spotifyUrl: null,
    pocketCastsUuid: null,
    pocketCastsUrl: null,
    defaultLinkProvider: null,
    priority: 0,
    imageAutoGrabError: null,
    imageDisplayPreference: null,
    migrationSource: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: null,
    ...overrides,
  } as BookmarkRow;
}

function resetFixtures(): void {
  fakeDb.reset();
  // Every batched *ByBookmarkId / lookup table defaults to empty so a test only has to register
  // the rows it actually cares about.
  for (const table of [
    schema.bookmarkTags,
    schema.genreMoodAssignments,
    schema.bookmarkLocations,
    schema.bookmarkTagBlacklist,
    schema.bookmarkLocationBlacklist,
    schema.bookmarkPeople,
    schema.bookmarkGroups,
    schema.bookmarkNumberValues,
    schema.bookmarkBooleanValues,
    schema.bookmarkDateTimeValues,
    schema.bookmarkChoicesValues,
    schema.bookmarkProgressValues,
    schema.bookmarkSectionsValues,
    schema.bookmarkTextValues,
    schema.bookmarkFileValues,
    schema.bookmarkImages,
    schema.bookmarkScreenshots,
    schema.bookmarkReelArchives,
    schema.bookmarkRelationships,
    schema.websites,
    schema.mediaTypes,
    schema.youtubeChannels,
    schema.newsletters,
    schema.groups,
    schema.imports,
    schema.bookmarks,
  ]) {
    fakeDb.setRows(table, []);
  }
}

test("hydrateBookmarkRows returns [] immediately for an empty input, with no queries needed", async () => {
  resetFixtures();
  const result = await hydrateBookmarkRows([]);
  assert.deepEqual(result, []);
});

test("hydrateBookmarkRows fills every relation with its empty shape when nothing is related", async () => {
  resetFixtures();
  const row = makeBookmarkRow({
    id: "bm-1",
  });
  const [bookmark] = await hydrateBookmarkRows([row]);
  assert.equal(bookmark.categoryId, "default-cat-id");
  assert.equal(bookmark.website, null);
  assert.equal(bookmark.mediaType, null);
  assert.equal(bookmark.youtubeChannel, null);
  assert.equal(bookmark.newsletter, null);
  assert.equal(bookmark.group, null);
  assert.equal(bookmark.import, null);
  assert.equal(bookmark.image, null);
  assert.equal(bookmark.screenshot, null);
  assert.equal(bookmark.reelArchive, null);
  assert.deepEqual(bookmark.tags, []);
  assert.deepEqual(bookmark.genreMoods, []);
  assert.deepEqual(bookmark.locations, []);
  assert.deepEqual(bookmark.blacklistedTagIds, []);
  assert.deepEqual(bookmark.blacklistedLocationIds, []);
  assert.deepEqual(bookmark.people, []);
  assert.deepEqual(bookmark.groups, []);
  assert.deepEqual(bookmark.numberValues, []);
  assert.deepEqual(bookmark.booleanValues, []);
  assert.deepEqual(bookmark.dateTimeValues, []);
  assert.deepEqual(bookmark.choicesValues, []);
  assert.deepEqual(bookmark.progressValues, []);
  assert.deepEqual(bookmark.sectionsValues, []);
  assert.deepEqual(bookmark.textValues, []);
  assert.deepEqual(bookmark.fileValues, []);
  assert.deepEqual(bookmark.images, []);
  assert.deepEqual(bookmark.relationships, []);
});

test("hydrateBookmarkRows uses the bookmark's own categoryId when it has one", async () => {
  resetFixtures();
  const row = makeBookmarkRow({
    id: "bm-1",
    categoryId: "cat-explicit",
  });
  const [bookmark] = await hydrateBookmarkRows([row]);
  assert.equal(bookmark.categoryId, "cat-explicit");
});

test("hydrateBookmarkRows resolves a dangling FK to null instead of throwing", async () => {
  resetFixtures();
  // websiteId points at a website that doesn't exist in the fixture.
  fakeDb.setRows(schema.websites, []);
  const row = makeBookmarkRow({
    id: "bm-1",
    websiteId: "missing-website",
    mediaTypeId: "missing-media-type",
  });
  const [bookmark] = await hydrateBookmarkRows([row]);
  assert.equal(bookmark.website, null);
  assert.equal(bookmark.mediaType, null);
});

test("hydrateBookmarkRows picks the isMain image even when it isn't first, and keeps every image", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarkImages, [
    {
      id: "img-1",
      bookmarkId: "bm-1",
      objectKey: "bookmarks/bm-1/img-1.webp",
      contentType: "image/webp",
      width: 100,
      height: 100,
      byteSize: 1000,
      source: "upload",
      isMain: false,
      sortOrder: 0,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    },
    {
      id: "img-2",
      bookmarkId: "bm-1",
      objectKey: "bookmarks/bm-1/img-2.webp",
      contentType: "image/webp",
      width: 100,
      height: 100,
      byteSize: 1000,
      source: "upload",
      isMain: false,
      sortOrder: 1,
      createdAt: new Date("2024-01-02T00:00:00.000Z"),
    },
    {
      id: "img-3",
      bookmarkId: "bm-1",
      objectKey: "bookmarks/bm-1/img-3.webp",
      contentType: "image/webp",
      width: 100,
      height: 100,
      byteSize: 1000,
      source: "upload",
      isMain: true,
      sortOrder: 2,
      createdAt: new Date("2024-01-03T00:00:00.000Z"),
    },
  ]);
  const row = makeBookmarkRow({
    id: "bm-1",
  });
  const [bookmark] = await hydrateBookmarkRows([row]);
  assert.equal(bookmark.image?.id, "img-3");
  assert.deepEqual(bookmark.images.map(img => img.id), ["img-1", "img-2", "img-3"]);
});

test("hydrateBookmarkRows never bleeds one bookmark's relations into another's", async () => {
  resetFixtures();
  // The fake db resolves a query by its FROM table only (it doesn't merge join columns), so a
  // fixture standing in for a joined query must already carry the joined columns pre-merged, as if
  // the join had already run — here, tagsByBookmarkId selects from bookmarkTags joined to tags.
  fakeDb.setRows(schema.bookmarkTags, [
    {
      bookmarkId: "bm-1",
      tagId: "tag-a",
      id: "tag-a",
      name: "Tag A",
      slug: "tag-a",
      parentId: null,
      editableOnCard: false,
    },
    {
      bookmarkId: "bm-2",
      tagId: "tag-b",
      id: "tag-b",
      name: "Tag B",
      slug: "tag-b",
      parentId: null,
      editableOnCard: false,
    },
  ]);
  const rows = [
    makeBookmarkRow({
      id: "bm-1",
    }),
    makeBookmarkRow({
      id: "bm-2",
    }),
  ];
  const [bm1, bm2] = await hydrateBookmarkRows(rows);
  assert.deepEqual(bm1.tags.map(t => t.id), ["tag-a"]);
  assert.deepEqual(bm2.tags.map(t => t.id), ["tag-b"]);
});

// relationshipsByBookmarkId: `addTo(ownId, otherId, ownIsParent)` records the *other* bookmark's
// role relative to `ownId`. Confirmed against source (not assumed from the "child"/"parent"
// naming): for a directional relationship type, bookmark A (bookmarkAId) is told the other side is
// its "child", and bookmark B (bookmarkBId) is told the other side is its "parent".

// relationshipsByBookmarkId's query selects from bookmarkRelationships joined to relationshipTypes;
// since the fake db resolves by FROM table only (no join merge), the joined typeName/directional
// columns are embedded directly in the bookmarkRelationships fixture rows below.
function relationshipRow(overrides: Partial<{ bookmarkAId: string;
  bookmarkBId: string;
  relationshipTypeId: string;
  label: string | null;
  typeName: string;
  directional: boolean; }> = {}) {
  return {
    bookmarkAId: "bm-1",
    bookmarkBId: "bm-2",
    relationshipTypeId: "rel-type-1",
    label: null,
    typeName: "Parent/child",
    directional: true,
    ...overrides,
  };
}

test("relationshipsByBookmarkId: both early-return paths yield an empty relationships list", async () => {
  resetFixtures();
  // Path 1: bookmarkIds is empty — hydrateBookmarkRows([]) already covers this via test #1, but
  // relationshipsByBookmarkId also short-circuits when the batch itself is non-empty but has no
  // relationship rows at all (path 2, exercised here).
  const row = makeBookmarkRow({
    id: "bm-1",
  });
  const [bookmark] = await hydrateBookmarkRows([row]);
  assert.deepEqual(bookmark.relationships, []);
});

test("relationshipsByBookmarkId: non-directional type gives both sides role 'related'", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarkRelationships, [relationshipRow({
    directional: false,
  })]);
  fakeDb.setRows(schema.bookmarks, [
    {
      id: "bm-1",
      url: null,
      title: "Bookmark 1",
    },
    {
      id: "bm-2",
      url: null,
      title: "Bookmark 2",
    },
  ]);
  const rows = [
    makeBookmarkRow({
      id: "bm-1",
    }),
    makeBookmarkRow({
      id: "bm-2",
    }),
  ];
  const [bm1, bm2] = await hydrateBookmarkRows(rows);
  assert.equal(bm1.relationships[0].role, "related");
  assert.equal(bm2.relationships[0].role, "related");
});

test("relationshipsByBookmarkId: directional type — A sees the other as 'child', B sees the other as 'parent'", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarkRelationships, [relationshipRow({
    directional: true,
  })]);
  fakeDb.setRows(schema.bookmarks, [
    {
      id: "bm-1",
      url: null,
      title: "Bookmark 1",
    },
    {
      id: "bm-2",
      url: null,
      title: "Bookmark 2",
    },
  ]);
  const rows = [
    makeBookmarkRow({
      id: "bm-1",
    }),
    makeBookmarkRow({
      id: "bm-2",
    }),
  ];
  const [bm1, bm2] = await hydrateBookmarkRows(rows);
  assert.equal(bm1.relationships[0].role, "child");
  assert.equal(bm1.relationships[0].bookmark.id, "bm-2");
  assert.equal(bm2.relationships[0].role, "parent");
  assert.equal(bm2.relationships[0].bookmark.id, "bm-1");
});

test("relationshipsByBookmarkId: a dangling 'other' bookmark is silently dropped, not thrown", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarkRelationships, [relationshipRow({
    bookmarkBId: "bm-missing",
  })]);
  // bm-missing never appears in the bookmarks fixture.
  fakeDb.setRows(schema.bookmarks, [{
    id: "bm-1",
    url: null,
    title: "Bookmark 1",
  }]);
  const row = makeBookmarkRow({
    id: "bm-1",
  });
  const [bookmark] = await hydrateBookmarkRows([row]);
  assert.deepEqual(bookmark.relationships, []);
});

test("relationshipsByBookmarkId: only the in-batch side of an edge gets a relationships entry", async () => {
  resetFixtures();
  // bm-2 is the "other" side of the edge but is not part of the hydrated batch.
  fakeDb.setRows(schema.bookmarkRelationships, [relationshipRow({
    directional: false,
  })]);
  fakeDb.setRows(schema.bookmarks, [
    {
      id: "bm-1",
      url: null,
      title: "Bookmark 1",
    },
    {
      id: "bm-2",
      url: null,
      title: "Bookmark 2",
    },
  ]);
  const row = makeBookmarkRow({
    id: "bm-1",
  });
  const [bookmark] = await hydrateBookmarkRows([row]);
  assert.equal(bookmark.relationships.length, 1);
  assert.equal(bookmark.relationships[0].bookmark.id, "bm-2");
});
