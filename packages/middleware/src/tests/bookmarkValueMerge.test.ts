import assert from "node:assert/strict";
import { test } from "node:test";

import type { Bookmark } from "@eesimple/types";

import { hasValuePatch, mergeBookmarkValues } from "@/services/bookmarkValueMerge";

/** Minimal stand-in for the value arrays `mergeBookmarkValues` reads off a hydrated bookmark. */
function existingValues(): Pick<
  Bookmark,
  "numberValues" | "booleanValues" | "dateTimeValues" | "choicesValues" | "progressValues"
> {
  return {
    numberValues: [
      {
        propertyId: "p1",
        value: 1,
      },
      {
        propertyId: "p2",
        value: 2,
      },
    ],
    booleanValues: [{
      propertyId: "b1",
      value: true,
    }],
    dateTimeValues: [],
    choicesValues: [],
    progressValues: [],
  };
}

test("mergeBookmarkValues replaces the patched property and keeps the others", () => {
  const merged = mergeBookmarkValues(existingValues(), {
    numberValues: [{
      propertyId: "p2",
      value: 99,
    }],
  });
  assert.deepEqual(merged.numberValues, [
    {
      propertyId: "p1",
      value: 1,
    },
    {
      propertyId: "p2",
      value: 99,
    },
  ]);
});

test("mergeBookmarkValues appends a property the bookmark doesn't have yet", () => {
  const merged = mergeBookmarkValues(existingValues(), {
    numberValues: [{
      propertyId: "p3",
      value: 3,
    }],
  });
  assert.deepEqual(merged.numberValues, [
    {
      propertyId: "p1",
      value: 1,
    },
    {
      propertyId: "p2",
      value: 2,
    },
    {
      propertyId: "p3",
      value: 3,
    },
  ]);
});

test("mergeBookmarkValues only returns the kinds present in the patch", () => {
  const merged = mergeBookmarkValues(existingValues(), {
    booleanValues: [{
      propertyId: "b1",
      value: false,
    }],
  });
  assert.deepEqual(Object.keys(merged), ["booleanValues"]);
  assert.deepEqual(merged.booleanValues, [{
    propertyId: "b1",
    value: false,
  }]);
});

test("hasValuePatch detects whether any value array is present", () => {
  assert.equal(hasValuePatch({}), false);
  assert.equal(hasValuePatch({
    categoryId: "c1",
  }), false);
  assert.equal(hasValuePatch({
    numberValues: [],
  }), true);
  assert.equal(hasValuePatch({
    booleanValues: [{
      propertyId: "b1",
      value: true,
    }],
  }), true);
});
