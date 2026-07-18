// @vitest-environment node
import { describe, expect, it } from "vitest";

import { filterTagBookmarks, validateTagSearch } from "./-tagSearch";
import { makeBookmark } from "../test-utils/factories";

describe("validateTagSearch", () => {
  it("accepts true / 'true' / '1' and drops anything else", () => {
    expect(validateTagSearch({
      taggedSections: true,
    }).taggedSections).toBe(true);
    expect(validateTagSearch({
      taggedSections: "true",
    }).taggedSections).toBe(true);
    expect(validateTagSearch({
      taggedSections: "1",
    }).taggedSections).toBe(true);
    expect(validateTagSearch({
      taggedSections: "0",
    }).taggedSections).toBeUndefined();
    expect(validateTagSearch({}).taggedSections).toBeUndefined();
  });

  it("preserves the shared bookmark-search fields", () => {
    expect(validateTagSearch({
      categories: ["dev"],
      taggedSections: "1",
    })).toMatchObject({
      categories: ["dev"],
      taggedSections: true,
    });
  });
});

describe("filterTagBookmarks", () => {
  const tagged = makeBookmark({
    id: "b-tagged",
    tags: [{
      id: "t-dev",
      name: "dev",
      slug: "dev",
      parentId: null,
      editableOnCard: false,
    }],
  });
  const sectioned = makeBookmark({
    id: "b-sectioned",
    sectionsValues: [{
      propertyId: "p1",
      exhaustive: false,
      sections: [{
        id: "s1",
        name: "Chapter on dev",
        type: "name",
        startValue: "",
        tagIds: ["t-dev"],
      }],
    }],
  });
  const childSectioned = makeBookmark({
    id: "b-child",
    sectionsValues: [{
      propertyId: "p1",
      exhaustive: false,
      sections: [{
        id: "s2",
        name: "Course",
        type: "name",
        startValue: "",
        children: [{
          id: "s2a",
          name: "Module",
          type: "name",
          startValue: "",
          tagIds: ["t-dev"],
        }],
      }],
    }],
  });
  const unrelated = makeBookmark({
    id: "b-none",
  });
  const all = [tagged, sectioned, childSectioned, unrelated];
  const tagIds = new Set(["t-dev"]);

  it("default mode keeps only directly-tagged bookmarks", () => {
    expect(filterTagBookmarks(all, tagIds, undefined).map(b => b.id)).toEqual(["b-tagged"]);
  });

  it("taggedSections mode replaces the base filter with section-tag membership (both tiers)", () => {
    expect(filterTagBookmarks(all, tagIds, true).map(b => b.id))
      .toEqual(["b-sectioned", "b-child"]);
  });
});
