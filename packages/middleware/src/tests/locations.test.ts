import assert from "node:assert/strict";
import { test } from "node:test";
import type { EntityName, Location } from "@eesimple/types";
import {
  buildLocationTree,
  collectLocationSubtreeIds,
  computeLocationBookmarkCounts,
  locationInputToPatch,
  matchLocationIdsByTitle,
  wouldCreateLocationCycle,
} from "@/services/locations";

/** A minimal language-labelled name for candidate fixtures. */
function nm(value: string): EntityName {
  return {
    id: value,
    language: {
      id: value,
      name: value,
      slug: value,
      isoCode: null,
    },
    value,
    isPrimary: false,
    sortOrder: 0,
  };
}

// Pure-helper tests run without a live database (mirrors tags.test.ts).

function makeLocation(partial: Partial<Location> & Pick<Location, "id" | "name" | "parentId">): Location {
  return {
    slug: partial.id,
    description: null,
    alternateNames: [],
    latitude: null,
    longitude: null,
    mapUrl: null,
    plusCode: null,
    placeType: null,
    countryCode: null,
    wikidataId: null,
    usesWikidataCoordinates: false,
    officialLink: null,
    wikipediaLinkEn: null,
    wikipediaLinkLocal: null,
    sortOrder: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    labeledWebsites: [],
    ...partial,
  };
}

// japan → honshu → chugoku → yamaguchi → hagi, plus a separate root "kyushu".
const flat: Location[] = [
  makeLocation({
    id: "japan",
    name: "Japan",
    parentId: null,
  }),
  makeLocation({
    id: "honshu",
    name: "Honshu",
    parentId: "japan",
  }),
  makeLocation({
    id: "chugoku",
    name: "Chugoku",
    parentId: "honshu",
  }),
  makeLocation({
    id: "yamaguchi",
    name: "Yamaguchi",
    parentId: "chugoku",
  }),
  makeLocation({
    id: "hagi",
    name: "Hagi",
    parentId: "yamaguchi",
  }),
  makeLocation({
    id: "kyushu",
    name: "Kyushu",
    parentId: null,
  }),
];

test("collectSubtreeIds returns a location and all its descendants", () => {
  assert.deepEqual(
    [...collectLocationSubtreeIds(flat, "chugoku")].sort(),
    ["chugoku", "hagi", "yamaguchi"],
  );
  assert.deepEqual([...collectLocationSubtreeIds(flat, "hagi")], ["hagi"]);
});

test("buildLocationTree nests children under their parents", () => {
  const roots = buildLocationTree(flat);
  assert.equal(roots.length, 2); // japan, kyushu
  const japan = roots.find(node => node.id === "japan");
  assert.ok(japan);
  assert.equal(japan.children[0]?.id, "honshu");
  assert.equal(japan.children[0]?.children[0]?.id, "chugoku");
});

test("wouldCreateCycle rejects reparenting under self or a descendant", () => {
  assert.equal(wouldCreateLocationCycle(flat, "honshu", "honshu"), true);
  assert.equal(wouldCreateLocationCycle(flat, "honshu", "hagi"), true);
  // Moving into an unrelated subtree is allowed.
  assert.equal(wouldCreateLocationCycle(flat, "honshu", "kyushu"), false);
});

test("computeLocationBookmarkCounts counts subtree (distinct) and own bookmarks", () => {
  const links = [
    {
      locationId: "japan",
      bookmarkId: "b1",
    },
    {
      locationId: "honshu",
      bookmarkId: "b2",
    },
    {
      locationId: "hagi",
      bookmarkId: "b3",
    },
    {
      locationId: "japan",
      bookmarkId: "b4",
    },
    {
      locationId: "hagi",
      bookmarkId: "b4",
    },
  ];
  const counts = computeLocationBookmarkCounts(flat, links);
  // japan's subtree spans b1–b4 (b4 deduped across japan + hagi); only b1 sits on japan alone.
  assert.deepEqual(counts.get("japan"), {
    subtree: 4,
    own: 1,
  });
  // hagi is a leaf, so its subtree and own counts match.
  assert.deepEqual(counts.get("hagi"), {
    subtree: 2,
    own: 2,
  });
});

test("matchLocationIdsByTitle matches name, language-labelled names, and alternate names", () => {
  const candidates = [
    {
      id: "l-busan",
      name: "부산",
      alternateNames: [{
        value: "Pusan",
      }],
      names: [nm("Busan")],
    },
    {
      id: "l-tokyo",
      name: "Tokyo",
      alternateNames: [{
        value: "Tōkyō",
      }],
    },
  ];
  // Native name inside a Korean compound title.
  assert.deepEqual(matchLocationIdsByTitle(["부산광역시"], candidates), ["l-busan"]);
  // Romanized name against a Latin title.
  assert.deepEqual(matchLocationIdsByTitle(["Ferry from Busan"], candidates), ["l-busan"]);
  // An alternate romanization style matches too.
  assert.deepEqual(matchLocationIdsByTitle(["A trip to Pusan"], candidates), ["l-busan"]);
  // Whole-word Latin name.
  assert.deepEqual(matchLocationIdsByTitle(["Living in Tokyo now"], candidates), ["l-tokyo"]);
  // No spurious substring match.
  assert.deepEqual(matchLocationIdsByTitle(["Stockyard tour"], candidates), []);
});

test("matchLocationIdsByTitle matches a location's language-labelled names against the bookmark's names", () => {
  const candidates = [
    {
      id: "l-kyoto",
      name: "Kyoto",
      alternateNames: [],
      names: [nm("京都"), nm("Kyoto")],
    },
  ];
  // Bookmark carrying the Japanese name matches the location via its `names` value.
  assert.deepEqual(matchLocationIdsByTitle(["旅行", "京都旅行"], candidates), ["l-kyoto"]);
});

test("matchLocationIdsByTitle drops a matched ancestor of a more specific matched location", () => {
  const candidates = [
    {
      id: "l-busan",
      name: "부산광역시",
      alternateNames: [],
      parentId: null,
      names: [nm("Busan")],
    },
    {
      id: "l-temple",
      name: "대한불교조계종 석불사",
      alternateNames: [],
      parentId: "l-busan",
      names: [nm("Seokbulsa Temple")],
    },
  ];
  // Title mentions both the temple (by name) and "Busan" (the temple's ancestor) — only the more
  // specific temple match should survive; Busan is implied by it.
  assert.deepEqual(
    matchLocationIdsByTitle(
      ["Seokbulsa Temple: A Rewarding Cave Temple Hike in Busan - Nickkembel Travels"],
      candidates,
    ),
    ["l-temple"],
  );
  // A title mentioning only the ancestor still matches the ancestor.
  assert.deepEqual(matchLocationIdsByTitle(["A day trip to Busan"], candidates), ["l-busan"]);
});

test("locationInputToPatch copies only the fields that are present", () => {
  const patch = locationInputToPatch({
    name: "Kyoto",
    latitude: 35,
    officialLink: null,
  });
  assert.deepEqual(patch, {
    name: "Kyoto",
    latitude: 35,
    officialLink: null,
  });
});

test("locationInputToPatch omits undefined fields and never includes slug", () => {
  const patch = locationInputToPatch({
    name: "Kyoto",
    placeType: undefined,
    parentId: "parent",
    tagIds: ["t1"],
  });
  // tagIds is written separately (not a row column), englishName is written separately via
  // `mergeEnglishEntityName` (not a row column either), and slug is derived by the caller.
  assert.deepEqual(patch, {
    name: "Kyoto",
    parentId: "parent",
  });
  assert.equal("slug" in patch, false);
});

test("locationInputToPatch returns an empty patch for an empty input", () => {
  assert.deepEqual(locationInputToPatch({}), {});
});
