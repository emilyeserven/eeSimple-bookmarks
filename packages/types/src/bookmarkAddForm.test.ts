import assert from "node:assert/strict";
import { test } from "node:test";

import type { BookmarkAddFormAdvancedRule } from "./bookmarkAddForm.js";
import type { ConditionInput, ConditionTree } from "./conditions.js";

import { applyAdvancedRules, DEFAULT_BOOKMARK_ADD_FORM_SETTINGS } from "./bookmarkAddForm.js";

/** A ConditionInput for a bookmark whose media type is `mediaTypeId`, everything else empty. */
function inputWithMediaType(mediaTypeId: string | null): ConditionInput {
  return {
    url: "https://example.com",
    title: "Example",
    categoryId: "",
    tagIds: new Set(),
    locationIds: new Set(),
    youtubeChannelId: null,
    mediaTypeId,
    genreMoodIds: new Set(),
    relationshipTypeIds: new Set(),
    languageUsages: [],
    numberValues: new Map(),
    booleanValues: new Map(),
    dateTimeValues: new Map(),
    fileValues: new Set(),
    choicesValues: new Map(),
    sectionsValues: new Map(),
    textValues: new Map(),
  };
}

/** A condition tree matching bookmarks whose media type is `mediaTypeId`. */
function mediaTypeIs(mediaTypeId: string): ConditionTree {
  return {
    type: "group",
    combinator: "and",
    children: [{
      type: "media-type",
      mediaTypeIds: [mediaTypeId],
    }],
  };
}

function rule(overrides: Partial<BookmarkAddFormAdvancedRule>): BookmarkAddFormAdvancedRule {
  return {
    id: "r1",
    conditions: mediaTypeIs("book"),
    standardFieldPlacements: {},
    propertyPlacements: {},
    sortOrder: 0,
    ...overrides,
  };
}

test("applyAdvancedRules with no rules returns the base settings unchanged", () => {
  const result = applyAdvancedRules(DEFAULT_BOOKMARK_ADD_FORM_SETTINGS, inputWithMediaType("book"));
  assert.equal(result, DEFAULT_BOOKMARK_ADD_FORM_SETTINGS);
});

test("a matching rule overlays standard-field and property-slug placements", () => {
  const base = {
    ...DEFAULT_BOOKMARK_ADD_FORM_SETTINGS,
    advancedRules: [rule({
      standardFieldPlacements: {
        image: "default",
      },
      propertyPlacements: {
        progress: "default",
      },
    })],
  };
  const result = applyAdvancedRules(base, inputWithMediaType("book"));
  assert.equal(result.standardFieldPlacements.image, "default");
  assert.equal(result.builtInPropertyPlacements.progress, "default");
  // Untouched fields keep their base placement.
  assert.equal(result.standardFieldPlacements.title, base.standardFieldPlacements.title);
});

test("a non-matching rule leaves the base placements alone", () => {
  const base = {
    ...DEFAULT_BOOKMARK_ADD_FORM_SETTINGS,
    advancedRules: [rule({
      standardFieldPlacements: {
        image: "default",
      },
    })],
  };
  const result = applyAdvancedRules(base, inputWithMediaType("movie"));
  assert.equal(result.standardFieldPlacements.image, base.standardFieldPlacements.image);
});

test("a later (higher sortOrder) matching rule wins a conflicting field", () => {
  const base = {
    ...DEFAULT_BOOKMARK_ADD_FORM_SETTINGS,
    advancedRules: [
      rule({
        id: "low",
        sortOrder: 0,
        standardFieldPlacements: {
          image: "advanced",
        },
      }),
      rule({
        id: "high",
        sortOrder: 5,
        standardFieldPlacements: {
          image: "hidden",
        },
      }),
    ],
  };
  const result = applyAdvancedRules(base, inputWithMediaType("book"));
  assert.equal(result.standardFieldPlacements.image, "hidden");
});
