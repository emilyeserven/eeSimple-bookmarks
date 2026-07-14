import assert from "node:assert/strict";
import { test } from "node:test";

import type { BookmarkFillPresence, FillTarget, WebsiteExtensionFillRule } from "./extensionFill.js";
import { bookmarkFillPresence, websiteRulesCanFill } from "./extensionFill.js";
import type { Bookmark } from "./index.js";

function rule(target: FillTarget): WebsiteExtensionFillRule {
  return {
    id: "r",
    label: "l",
    target,
    extract: {},
  };
}

function presence(overrides: Partial<BookmarkFillPresence> = {}): BookmarkFillPresence {
  return {
    title: false,
    description: false,
    isbn: false,
    year: false,
    image: false,
    people: false,
    groups: false,
    locations: false,
    tags: false,
    filledPropertyIds: new Set<string>(),
    filledSectionsPropertyIds: new Set<string>(),
    ...overrides,
  };
}

test("websiteRulesCanFill returns false for an empty rule list", () => {
  assert.equal(websiteRulesCanFill([], presence()), false);
});

test("websiteRulesCanFill flags a scalar field target only when empty", () => {
  const rules = [rule({
    kind: "field",
    field: "isbn",
  })];
  assert.equal(websiteRulesCanFill(rules, presence({
    isbn: false,
  })), true);
  assert.equal(websiteRulesCanFill(rules, presence({
    isbn: true,
  })), false);
});

test("websiteRulesCanFill flags a customProperty target only when the property has no value", () => {
  const rules = [rule({
    kind: "customProperty",
    propertyId: "p1",
  })];
  assert.equal(websiteRulesCanFill(rules, presence()), true);
  assert.equal(
    websiteRulesCanFill(rules, presence({
      filledPropertyIds: new Set(["p1"]),
    })),
    false,
  );
});

test("websiteRulesCanFill flags a sections target only when the sections property is empty", () => {
  const rules = [rule({
    kind: "sections",
    propertyId: "s1",
    entryType: "name",
  })];
  assert.equal(websiteRulesCanFill(rules, presence()), true);
  assert.equal(
    websiteRulesCanFill(rules, presence({
      filledSectionsPropertyIds: new Set(["s1"]),
    })),
    false,
  );
});

test("websiteRulesCanFill flags a taxonomy target only when that taxonomy is empty", () => {
  const rules = [rule({
    kind: "taxonomy",
    taxonomy: "people",
  })];
  assert.equal(websiteRulesCanFill(rules, presence({
    people: false,
  })), true);
  assert.equal(websiteRulesCanFill(rules, presence({
    people: true,
  })), false);
});

test("websiteRulesCanFill flags an image target only when the bookmark has no image", () => {
  const rules = [rule({
    kind: "image",
  })];
  assert.equal(websiteRulesCanFill(rules, presence({
    image: false,
  })), true);
  assert.equal(websiteRulesCanFill(rules, presence({
    image: true,
  })), false);
});

test("websiteRulesCanFill ignores linked-entity targets even when everything is empty", () => {
  const rules = [
    rule({
      kind: "taxonomyEntity",
      association: "website",
      field: "name",
    }),
    rule({
      kind: "taxonomyDirect",
      association: "website",
      resolve: {
        mode: "url",
      },
      field: "name",
    }),
  ];
  assert.equal(websiteRulesCanFill(rules, presence()), false);
});

test("websiteRulesCanFill returns true when any one rule targets an empty field", () => {
  const rules = [
    rule({
      kind: "field",
      field: "title",
    }), // filled below
    rule({
      kind: "field",
      field: "isbn",
    }), // empty → drives the match
  ];
  assert.equal(websiteRulesCanFill(rules, presence({
    title: true,
    isbn: false,
  })), true);
});

test("bookmarkFillPresence derives per-field presence from a hydrated bookmark", () => {
  const bookmark = {
    title: "Title",
    description: "",
    isbn: null,
    year: 2020,
    image: null,
    people: [{
      id: "person",
    }],
    groups: [],
    locations: [],
    tags: [],
    numberValues: [{
      propertyId: "num",
      value: 1,
    }],
    booleanValues: [],
    dateTimeValues: [],
    fileValues: [],
    progressValues: [],
    choicesValues: [{
      propertyId: "emptyChoice",
      values: [],
    }],
    textValues: [{
      propertyId: "blankText",
      value: "   ",
    }],
    sectionsValues: [
      {
        propertyId: "sec",
        exhaustive: false,
        sections: [{
          id: "x",
          name: "n",
          type: "name",
          startValue: "",
        }],
      },
    ],
  } as unknown as Bookmark;

  const p = bookmarkFillPresence(bookmark);
  assert.equal(p.title, true);
  assert.equal(p.description, false);
  assert.equal(p.isbn, false);
  assert.equal(p.year, true);
  assert.equal(p.image, false);
  assert.equal(p.people, true);
  assert.equal(p.groups, false);
  assert.equal(p.filledPropertyIds.has("num"), true);
  assert.equal(p.filledPropertyIds.has("emptyChoice"), false); // no selected values
  assert.equal(p.filledPropertyIds.has("blankText"), false); // whitespace-only
  assert.equal(p.filledSectionsPropertyIds.has("sec"), true);
});
