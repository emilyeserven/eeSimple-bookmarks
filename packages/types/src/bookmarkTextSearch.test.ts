import assert from "node:assert/strict";
import { test } from "node:test";

import type { TextSearchableBookmark } from "./bookmarkTextSearch.js";

import { bookmarkMatchesText, bookmarkTextMatchFields } from "./bookmarkTextSearch.js";

function makeSearchable(overrides: Partial<TextSearchableBookmark> = {}): TextSearchableBookmark {
  return {
    title: "A saved page",
    names: [],
    url: "https://example.com/article",
    description: null,
    sectionsValues: [],
    ...overrides,
  };
}

test("empty query matches everything", () => {
  assert.equal(bookmarkMatchesText(makeSearchable(), ""), true);
});

test("matches title case-insensitively", () => {
  assert.equal(bookmarkMatchesText(makeSearchable({
    title: "Deep Learning Notes",
  }), "learning"), true);
  assert.equal(bookmarkMatchesText(makeSearchable(), "learning"), false);
});

test("matches alternate names", () => {
  const bookmark = makeSearchable({
    names: [{
      id: "n1",
      language: {
        id: "lang-ja",
        name: "Japanese",
        slug: "japanese",
        isoCode: "ja",
      },
      value: "日本語のタイトル",
      isPrimary: false,
    }],
  });
  assert.equal(bookmarkMatchesText(bookmark, "日本語"), true);
});

test("matches url and description", () => {
  assert.equal(bookmarkMatchesText(makeSearchable(), "example.com"), true);
  assert.equal(bookmarkMatchesText(makeSearchable({
    description: "An essay about seahorses.",
  }), "seahorse"), true);
});

test("a null url and description never match", () => {
  const bookmark = makeSearchable({
    url: null,
    description: null,
  });
  assert.equal(bookmarkMatchesText(bookmark, "anything"), false);
});

test("matches a section entry name", () => {
  const bookmark = makeSearchable({
    sectionsValues: [{
      propertyId: "p1",
      exhaustive: false,
      sections: [{
        id: "s1",
        name: "Chapter on butterflies",
        type: "name",
        startValue: "",
      }],
    }],
  });
  assert.equal(bookmarkMatchesText(bookmark, "butterflies"), true);
});

test("matches a depth-2 child section name", () => {
  const bookmark = makeSearchable({
    sectionsValues: [{
      propertyId: "p1",
      exhaustive: false,
      sections: [{
        id: "s1",
        name: "Part I",
        type: "name",
        startValue: "",
        children: [{
          id: "s1a",
          name: "Nested chapter on migration",
          type: "name",
          startValue: "",
        }],
      }],
    }],
  });
  assert.equal(bookmarkMatchesText(bookmark, "migration"), true);
});

test("does not match section start/end values or section urls", () => {
  const bookmark = makeSearchable({
    sectionsValues: [{
      propertyId: "p1",
      exhaustive: false,
      sections: [{
        id: "s1",
        name: "Intro",
        type: "page",
        startValue: "42",
        endValue: "77",
        url: "https://sections.example/deep-link",
      }],
    }],
  });
  assert.equal(bookmarkMatchesText(bookmark, "42"), false);
  assert.equal(bookmarkMatchesText(bookmark, "77"), false);
  assert.equal(bookmarkMatchesText(bookmark, "deep-link"), false);
});

test("bookmarkTextMatchFields reports which fields matched, in priority order", () => {
  const bookmark = makeSearchable({
    title: "Seahorse notes",
    description: "About seahorses and butterflies",
    sectionsValues: [{
      propertyId: "p1",
      exhaustive: false,
      sections: [{
        id: "s1",
        name: "Seahorse chapter",
        type: "name",
        startValue: "",
      }],
    }],
  });
  assert.deepEqual(bookmarkTextMatchFields(bookmark, "seahorse"), ["title", "description", "section"]);
});

test("bookmarkTextMatchFields matches a child section name as 'section'", () => {
  const bookmark = makeSearchable({
    title: "Untitled",
    url: null,
    sectionsValues: [{
      propertyId: "p1",
      exhaustive: false,
      sections: [{
        id: "s1",
        name: "Part I",
        type: "name",
        startValue: "",
        children: [{
          id: "s1a",
          name: "Nested migration chapter",
          type: "name",
          startValue: "",
        }],
      }],
    }],
  });
  assert.deepEqual(bookmarkTextMatchFields(bookmark, "migration"), ["section"]);
});

test("bookmarkTextMatchFields returns [] for an empty query and never matches section values", () => {
  assert.deepEqual(bookmarkTextMatchFields(makeSearchable(), ""), []);
  const bookmark = makeSearchable({
    sectionsValues: [{
      propertyId: "p1",
      exhaustive: false,
      sections: [{
        id: "s1",
        name: "Intro",
        type: "page",
        startValue: "42",
      }],
    }],
  });
  assert.deepEqual(bookmarkTextMatchFields(bookmark, "42"), []);
});

test("bookmarkTextMatchFields matches an alternate name as 'name'", () => {
  const bookmark = makeSearchable({
    title: "Untitled",
    url: null,
    names: [{
      id: "n1",
      language: {
        id: "lang-ja",
        name: "Japanese",
        slug: "japanese",
        isoCode: "ja",
      },
      value: "日本語のタイトル",
      isPrimary: false,
    }],
  });
  assert.deepEqual(bookmarkTextMatchFields(bookmark, "日本語"), ["name"]);
});
