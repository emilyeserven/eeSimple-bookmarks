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
    expect(result.map(e => e.bookmark.id)).toEqual(["b"]);
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
    expect(result.map(e => e.bookmark.id)).toEqual(["two", "one"]);
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
    expect(result.map(e => e.bookmark.id)).toEqual(["tag", "cat"]);
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

  it("pins an explicit relationship partner first regardless of graph score", () => {
    const partner = makeBookmark({
      id: "partner",
    });
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
      relationships: [
        {
          relationshipTypeId: "rt1",
          relationshipTypeName: "Analysis of",
          directional: false,
          role: "related",
          label: null,
          bookmark: {
            id: "partner",
            title: partner.title,
            url: partner.url,
          },
        },
      ],
    });
    const scoredMatch = makeBookmark({
      id: "scored",
      tags: [tag("x")],
    });
    const result = computeRelatedBookmarks(target, [target, partner, scoredMatch], only("tags"));
    expect(result.map(e => e.bookmark.id)).toEqual(["partner", "scored"]);
    expect(result[0].relationship?.relationshipTypeName).toBe("Analysis of");
    expect(result[1].relationship).toBeUndefined();
  });

  it("dedupes a pinned partner out of the scored tail", () => {
    const partner = makeBookmark({
      id: "partner",
      tags: [tag("x")],
    });
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
      relationships: [
        {
          relationshipTypeId: "rt1",
          relationshipTypeName: "Similar",
          directional: false,
          role: "related",
          label: null,
          bookmark: {
            id: "partner",
            title: partner.title,
            url: partner.url,
          },
        },
      ],
    });
    const result = computeRelatedBookmarks(target, [target, partner], only("tags"));
    expect(result.map(e => e.bookmark.id)).toEqual(["partner"]);
  });

  it("truncates only the scored tail once pinned partners are counted against maxRelated", () => {
    const partner = makeBookmark({
      id: "partner",
    });
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
      relationships: [
        {
          relationshipTypeId: "rt1",
          relationshipTypeName: "Similar",
          directional: false,
          role: "related",
          label: null,
          bookmark: {
            id: "partner",
            title: partner.title,
            url: partner.url,
          },
        },
      ],
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
    const result = computeRelatedBookmarks(target, [target, partner, ...others], settings);
    expect(result.map(e => e.bookmark.id)).toEqual(["partner", "b0"]);
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
    expect(result.map(e => e.bookmark.id)).toEqual(["strong", "weak"]);
  });
});
