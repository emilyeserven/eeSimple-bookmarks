import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { Bookmark, ConditionInput, ConditionTree } from "@eesimple/types";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

// listHomepageSectionBookmarks wires together getBookmarkEvaluationData (bookmarkCache) and
// hydrateBookmarkRows (bookmarkHydration) — both mocked here as seams, since their own internals
// are covered elsewhere (bookmarkHydration.test.ts) or belong to @eesimple/types
// (evaluateConditions's operator matching isn't retested here, per the what-not-to-test skill; only
// how this file wires into it).

const fakeDb = createFakeDb();

interface EvaluationData {
  baseRows: { id: string;
    priority: number;
    createdAt: string; }[];
  conditionInputs: Map<string, ConditionInput>;
  tagDescendants: (id: string) => Set<string>;
  locationDescendants: (id: string) => Set<string>;
}

// Identity resolver — these tests match on exact ids, so no cascade behavior is needed.
const identityDescendants = (id: string) => new Set([id]);

let evaluationData: EvaluationData = {
  baseRows: [],
  conditionInputs: new Map(),
  tagDescendants: identityDescendants,
  locationDescendants: identityDescendants,
};
let evaluationDataCalls = 0;

const hydrateCalls: { rows: { id: string }[] }[] = [];
let hydrateImpl: (rows: { id: string }[]) => Bookmark[] = rows =>
  rows.map(row => ({
    id: row.id,
  }) as unknown as Bookmark);

mock.module("@/db", {
  namedExports: {
    db: fakeDb.db,
  },
});
mock.module("@/services/bookmarkCache", {
  namedExports: {
    getBookmarkEvaluationData: async () => {
      evaluationDataCalls++;
      return evaluationData;
    },
  },
});
mock.module("@/services/bookmarkHydration", {
  namedExports: {
    hydrateBookmarkRows: async (rows: { id: string }[]) => {
      hydrateCalls.push({
        rows,
      });
      return hydrateImpl(rows);
    },
  },
});

const {
  listHomepageSectionBookmarks,
} = await import("@/services/homepageSections");

function resetFixtures(): void {
  fakeDb.reset();
  fakeDb.setRows(schema.homepageSections, []);
  evaluationData = {
    baseRows: [],
    conditionInputs: new Map(),
    tagDescendants: identityDescendants,
    locationDescendants: identityDescendants,
  };
  evaluationDataCalls = 0;
  hydrateCalls.length = 0;
  hydrateImpl = rows => rows.map(row => ({
    id: row.id,
  }) as unknown as Bookmark);
}

function tagCondition(tagIds: string[]): ConditionTree {
  return {
    type: "group",
    combinator: "and",
    children: [{
      type: "tag",
      tagIds,
    }],
  };
}

// A group with no children evaluates to false (not vacuously true), so "matches everything" needs
// a real leaf — a category condition against the categoryId every makeConditionInput() fixture uses.
function alwaysMatchCondition(): ConditionTree {
  return {
    type: "group",
    combinator: "and",
    children: [{
      type: "category",
      categoryIds: ["cat-1"],
    }],
  };
}

function makeConditionInput(overrides: Partial<ConditionInput> = {}): ConditionInput {
  return {
    url: "https://example.com",
    title: "Example",
    categoryId: "cat-1",
    tagIds: new Set<string>(),
    locationIds: new Set<string>(),
    youtubeChannelId: null,
    mediaTypeId: null,
    genreMoodIds: new Set<string>(),
    relationshipTypeIds: new Set<string>(),
    languageUsages: [],
    numberValues: new Map(),
    booleanValues: new Map(),
    ...overrides,
  } as ConditionInput;
}

function sectionRow(overrides: Partial<{ id: string;
  title: string;
  conditions: ConditionTree; }> = {}) {
  return {
    id: "section-1",
    title: "Section",
    description: null,
    conditions: tagCondition([]),
    sortOrder: 0,
    hideIfEmpty: false,
    columns: 2,
    imageMode: true,
    imageCropMode: null,
    imageLayout: "above",
    imageVisibility: "shown",
    viewMode: "cards",
    fieldZones: null,
    cardZoneLayouts: null,
    hiddenCardFields: [],
    cornerOverlays: true,
    hideWebsiteForYouTube: false,
    sort: null,
    bookmarkLimit: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

test("listHomepageSectionBookmarks returns [] with no sections, never loading the evaluation data", async () => {
  resetFixtures();
  const result = await listHomepageSectionBookmarks();
  assert.deepEqual(result, []);
  assert.equal(evaluationDataCalls, 0);
});

test("listHomepageSectionBookmarks pairs every section with [] when there are no base bookmark rows, without hydrating", async () => {
  resetFixtures();
  fakeDb.setRows(schema.homepageSections, [sectionRow()]);
  evaluationData.baseRows = [];
  const result = await listHomepageSectionBookmarks();
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].bookmarks, []);
  assert.equal(hydrateCalls.length, 0);
});

test("listHomepageSectionBookmarks excludes a base row with no conditionInputs entry from every section", async () => {
  resetFixtures();
  fakeDb.setRows(schema.homepageSections, [sectionRow({
    conditions: alwaysMatchCondition(),
  })]);
  evaluationData.baseRows = [{
    id: "bm-1",
    priority: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
  }];
  evaluationData.conditionInputs = new Map(); // no entry for bm-1
  const result = await listHomepageSectionBookmarks();
  assert.deepEqual(result[0].bookmarks, []);
  // baseRows was non-empty, so hydrateBookmarkRows is still called (with no matched rows) — only
  // the baseRows-empty case (tested above) skips the call entirely.
  assert.deepEqual(hydrateCalls[0]?.rows, []);
});

test("listHomepageSectionBookmarks matches rows against the section's conditions via the shared evaluateConditions", async () => {
  resetFixtures();
  fakeDb.setRows(schema.homepageSections, [sectionRow({
    conditions: tagCondition(["tag-a"]),
  })]);
  evaluationData.baseRows = [
    {
      id: "bm-match",
      priority: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "bm-no-match",
      priority: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  ];
  evaluationData.conditionInputs = new Map([
    ["bm-match", makeConditionInput({
      tagIds: new Set(["tag-a"]),
    })],
    ["bm-no-match", makeConditionInput({
      tagIds: new Set(["tag-b"]),
    })],
  ]);
  const result = await listHomepageSectionBookmarks();
  assert.deepEqual(result[0].bookmarks.map(b => b.id), ["bm-match"]);
});

test("listHomepageSectionBookmarks sorts matches by priority DESC, then by newer createdAt first on a tie", async () => {
  resetFixtures();
  fakeDb.setRows(schema.homepageSections, [sectionRow({
    conditions: alwaysMatchCondition(),
  })]);
  evaluationData.baseRows = [
    {
      id: "low-priority",
      priority: 0,
      createdAt: "2024-06-01T00:00:00.000Z",
    },
    {
      id: "high-priority-older",
      priority: 5,
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "high-priority-newer",
      priority: 5,
      createdAt: "2024-03-01T00:00:00.000Z",
    },
  ];
  evaluationData.conditionInputs = new Map(evaluationData.baseRows.map(row => [row.id, makeConditionInput()]));
  const result = await listHomepageSectionBookmarks();
  assert.deepEqual(result[0].bookmarks.map(b => b.id), [
    "high-priority-newer",
    "high-priority-older",
    "low-priority",
  ]);
});

test("listHomepageSectionBookmarks hydrates a bookmark matching multiple sections exactly once and shares the same object across them", async () => {
  resetFixtures();
  fakeDb.setRows(schema.homepageSections, [
    sectionRow({
      id: "section-1",
      conditions: alwaysMatchCondition(),
    }),
    sectionRow({
      id: "section-2",
      conditions: alwaysMatchCondition(),
    }),
    sectionRow({
      id: "section-3",
      conditions: alwaysMatchCondition(),
    }),
  ]);
  evaluationData.baseRows = [{
    id: "bm-shared",
    priority: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
  }];
  evaluationData.conditionInputs = new Map([["bm-shared", makeConditionInput()]]);
  const result = await listHomepageSectionBookmarks();
  assert.equal(hydrateCalls.length, 1);
  assert.deepEqual(hydrateCalls[0].rows.map(r => r.id), ["bm-shared"]);
  assert.equal(result.length, 3);
  const [b1] = result[0].bookmarks;
  const [b2] = result[1].bookmarks;
  const [b3] = result[2].bookmarks;
  assert.ok(b1 === b2 && b2 === b3, "the same hydrated object should be reused across every matching section");
});

test("listHomepageSectionBookmarks silently omits a matched id that hydration didn't return", async () => {
  resetFixtures();
  fakeDb.setRows(schema.homepageSections, [sectionRow({
    conditions: alwaysMatchCondition(),
  })]);
  evaluationData.baseRows = [{
    id: "bm-1",
    priority: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
  }];
  evaluationData.conditionInputs = new Map([["bm-1", makeConditionInput()]]);
  hydrateImpl = () => []; // defensive: hydration returns nothing for the matched id
  const result = await listHomepageSectionBookmarks();
  assert.deepEqual(result[0].bookmarks, []);
});
