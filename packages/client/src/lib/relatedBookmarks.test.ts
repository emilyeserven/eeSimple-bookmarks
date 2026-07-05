// @vitest-environment node
import type { BookmarkGenreMood, BookmarkGraphSettings, BookmarkPerson, BookmarkTag } from "@eesimple/types";

import { DEFAULT_BOOKMARK_GRAPH_SETTINGS } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { computeRelatedBookmarks } from "./relatedBookmarks";
import { makeBookmark } from "../test-utils/factories";

const tag = (id: string): BookmarkTag => ({
  id,
  slug: id,
  name: id,
  parentId: null,
  editableOnCard: false,
});
const genreMood = (id: string): BookmarkGenreMood => ({
  id,
  slug: id,
  name: id,
  parentId: null,
});
const person = (id: string): BookmarkPerson => ({
  id,
  slug: id,
  name: id,
});

/** Settings with all weights zeroed except the named dimension (weight 3), so a test isolates it. */
function only(dimension: keyof BookmarkGraphSettings["weights"]): BookmarkGraphSettings {
  const weights: BookmarkGraphSettings["weights"] = {
    tags: 0,
    category: 0,
    mediaType: 0,
    genreMoods: 0,
    people: 0,
    groups: 0,
    website: 0,
    youtubeChannel: 0,
  };
  return {
    weights: {
      ...weights,
      [dimension]: 3,
    },
    maxRelated: 12,
  };
}

describe("computeRelatedBookmarks", () => {
  it("returns an empty list when nothing is related", () => {
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const other = makeBookmark({
      id: "b",
      tags: [tag("y")],
    });
    expect(computeRelatedBookmarks(target, [target, other], only("tags"))).toEqual([]);
  });

  it("excludes the target itself", () => {
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const other = makeBookmark({
      id: "b",
      tags: [tag("x")],
    });
    const result = computeRelatedBookmarks(target, [target, other], only("tags"));
    expect(result.map(b => b.id)).toEqual(["b"]);
  });

  it("ranks more shared tags above fewer", () => {
    const target = makeBookmark({
      id: "a",
      tags: [tag("x"), tag("y")],
    });
    const oneShared = makeBookmark({
      id: "one",
      tags: [tag("x")],
    });
    const twoShared = makeBookmark({
      id: "two",
      tags: [tag("x"), tag("y")],
    });
    const result = computeRelatedBookmarks(target, [target, oneShared, twoShared], only("tags"));
    expect(result.map(b => b.id)).toEqual(["two", "one"]);
  });

  it("weights dimensions: a higher-weighted single match outranks a lower-weighted one", () => {
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
      categoryId: "cat-1",
    });
    const sameCategory = makeBookmark({
      id: "cat",
      categoryId: "cat-1",
    });
    const sameTag = makeBookmark({
      id: "tag",
      tags: [tag("x")],
    });
    const settings: BookmarkGraphSettings = {
      weights: {
        ...only("tags").weights,
        tags: 3,
        category: 1,
      },
      maxRelated: 12,
    };
    const result = computeRelatedBookmarks(target, [target, sameCategory, sameTag], settings);
    expect(result.map(b => b.id)).toEqual(["tag", "cat"]);
  });

  it("scores scalar dimensions on exact match only (shared null is not a match)", () => {
    const target = makeBookmark({
      id: "a",
      mediaType: null,
    });
    const other = makeBookmark({
      id: "b",
      mediaType: null,
    });
    expect(computeRelatedBookmarks(target, [target, other], only("mediaType"))).toEqual([]);
  });

  it("respects maxRelated", () => {
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const others = Array.from({
      length: 5,
    }, (_, i) =>
      makeBookmark({
        id: `b${i}`,
        tags: [tag("x")],
      }));
    const settings: BookmarkGraphSettings = {
      weights: only("tags").weights,
      maxRelated: 2,
    };
    const result = computeRelatedBookmarks(target, [target, ...others], settings);
    expect(result).toHaveLength(2);
  });

  it("combines multiple dimensions with the default weights", () => {
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
      genreMoods: [genreMood("g")],
      people: [person("p")],
    });
    const strong = makeBookmark({
      id: "strong",
      tags: [tag("x")],
      genreMoods: [genreMood("g")],
      people: [person("p")],
    });
    const weak = makeBookmark({
      id: "weak",
      genreMoods: [genreMood("g")],
    });
    const result = computeRelatedBookmarks(
      target,
      [target, weak, strong],
      DEFAULT_BOOKMARK_GRAPH_SETTINGS,
    );
    expect(result.map(b => b.id)).toEqual(["strong", "weak"]);
  });
});
