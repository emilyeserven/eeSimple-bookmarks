import assert from "node:assert/strict";
import { test } from "node:test";
import type { BookmarkSectionsValue, SectionEntry } from "@eesimple/types";
import {
  collectSectionTagIds,
  favoriteSectionCount,
  favoriteSectionEntries,
  sectionsCarryAnyTag,
  taggedSectionNames,
} from "@eesimple/types";

// Pure-helper tests for the shared section-tag helpers (no database), matching tags.test.ts style.

function entry(overrides: Partial<SectionEntry> & { id: string }): SectionEntry {
  return {
    name: overrides.id,
    type: "name",
    startValue: "",
    ...overrides,
  };
}

function value(sections: SectionEntry[]): BookmarkSectionsValue {
  return {
    propertyId: "prop-1",
    exhaustive: false,
    sections,
  };
}

const values: BookmarkSectionsValue[] = [
  value([
    entry({
      id: "intro",
      name: "Intro",
      tagIds: ["t-react"],
    }),
    entry({
      id: "hooks",
      name: "Hooks",
      children: [
        entry({
          id: "use-state",
          name: "useState",
          tagIds: ["t-state", "t-react"],
        }),
        entry({
          id: "use-effect",
          name: "useEffect",
        }),
      ],
    }),
  ]),
  value([
    entry({
      id: "outro",
      name: "Outro",
    }),
  ]),
];

test("collectSectionTagIds unions entry- and child-level ids, deduped", () => {
  assert.deepEqual(collectSectionTagIds(values.flatMap(v => v.sections)).sort(), [
    "t-react",
    "t-state",
  ]);
  assert.deepEqual(collectSectionTagIds([]), []);
});

test("sectionsCarryAnyTag matches at entry and child level, short-circuiting misses", () => {
  assert.equal(sectionsCarryAnyTag(values, new Set(["t-react"])), true);
  // Child-only tag still matches.
  assert.equal(sectionsCarryAnyTag(values, new Set(["t-state"])), true);
  assert.equal(sectionsCarryAnyTag(values, new Set(["t-elsewhere"])), false);
  assert.equal(sectionsCarryAnyTag([], new Set(["t-react"])), false);
});

test("taggedSectionNames names each matching entry/child without cascading a parent match", () => {
  // t-react sits on the Intro entry and the useState child — Hooks itself is untagged.
  assert.deepEqual(taggedSectionNames(values, new Set(["t-react"])), ["Intro", "useState"]);
  assert.deepEqual(taggedSectionNames(values, new Set(["t-state"])), ["useState"]);
  assert.deepEqual(taggedSectionNames(values, new Set(["t-elsewhere"])), []);
});

test("taggedSectionNames dedupes repeated names across values", () => {
  const dup = [
    value([entry({
      id: "a",
      name: "Chapter 1",
      tagIds: ["t-x"],
    })]),
    value([entry({
      id: "b",
      name: "Chapter 1",
      tagIds: ["t-x"],
    })]),
  ];
  assert.deepEqual(taggedSectionNames(dup, new Set(["t-x"])), ["Chapter 1"]);
});

const favoriteValues: BookmarkSectionsValue[] = [
  value([
    entry({
      id: "intro",
      name: "Intro",
      isFavorite: true,
    }),
    entry({
      id: "hooks",
      name: "Hooks",
      children: [
        entry({
          id: "use-state",
          name: "useState",
          isFavorite: true,
        }),
        entry({
          id: "use-effect",
          name: "useEffect",
        }),
      ],
    }),
  ]),
];

test("favoriteSectionEntries lists starred entries and children in order, with parent context", () => {
  const refs = favoriteSectionEntries(favoriteValues);
  assert.deepEqual(refs.map(r => [r.entry.name, r.parentName]), [
    ["Intro", null],
    ["useState", "Hooks"],
  ]);
});

test("favoriteSectionEntries does not cascade a starred parent to its children", () => {
  const starredParent = [value([entry({
    id: "hooks",
    name: "Hooks",
    isFavorite: true,
    children: [entry({
      id: "use-state",
      name: "useState",
    })],
  })])];
  assert.deepEqual(favoriteSectionEntries(starredParent).map(r => r.entry.name), ["Hooks"]);
});

test("favoriteSectionCount counts starred entries and children; empty when none", () => {
  assert.equal(favoriteSectionCount(favoriteValues), 2);
  assert.equal(favoriteSectionCount(values), 0);
  assert.equal(favoriteSectionCount([]), 0);
});
