import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildMarkerKey,
  canonicalizeEdge,
  computeFillEmptyPatch,
  desiredEdgesForRow,
  type MediaSource,
  parseMarkerKey,
  planMediaBookmarkInsert,
  selectReuseCandidate,
} from "@/services/mediaMigration";

test("buildMarkerKey / parseMarkerKey: round-trip, including id containing colons", () => {
  assert.equal(buildMarkerKey("movie", "abc"), "movie:abc");
  assert.deepEqual(parseMarkerKey("movie:abc"), {
    kind: "movie",
    id: "abc",
  });
  assert.deepEqual(parseMarkerKey("mediaProperty:11111111-2222"), {
    kind: "mediaProperty",
    id: "11111111-2222",
  });
  // Only the first colon splits, so a UUID never gets truncated.
  assert.deepEqual(parseMarkerKey("track:a:b:c"), {
    kind: "track",
    id: "a:b:c",
  });
});

test("parseMarkerKey: rejects malformed markers", () => {
  assert.equal(parseMarkerKey(""), null);
  assert.equal(parseMarkerKey("noColon"), null);
  assert.equal(parseMarkerKey(":missingKind"), null);
  assert.equal(parseMarkerKey("missingId:"), null);
});

test("canonicalizeEdge: directional keeps the parent in aId regardless of UUID order", () => {
  assert.deepEqual(canonicalizeEdge("zzz", "aaa", true), {
    aId: "zzz",
    bId: "aaa",
  });
  assert.deepEqual(canonicalizeEdge("aaa", "zzz", true), {
    aId: "aaa",
    bId: "zzz",
  });
});

test("canonicalizeEdge: symmetric orders by UUID and is commutative", () => {
  assert.deepEqual(canonicalizeEdge("zzz", "aaa", false), {
    aId: "aaa",
    bId: "zzz",
  });
  assert.deepEqual(canonicalizeEdge("aaa", "zzz", false), {
    aId: "aaa",
    bId: "zzz",
  });
});

test("selectReuseCandidate: adopt only on exactly one match", () => {
  assert.equal(selectReuseCandidate<number>([]), null);
  assert.equal(selectReuseCandidate([42]), 42);
  assert.equal(selectReuseCandidate([1, 2]), null);
});

test("computeFillEmptyPatch: fills only null/undefined columns, never overwrites", () => {
  const existing = {
    isbn: null as string | null,
    year: 1999 as number | null,
    mediaTypeId: null as string | null,
  };
  const patch = computeFillEmptyPatch(existing, {
    isbn: "978",
    year: 2020,
    mediaTypeId: "movie-type",
  });
  // isbn + mediaTypeId were null → filled; year was already 1999 → untouched.
  assert.deepEqual(patch, {
    isbn: "978",
    mediaTypeId: "movie-type",
  });
});

test("computeFillEmptyPatch: skips desired values that are themselves null/undefined", () => {
  const existing = {
    isbn: null as string | null,
    plexRatingKey: null as string | null,
  };
  const patch = computeFillEmptyPatch(existing, {
    isbn: null,
    plexRatingKey: undefined,
  });
  assert.deepEqual(patch, {});
});

const MOVIE_SOURCE: MediaSource = {
  kind: "movie",
  ownerType: "movie",
  id: "movie-1",
  name: "Parasite",
  mediaTypeId: "movie-type",
  identity: {
    plexRatingKey: "rk-1",
    year: 2019,
    plexItemType: "movie",
  },
  strongIdentity: {
    column: "plexRatingKey",
    value: "rk-1",
  },
  mediaPropertyId: null,
  parentRef: null,
};

test("planMediaBookmarkInsert: title=name, url=null, identity copied, marker set, no media FK", () => {
  const values = planMediaBookmarkInsert(MOVIE_SOURCE, "movie:movie-1");
  assert.equal(values.title, "Parasite");
  assert.equal(values.url, null);
  assert.equal(values.mediaTypeId, "movie-type");
  assert.equal(values.migrationSource, "movie:movie-1");
  assert.equal(values.plexRatingKey, "rk-1");
  assert.equal(values.year, 2019);
  // The bookmark never links its own media row (no movieId key), so Pass 2 can't self-About it.
  assert.equal("movieId" in values, false);
  assert.equal("bookId" in values, false);
});

const TYPE_IDS = {
  parentChildTypeId: "pc",
  aboutTypeId: "about",
};

test("desiredEdgesForRow: outgoing parent + hub, incoming children, About referrers", () => {
  const edges = desiredEdgesForRow({
    bookmarkId: "ep",
    parentBookmarkId: "show",
    hubBookmarkId: "hub",
    childBookmarkIds: ["c1", "c2"],
    referrerBookmarkIds: ["ref1"],
    ...TYPE_IDS,
  });
  // parent→this, hub→this, this→child (x2) all Parent/child; this→referrer About.
  assert.deepEqual(edges, [
    {
      aId: "show",
      bId: "ep",
      typeId: "pc",
    },
    {
      aId: "hub",
      bId: "ep",
      typeId: "pc",
    },
    {
      aId: "ep",
      bId: "c1",
      typeId: "pc",
    },
    {
      aId: "ep",
      bId: "c2",
      typeId: "pc",
    },
    {
      aId: "ep",
      bId: "ref1",
      typeId: "about",
    },
  ]);
});

test("desiredEdgesForRow: About stores the media bookmark as parent, referrer as child", () => {
  const [edge] = desiredEdgesForRow({
    bookmarkId: "movie-bm",
    parentBookmarkId: null,
    hubBookmarkId: null,
    childBookmarkIds: [],
    referrerBookmarkIds: ["analysis-bm"],
    ...TYPE_IDS,
  });
  assert.deepEqual(edge, {
    aId: "movie-bm",
    bId: "analysis-bm",
    typeId: "about",
  });
});

test("desiredEdgesForRow: skips self-edges and de-duplicates", () => {
  const edges = desiredEdgesForRow({
    bookmarkId: "x",
    parentBookmarkId: "x", // self — dropped
    hubBookmarkId: "hub",
    childBookmarkIds: ["hub"], // same pair as hub→x once canonicalized differently; kept distinct
    referrerBookmarkIds: ["x", "ref"], // self referrer dropped
    ...TYPE_IDS,
  });
  // hub→x (Parent/child), x→hub (Parent/child, distinct direction), x→ref (About). No self-edges.
  assert.deepEqual(edges, [
    {
      aId: "hub",
      bId: "x",
      typeId: "pc",
    },
    {
      aId: "x",
      bId: "hub",
      typeId: "pc",
    },
    {
      aId: "x",
      bId: "ref",
      typeId: "about",
    },
  ]);
});

test("desiredEdgesForRow: idempotent — calling twice yields an identical set", () => {
  const input = {
    bookmarkId: "ep",
    parentBookmarkId: "show",
    hubBookmarkId: null,
    childBookmarkIds: ["c1"],
    referrerBookmarkIds: ["ref1", "ref1"], // duplicate referrer collapses
    ...TYPE_IDS,
  };
  const first = desiredEdgesForRow(input);
  const second = desiredEdgesForRow(input);
  assert.deepEqual(first, second);
  // The duplicate referrer produced only one About edge.
  assert.equal(first.filter(e => e.typeId === "about").length, 1);
});
