import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

// The merge computes every union set in JS from a pre-transaction snapshot (select-then-branch),
// so the fake db exercises the winner/loser logic directly: fixtures are the snapshot, and the
// recorded insert/update/delete calls are the assertions. The recompute hooks, cache invalidation,
// cleanup helpers, and hydrated re-read are mocked as seams (each covered by its own suite).

const fakeDb = createFakeDb();
let invalidateCalls = 0;
const cleanupCalls: { name: string;
  ids: string[]; }[] = [];
const recomputeCalls: string[] = [];
let getBookmarkCalls: string[] = [];

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
mock.module("@/services/bookmarkCleanup", {
  namedExports: {
    cleanupGenreMoodAssignments: async (ids: string[]) => {
      cleanupCalls.push({
        name: "genreMoods",
        ids,
      });
    },
    cleanupBookmarkEntityNames: async (ids: string[]) => {
      cleanupCalls.push({
        name: "entityNames",
        ids,
      });
    },
    cleanupBookmarkLanguageUsages: async (ids: string[]) => {
      cleanupCalls.push({
        name: "languageUsages",
        ids,
      });
    },
  },
});
mock.module("@/services/bookmarkCrud", {
  namedExports: {
    getBookmark: async (id: string) => {
      getBookmarkCalls.push(id);
      return {
        id,
      };
    },
  },
});
mock.module("@/services/bookmarkWrites", {
  namedExports: {
    recomputeCalculatedValues: async () => {
      recomputeCalls.push("calculated");
    },
    recomputeDerivedProgress: async () => {
      recomputeCalls.push("progress");
    },
  },
});
mock.module("@/services/bookmarkImages", {
  namedExports: {
    MAX_BOOKMARK_IMAGES: 12,
  },
});

const {
  mergeBookmarks, rewriteRelationshipEdges,
} = await import("@/services/bookmarkMerge");

const SURVIVOR = "00000000-0000-0000-0000-00000000000a";
const LOSER = "00000000-0000-0000-0000-00000000000b";
const LOSER_2 = "00000000-0000-0000-0000-00000000000c";
const OUTSIDE = "00000000-0000-0000-0000-00000000000d";

function bookmarkRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    url: null,
    title: `Bookmark ${id}`,
    description: null,
    isbn: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: null,
    ...overrides,
  };
}

const MERGE_TABLES = [
  schema.bookmarks,
  schema.bookmarkTags,
  schema.bookmarkTagBlacklist,
  schema.bookmarkLocations,
  schema.bookmarkLocationBlacklist,
  schema.bookmarkPeople,
  schema.bookmarkGroups,
  schema.autofillRuleExemptions,
  schema.bookmarkImages,
  schema.bookmarkRelationships,
  schema.relationshipTypes,
  schema.bookmarkNumberValues,
  schema.bookmarkBooleanValues,
  schema.bookmarkDateTimeValues,
  schema.bookmarkChoicesValues,
  schema.bookmarkProgressValues,
  schema.bookmarkSectionsValues,
  schema.bookmarkTextValues,
  schema.bookmarkFileValues,
  schema.taxonomyAssignments,
  schema.entityNames,
  schema.languageUsages,
  schema.mediaObjects,
  schema.importItems,
];

function resetFixtures(): void {
  fakeDb.reset();
  invalidateCalls = 0;
  cleanupCalls.length = 0;
  recomputeCalls.length = 0;
  getBookmarkCalls = [];
  for (const table of MERGE_TABLES) fakeDb.setRows(table, []);
  fakeDb.setRows(schema.bookmarks, [bookmarkRow(SURVIVOR), bookmarkRow(LOSER)]);
}

function insertsInto(table: unknown): unknown[] {
  return fakeDb.inserted.filter(call => call.table === table).flatMap(call => call.rows);
}

function updatesTo(table: unknown): unknown[] {
  return fakeDb.updated.filter(call => call.table === table).map(call => call.values);
}

test("rejects a survivor listed among the losers, duplicate losers, and bad field choices", async () => {
  resetFixtures();
  await assert.rejects(mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [SURVIVOR],
    fieldChoices: {},
  }), /survivorId must not appear/);
  await assert.rejects(mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER, LOSER],
    fieldChoices: {},
  }), /must not contain duplicates/);
  await assert.rejects(mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices: {
      title: OUTSIDE,
    },
  }), /fieldChoices.title must reference/);
});

test("rejects unknown bookmark ids with a not-found error", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, [bookmarkRow(SURVIVOR)]);
  await assert.rejects(mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices: {},
  }), /not found/i);
});

test("applies picked loser values, keeps unpicked survivor values, and swaps the url safely", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, [
    bookmarkRow(SURVIVOR, {
      url: "https://example.com/old",
      title: "Survivor title",
    }),
    bookmarkRow(LOSER, {
      url: "https://example.com/new",
      description: "Loser description",
    }),
  ]);
  await mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices: {
      url: LOSER,
      description: LOSER,
      title: SURVIVOR,
    },
  });
  const updates = updatesTo(schema.bookmarks) as Record<string, unknown>[];
  // First update frees the losers' urls (the bookmarks_url_unique dance), then the survivor patch.
  assert.deepEqual(updates[0], {
    url: null,
  });
  assert.equal(updates[1]!.url, "https://example.com/new");
  assert.equal(updates[1]!.description, "Loser description");
  assert.ok(!("title" in updates[1]!), "picking the survivor's own value adds nothing to the patch");
  assert.ok(updates[1]!.updatedAt instanceof Date);
});

test("an explicit pick of a loser's empty value is honored", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, [
    bookmarkRow(SURVIVOR, {
      description: "Keep me?",
    }),
    bookmarkRow(LOSER, {
      description: null,
    }),
  ]);
  await mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices: {
      description: LOSER,
    },
  });
  const updates = updatesTo(schema.bookmarks) as Record<string, unknown>[];
  assert.equal(updates[1]!.description, null);
});

test("unions join tables onto the survivor without duplicating shared rows", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarkTags, [
    {
      bookmarkId: SURVIVOR,
      tagId: "tag-shared",
    },
    {
      bookmarkId: LOSER,
      tagId: "tag-shared",
    },
    {
      bookmarkId: LOSER,
      tagId: "tag-only-loser",
    },
  ]);
  fakeDb.setRows(schema.bookmarkLocations, [
    {
      bookmarkId: LOSER,
      locationId: "loc-1",
      locationRelationId: "rel-1",
    },
  ]);
  await mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices: {},
  });
  assert.deepEqual(insertsInto(schema.bookmarkTags), [{
    bookmarkId: SURVIVOR,
    tagId: "tag-only-loser",
  }]);
  assert.deepEqual(insertsInto(schema.bookmarkLocations), [{
    bookmarkId: SURVIVOR,
    locationId: "loc-1",
    locationRelationId: "rel-1",
  }]);
});

test("property values union with the survivor's value winning a conflict", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, [
    bookmarkRow(SURVIVOR),
    bookmarkRow(LOSER),
    bookmarkRow(LOSER_2),
  ]);
  fakeDb.setRows(schema.bookmarkNumberValues, [
    {
      bookmarkId: SURVIVOR,
      propertyId: "prop-shared",
      value: 1,
      valueEnd: null,
    },
    {
      bookmarkId: LOSER,
      propertyId: "prop-shared",
      value: 2,
      valueEnd: null,
    },
    {
      bookmarkId: LOSER,
      propertyId: "prop-a",
      value: 3,
      valueEnd: null,
    },
    {
      bookmarkId: LOSER_2,
      propertyId: "prop-a",
      value: 4,
      valueEnd: null,
    },
  ]);
  await mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER, LOSER_2],
    fieldChoices: {},
  });
  // The survivor keeps prop-shared; prop-a comes from the first loser in loserIds order.
  assert.deepEqual(insertsInto(schema.bookmarkNumberValues), [{
    bookmarkId: SURVIVOR,
    propertyId: "prop-a",
    value: 3,
    valueEnd: null,
  }]);
  assert.deepEqual(recomputeCalls, ["calculated", "progress"]);
});

test("moves loser images up to the cap, promoting a main only when the survivor had none", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarkImages, [
    {
      id: "img-1",
      bookmarkId: LOSER,
      objectKey: "k1",
      isMain: true,
      sortOrder: 0,
    },
    {
      id: "img-2",
      bookmarkId: LOSER,
      objectKey: "k2",
      isMain: false,
      sortOrder: 1,
    },
  ]);
  await mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices: {},
  });
  assert.deepEqual(updatesTo(schema.bookmarkImages), [
    {
      bookmarkId: SURVIVOR,
      isMain: true,
      sortOrder: 0,
    },
    {
      bookmarkId: SURVIVOR,
      isMain: false,
      sortOrder: 1,
    },
  ]);
  assert.deepEqual(updatesTo(schema.mediaObjects), [{
    bookmarkId: SURVIVOR,
  }]);
});

test("keeps the survivor's images and appends after them, stopping at the 12-image cap", async () => {
  resetFixtures();
  const survivorImages = Array.from({
    length: 11,
  }, (_, i) => ({
    id: `s-${i}`,
    bookmarkId: SURVIVOR,
    objectKey: `sk-${i}`,
    isMain: i === 0,
    sortOrder: i,
  }));
  fakeDb.setRows(schema.bookmarkImages, [
    ...survivorImages,
    {
      id: "l-1",
      bookmarkId: LOSER,
      objectKey: "lk-1",
      isMain: true,
      sortOrder: 0,
    },
    {
      id: "l-2",
      bookmarkId: LOSER,
      objectKey: "lk-2",
      isMain: false,
      sortOrder: 1,
    },
  ]);
  await mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices: {},
  });
  // Room for exactly one: it is never promoted to main and sorts after the survivor's images.
  assert.deepEqual(updatesTo(schema.bookmarkImages), [{
    bookmarkId: SURVIVOR,
    isMain: false,
    sortOrder: 11,
  }]);
});

test("re-points import bookkeeping, deletes the losers, and finishes with cleanup + cache + re-read", async () => {
  resetFixtures();
  await mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices: {},
  });
  assert.deepEqual(updatesTo(schema.importItems), [
    {
      duplicateBookmarkId: SURVIVOR,
    },
    {
      createdBookmarkId: SURVIVOR,
    },
  ]);
  assert.ok(fakeDb.deleted.some(call => call.table === schema.bookmarks));
  assert.deepEqual(cleanupCalls.map(call => call.name), ["genreMoods", "entityNames", "languageUsages"]);
  assert.deepEqual(cleanupCalls[0]!.ids, [LOSER]);
  assert.equal(invalidateCalls, 1);
  assert.deepEqual(getBookmarkCalls, [SURVIVOR]);
});

test("unions polymorphic rows post-commit, demoting copied names and skipping survivor conflicts", async () => {
  resetFixtures();
  fakeDb.setRows(schema.taxonomyAssignments, [
    {
      taxonomyId: "tax-1",
      termId: "term-shared",
      ownerType: "bookmark",
      ownerId: SURVIVOR,
    },
    {
      taxonomyId: "tax-1",
      termId: "term-shared",
      ownerType: "bookmark",
      ownerId: LOSER,
    },
    {
      taxonomyId: "tax-1",
      termId: "term-new",
      ownerType: "bookmark",
      ownerId: LOSER,
    },
    // A non-bookmark owner sharing the id must never be copied.
    {
      taxonomyId: "tax-1",
      termId: "term-other",
      ownerType: "category",
      ownerId: LOSER,
    },
  ]);
  fakeDb.setRows(schema.entityNames, [
    {
      id: "n-1",
      ownerType: "bookmark",
      ownerId: SURVIVOR,
      languageId: "lang-en",
      value: "Survivor",
      isPrimary: true,
      sortOrder: 0,
      createdAt: new Date(),
    },
    {
      id: "n-2",
      ownerType: "bookmark",
      ownerId: LOSER,
      languageId: "lang-en",
      value: "Loser",
      isPrimary: true,
      sortOrder: 0,
      createdAt: new Date(),
    },
    {
      id: "n-3",
      ownerType: "bookmark",
      ownerId: LOSER,
      languageId: "lang-ja",
      value: "敗者",
      isPrimary: false,
      sortOrder: 1,
      createdAt: new Date(),
    },
  ]);
  fakeDb.setRows(schema.languageUsages, [
    {
      id: "u-1",
      ownerType: "bookmark",
      ownerId: LOSER,
      languageId: "lang-ja",
      usageLevelId: "level-sub",
      translationSourceId: null,
      note: null,
      sortOrder: 0,
      createdAt: new Date(),
    },
  ]);
  await mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices: {},
  });
  assert.deepEqual(insertsInto(schema.taxonomyAssignments), [{
    taxonomyId: "tax-1",
    termId: "term-new",
    ownerType: "bookmark",
    ownerId: SURVIVOR,
  }]);
  // Only the ja name copies (en clashes with the survivor's), and never as primary.
  assert.deepEqual(insertsInto(schema.entityNames), [{
    ownerType: "bookmark",
    ownerId: SURVIVOR,
    languageId: "lang-ja",
    value: "敗者",
    isPrimary: false,
    sortOrder: 1,
  }]);
  assert.deepEqual(insertsInto(schema.languageUsages), [{
    ownerType: "bookmark",
    ownerId: SURVIVOR,
    languageId: "lang-ja",
    usageLevelId: "level-sub",
    translationSourceId: null,
    note: null,
    sortOrder: 0,
  }]);
});

test("rewrites relationships: re-point, drop self-edges, canonicalize symmetric pairs, dedupe", async () => {
  resetFixtures();
  fakeDb.setRows(schema.relationshipTypes, [
    {
      id: "type-sym",
      directional: false,
    },
    {
      id: "type-dir",
      directional: true,
    },
  ]);
  fakeDb.setRows(schema.bookmarkRelationships, [
    // Survivor↔loser edge — becomes a self-edge and is dropped.
    {
      id: "e-1",
      bookmarkAId: SURVIVOR,
      bookmarkBId: LOSER,
      relationshipTypeId: "type-sym",
      label: null,
    },
    // Loser↔outside symmetric edge — re-points to the survivor and re-canonicalizes.
    {
      id: "e-2",
      bookmarkAId: LOSER,
      bookmarkBId: OUTSIDE,
      relationshipTypeId: "type-sym",
      label: "same person",
    },
    // Survivor already has the equivalent edge — deduped, keeping the labeled one.
    {
      id: "e-3",
      bookmarkAId: SURVIVOR,
      bookmarkBId: OUTSIDE,
      relationshipTypeId: "type-sym",
      label: null,
    },
    // Directional edge keeps the loser's parent role on the survivor (no reordering).
    {
      id: "e-4",
      bookmarkAId: OUTSIDE,
      bookmarkBId: LOSER,
      relationshipTypeId: "type-dir",
      label: null,
    },
  ]);
  await mergeBookmarks({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices: {},
  });
  assert.ok(fakeDb.deleted.some(call => call.table === schema.bookmarkRelationships));
  const inserted = insertsInto(schema.bookmarkRelationships) as Record<string, unknown>[];
  assert.equal(inserted.length, 2);
  const [a, b] = [SURVIVOR, OUTSIDE].sort();
  assert.deepEqual(inserted.find(row => row.relationshipTypeId === "type-sym"), {
    bookmarkAId: a,
    bookmarkBId: b,
    relationshipTypeId: "type-sym",
    label: "same person",
  });
  assert.deepEqual(inserted.find(row => row.relationshipTypeId === "type-dir"), {
    bookmarkAId: OUTSIDE,
    bookmarkBId: SURVIVOR,
    relationshipTypeId: "type-dir",
    label: null,
  });
});

test("rewriteRelationshipEdges skips edges whose type row is missing", () => {
  const rewritten = rewriteRelationshipEdges(
    [{
      bookmarkAId: LOSER,
      bookmarkBId: OUTSIDE,
      relationshipTypeId: "type-unknown",
      label: null,
    }],
    new Set([SURVIVOR, LOSER]),
    SURVIVOR,
    new Map(),
  );
  assert.deepEqual(rewritten, []);
});
