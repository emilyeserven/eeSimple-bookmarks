import assert from "node:assert/strict";
import { test } from "node:test";

import type { BookmarkRow } from "@/db/schema";
import { assembleConditionInput, type ConditionInputGroups } from "@/services/bookmarkCache";

/** An all-empty group bag — every lookup misses, so the assembler must fall back to empty defaults. */
function emptyGroups(): ConditionInputGroups {
  return {
    tagsByBid: new Map(),
    genreMoodsByBid: new Map(),
    locationsByBid: new Map(),
    numsByBid: new Map(),
    boolsByBid: new Map(),
    datesByBid: new Map(),
    choicesByBid: new Map(),
    sectionsByBid: new Map(),
    filesByBid: new Map(),
    textsByBid: new Map(),
    relTypesByBid: new Map(),
    languageUsagesByBid: new Map(),
  };
}

function bookmarkRow(overrides: Partial<BookmarkRow> = {}): BookmarkRow {
  return {
    id: "b1",
    url: "https://example.com",
    title: "Example",
    romanizedName: null,
    categoryId: null,
    youtubeChannelId: null,
    mediaTypeId: null,
    ...overrides,
  } as BookmarkRow;
}

test("assembleConditionInput falls back to empty collections and the default category when the bookmark has no entries", () => {
  const input = assembleConditionInput(bookmarkRow(), emptyGroups(), "cat-default");
  assert.equal(input.categoryId, "cat-default");
  assert.equal(input.url, "https://example.com");
  assert.equal(input.youtubeChannelId, null);
  assert.equal(input.tagIds.size, 0);
  assert.equal(input.genreMoodIds.size, 0);
  assert.equal(input.numberValues.size, 0);
  assert.deepEqual(input.languageUsages, []);
});

test("assembleConditionInput uses the bookmark's own category over the default and pulls its grouped values", () => {
  const groups = emptyGroups();
  groups.tagsByBid.set("b1", new Set(["t1", "t2"]));
  groups.numsByBid.set("b1", new Map([["p1", 42]]));
  groups.languageUsagesByBid.set("b1", [{
    languageId: "l1",
    usageLevelId: "u1",
  }]);

  const input = assembleConditionInput(
    bookmarkRow({
      categoryId: "cat-own",
      youtubeChannelId: "yt1",
    }),
    groups,
    "cat-default",
  );
  assert.equal(input.categoryId, "cat-own");
  assert.equal(input.youtubeChannelId, "yt1");
  assert.deepEqual([...input.tagIds], ["t1", "t2"]);
  assert.equal(input.numberValues.get("p1"), 42);
  assert.deepEqual(input.languageUsages, [{
    languageId: "l1",
    usageLevelId: "u1",
  }]);
});
