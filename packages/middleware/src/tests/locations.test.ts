import assert from "node:assert/strict";
import { test } from "node:test";
import type { Location } from "@eesimple/types";
import {
  buildLocationTree,
  collectLocationSubtreeIds,
  computeLocationBookmarkCounts,
  locationSlugSource,
  matchLocationIdsByTitle,
  wouldCreateLocationCycle,
} from "@/services/locations";
import { slugify } from "@/utils/slug";

// Pure-helper tests run without a live database (mirrors tags.test.ts).

function makeLocation(partial: Partial<Location> & Pick<Location, "id" | "name" | "parentId">): Location {
  return {
    slug: partial.id,
    alternateNames: [],
    latitude: null,
    longitude: null,
    mapUrl: null,
    plusCode: null,
    placeType: null,
    countryCode: null,
    sortOrder: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
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

test("locationSlugSource prefers the romanized name, falling back to the name", () => {
  // Non-Latin name with a romanized form → slug derives from the romanized form.
  assert.equal(slugify(locationSlugSource("萩市", "Hagi")), "hagi");
  // No romanized name → fall back to the name.
  assert.equal(slugify(locationSlugSource("Tokyo", null)), "tokyo");
  // Blank/whitespace romanized name is ignored.
  assert.equal(slugify(locationSlugSource("Tokyo", "   ")), "tokyo");
  // A non-Latin name with no romanized form still slugifies to empty (no readable source available).
  assert.equal(slugify(locationSlugSource("萩市", null)), "");
});

test("matchLocationIdsByTitle matches name, romanizedName, and alternate names", () => {
  const candidates = [
    {
      id: "l-busan",
      name: "부산",
      romanizedName: "Busan",
      alternateNames: [{
        value: "Pusan",
      }],
    },
    {
      id: "l-tokyo",
      name: "Tokyo",
      romanizedName: null,
      alternateNames: [{
        value: "Tōkyō",
      }],
    },
  ];
  // Native name inside a Korean compound title.
  assert.deepEqual(matchLocationIdsByTitle("부산광역시", null, candidates), ["l-busan"]);
  // Romanized name against a Latin title.
  assert.deepEqual(matchLocationIdsByTitle("Ferry from Busan", null, candidates), ["l-busan"]);
  // An alternate romanization style matches too.
  assert.deepEqual(matchLocationIdsByTitle("A trip to Pusan", null, candidates), ["l-busan"]);
  // Whole-word Latin name.
  assert.deepEqual(matchLocationIdsByTitle("Living in Tokyo now", null, candidates), ["l-tokyo"]);
  // No spurious substring match.
  assert.deepEqual(matchLocationIdsByTitle("Stockyard tour", null, candidates), []);
});
