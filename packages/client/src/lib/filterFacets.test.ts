// @vitest-environment node
import type { BookmarkSearch } from "./bookmarkSearch";

import { describe, expect, it } from "vitest";

import { facetHasActiveSelection, propertyHasActiveSelection } from "./filterFacets";

describe("facetHasActiveSelection", () => {
  it("is false for an empty search", () => {
    expect(facetHasActiveSelection("tags", {})).toBe(false);
    expect(facetHasActiveSelection("categories", {})).toBe(false);
    expect(facetHasActiveSelection("sections", {})).toBe(false);
  });

  it("detects selected values per facet", () => {
    expect(facetHasActiveSelection("tags", {
      tags: ["a"],
    })).toBe(true);
    expect(facetHasActiveSelection("categories", {
      categories: ["c"],
    })).toBe(true);
    expect(facetHasActiveSelection("media-types", {
      mediaTypes: ["m"],
    })).toBe(true);
    expect(facetHasActiveSelection("channels", {
      youtubeChannels: ["y"],
    })).toBe(true);
    expect(facetHasActiveSelection("websites", {
      websites: ["w"],
    })).toBe(true);
    expect(facetHasActiveSelection("relationship-types", {
      relationshipTypes: ["r"],
    })).toBe(true);
    expect(facetHasActiveSelection("people", {
      people: ["au"],
    })).toBe(true);
    expect(facetHasActiveSelection("place-types", {
      placeTypes: ["city"],
    })).toBe(true);
    expect(facetHasActiveSelection("sections", {
      sectionTypes: ["url"],
    })).toBe(true);
  });

  it("treats a presence-only filter as active", () => {
    expect(facetHasActiveSelection("tags", {
      tagPresence: "missing",
    })).toBe(true);
    expect(facetHasActiveSelection("channels", {
      youtubeChannelPresence: "has",
    })).toBe(true);
    expect(facetHasActiveSelection("websites", {
      websitePresence: "exclude",
    })).toBe(true);
    expect(facetHasActiveSelection("place-types", {
      placeTypePresence: "has",
    })).toBe(true);
    expect(facetHasActiveSelection("sections", {
      sectionsPresence: "has",
    })).toBe(true);
  });

  it("ignores empty arrays", () => {
    const search: BookmarkSearch = {
      tags: [],
      categories: [],
    };
    expect(facetHasActiveSelection("tags", search)).toBe(false);
    expect(facetHasActiveSelection("categories", search)).toBe(false);
  });
});

describe("propertyHasActiveSelection", () => {
  it("is false when no filter targets the property", () => {
    expect(propertyHasActiveSelection("p1", {})).toBe(false);
    expect(propertyHasActiveSelection("p1", {
      num: {
        p2: [0, 5],
      },
    })).toBe(false);
  });

  it("detects each filter kind keyed by property id", () => {
    expect(propertyHasActiveSelection("p1", {
      num: {
        p1: [0, 5],
      },
    })).toBe(true);
    expect(propertyHasActiveSelection("p1", {
      bool: {
        p1: true,
      },
    })).toBe(true);
    expect(propertyHasActiveSelection("p1", {
      date: {
        p1: [null, null],
      },
    })).toBe(true);
    expect(propertyHasActiveSelection("p1", {
      presence: {
        p1: "has",
      },
    })).toBe(true);
    expect(propertyHasActiveSelection("p1", {
      choices: {
        p1: ["x"],
      },
    })).toBe(true);
  });

  it("ignores an empty choices array", () => {
    expect(propertyHasActiveSelection("p1", {
      choices: {
        p1: [],
      },
    })).toBe(false);
  });
});
