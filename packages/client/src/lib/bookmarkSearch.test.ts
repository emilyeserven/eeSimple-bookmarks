import type { BookmarkSearch } from "./bookmarkSearch";

import { describe, expect, it } from "vitest";

import {
  bookmarkMatchesSearch,
  bookmarkSearchEquals,
  hasAnyActiveFilter,
  validateBookmarkSearch,
  withBooleanFilter,
  withCategories,
  withMediaTypes,
  withNumberFilter,
  withTags,
  withWebsitePresence,
  withWebsites,
  withYouTubeChannelPresence,
  withYouTubeChannels,
} from "./bookmarkSearch";

describe("validateBookmarkSearch", () => {
  it("keeps a string-array tags field and drops non-string entries", () => {
    expect(validateBookmarkSearch({
      tags: ["abc", "def"],
    })).toEqual({
      tags: ["abc", "def"],
    });
    expect(validateBookmarkSearch({
      tags: ["abc", 5, null],
    })).toEqual({
      tags: ["abc"],
    });
    expect(validateBookmarkSearch({
      tags: [],
    })).toEqual({});
    expect(validateBookmarkSearch({
      tags: "not-an-array",
    })).toEqual({});
  });

  it("keeps a valid categories array and drops non-string entries", () => {
    expect(validateBookmarkSearch({
      categories: ["cat-1", "cat-2"],
    })).toEqual({
      categories: ["cat-1", "cat-2"],
    });
    expect(validateBookmarkSearch({
      categories: ["cat-1", 42, null],
    })).toEqual({
      categories: ["cat-1"],
    });
    expect(validateBookmarkSearch({
      categories: [],
    })).toEqual({});
    expect(validateBookmarkSearch({
      categories: "not-an-array",
    })).toEqual({});
  });

  it("keeps valid mediaTypes / youtubeChannels arrays and drops malformed ones", () => {
    expect(validateBookmarkSearch({
      mediaTypes: ["mt-1", 7],
      youtubeChannels: ["ch-1", "ch-2"],
    })).toEqual({
      mediaTypes: ["mt-1"],
      youtubeChannels: ["ch-1", "ch-2"],
    });
    expect(validateBookmarkSearch({
      mediaTypes: [],
      youtubeChannels: "nope",
    })).toEqual({});
  });

  it("keeps a valid websites array and drops malformed entries", () => {
    expect(validateBookmarkSearch({
      websites: ["site-1", 9, null],
    })).toEqual({
      websites: ["site-1"],
    });
    expect(validateBookmarkSearch({
      websites: [],
    })).toEqual({});
    expect(validateBookmarkSearch({
      websites: "nope",
    })).toEqual({});
  });

  it("keeps well-formed number and boolean records and drops malformed entries", () => {
    const result = validateBookmarkSearch({
      num: {
        p1: [1, 3],
        bad: [1],
        worse: ["a", "b"],
      },
      bool: {
        p2: true,
        p3: "no",
      },
    });
    expect(result).toEqual({
      num: {
        p1: [1, 3],
      },
      bool: {
        p2: true,
      },
    });
  });

  it("keeps a valid relationshipTypes array and drops malformed entries", () => {
    expect(validateBookmarkSearch({
      relationshipTypes: ["rt-1", 2, null, "rt-2"],
    })).toEqual({
      relationshipTypes: ["rt-1", "rt-2"],
    });
    expect(validateBookmarkSearch({
      relationshipTypes: [],
    })).toEqual({});
  });

  it("narrows presence enums and drops invalid values", () => {
    expect(validateBookmarkSearch({
      tagPresence: "has",
      youtubeChannelPresence: "missing",
      websitePresence: "nonsense",
    })).toEqual({
      tagPresence: "has",
      youtubeChannelPresence: "missing",
    });
  });

  it("keeps well-formed date and presence records and drops malformed entries", () => {
    expect(validateBookmarkSearch({
      date: {
        d1: ["2020-01-01", null],
        bad: [1, 2],
        empty: [null, null],
      },
      presence: {
        p1: "has",
        p2: "missing",
        p3: "maybe",
      },
    })).toEqual({
      date: {
        d1: ["2020-01-01", null],
      },
      presence: {
        p1: "has",
        p2: "missing",
      },
    });
  });

  it("omits empty filter records", () => {
    expect(validateBookmarkSearch({
      num: {},
      bool: {},
    })).toEqual({});
  });

  it("returns an object with no undefined-valued keys for a fully empty search", () => {
    const result = validateBookmarkSearch({});
    expect(Object.keys(result)).toEqual([]);
  });
});

describe("with* helpers", () => {
  it("sets and clears the category filter", () => {
    expect(withCategories({}, ["cat-1", "cat-2"])).toEqual({
      categories: ["cat-1", "cat-2"],
    });
    expect(withCategories({
      categories: ["cat-1"],
    }, [])).toEqual({});
    const base = {
      categories: ["cat-1"],
    };
    expect(withCategories(base, ["cat-2"])).toEqual({
      categories: ["cat-2"],
    });
    expect(base).toEqual({
      categories: ["cat-1"],
    });
  });

  it("sets and clears the media-type and channel filters", () => {
    expect(withMediaTypes({}, ["mt-1"])).toEqual({
      mediaTypes: ["mt-1"],
    });
    expect(withMediaTypes({
      mediaTypes: ["mt-1"],
    }, [])).toEqual({});
    expect(withYouTubeChannels({}, ["ch-1", "ch-2"])).toEqual({
      youtubeChannels: ["ch-1", "ch-2"],
    });
    expect(withYouTubeChannels({
      youtubeChannels: ["ch-1"],
    }, [])).toEqual({});
    expect(withWebsites({}, ["site-1", "site-2"])).toEqual({
      websites: ["site-1", "site-2"],
    });
    expect(withWebsites({
      websites: ["site-1"],
    }, [])).toEqual({});
  });

  it("sets and clears channel/website presence, dropping the selection on 'missing'", () => {
    expect(withYouTubeChannelPresence({}, "has")).toEqual({
      youtubeChannelPresence: "has",
    });
    expect(withYouTubeChannelPresence({
      youtubeChannels: ["ch-1"],
    }, "missing")).toEqual({
      youtubeChannelPresence: "missing",
    });
    expect(withYouTubeChannelPresence({
      youtubeChannelPresence: "has",
    }, undefined)).toEqual({});

    expect(withWebsitePresence({
      websites: ["site-1"],
    }, "missing")).toEqual({
      websitePresence: "missing",
    });
    expect(withWebsitePresence({
      websitePresence: "has",
    }, undefined)).toEqual({});
  });

  it("sets and clears tags immutably", () => {
    const base = {
      tags: ["a"],
    };
    expect(withTags(base, ["b"])).toEqual({
      tags: ["b"],
    });
    expect(withTags(base, [])).toEqual({});
    expect(base).toEqual({
      tags: ["a"],
    });
  });

  it("sets and clears number/boolean filters, pruning empty records", () => {
    const withNum = withNumberFilter({}, "p1", [1, 3]);
    expect(withNum).toEqual({
      num: {
        p1: [1, 3],
      },
    });
    expect(withNumberFilter(withNum, "p1", undefined)).toEqual({
      num: undefined,
    });

    const withBool = withBooleanFilter({}, "p2", true);
    expect(withBool).toEqual({
      bool: {
        p2: true,
      },
    });
    expect(withBooleanFilter(withBool, "p2", undefined)).toEqual({
      bool: undefined,
    });
  });
});

describe("bookmarkMatchesSearch", () => {
  const bookmark = {
    categoryId: "cat-1",
    mediaType: {
      id: "mt-1",
      name: "Video",
      slug: "video",
      icon: null,
      parentId: null,
    },
    youtubeChannel: {
      id: "ch-1",
      name: "Veritasium",
      slug: "veritasium",
    },
    website: {
      id: "site-1",
      domain: "github.com",
      siteName: "GitHub",
      slug: "github",
      imageUrl: null,
    },
    tags: [],
    numberValues: [{
      propertyId: "p1",
      value: 2,
    }],
    booleanValues: [{
      propertyId: "p2",
      value: true,
    }],
    dateTimeValues: [{
      propertyId: "p3",
      value: "2026-06-15",
    }],
    fileValues: [],
    progressValues: [],
    choicesValues: [],
    authors: [],
    relationships: [],
  };

  it("passes when no filters are active", () => {
    expect(bookmarkMatchesSearch(bookmark, {})).toBe(true);
  });

  it("applies the category filter", () => {
    expect(bookmarkMatchesSearch(bookmark, {
      categories: ["cat-1"],
    })).toBe(true);
    expect(bookmarkMatchesSearch(bookmark, {
      categories: ["cat-1", "cat-2"],
    })).toBe(true);
    expect(bookmarkMatchesSearch(bookmark, {
      categories: ["cat-2"],
    })).toBe(false);
    expect(bookmarkMatchesSearch(bookmark, {
      categories: [],
    })).toBe(true);
  });

  it("applies the media-type filter", () => {
    expect(bookmarkMatchesSearch(bookmark, {
      mediaTypes: ["mt-1"],
    })).toBe(true);
    expect(bookmarkMatchesSearch(bookmark, {
      mediaTypes: ["mt-2"],
    })).toBe(false);
    expect(bookmarkMatchesSearch({
      ...bookmark,
      mediaType: null,
    }, {
      mediaTypes: ["mt-1"],
    })).toBe(false);
  });

  it("applies the YouTube-channel filter", () => {
    expect(bookmarkMatchesSearch(bookmark, {
      youtubeChannels: ["ch-1"],
    })).toBe(true);
    expect(bookmarkMatchesSearch(bookmark, {
      youtubeChannels: ["ch-2"],
    })).toBe(false);
    expect(bookmarkMatchesSearch({
      ...bookmark,
      youtubeChannel: null,
    }, {
      youtubeChannels: ["ch-1"],
    })).toBe(false);
  });

  it("applies the relationship-type filter", () => {
    const withRel = {
      ...bookmark,
      relationships: [{
        bookmark: {
          id: "b2",
          url: "https://example.com",
          title: "Other",
        },
        relationshipTypeId: "rt-1",
        relationshipTypeName: "Similar",
        directional: false,
        role: "related" as const,
        label: null,
      }],
    };
    expect(bookmarkMatchesSearch(withRel, {
      relationshipTypes: ["rt-1"],
    })).toBe(true);
    expect(bookmarkMatchesSearch(withRel, {
      relationshipTypes: ["rt-2"],
    })).toBe(false);
    // A bookmark with no relationships never matches a relationship-type filter.
    expect(bookmarkMatchesSearch(bookmark, {
      relationshipTypes: ["rt-1"],
    })).toBe(false);
  });

  it("applies the website filter", () => {
    expect(bookmarkMatchesSearch(bookmark, {
      websites: ["site-1"],
    })).toBe(true);
    expect(bookmarkMatchesSearch(bookmark, {
      websites: ["site-2"],
    })).toBe(false);
    expect(bookmarkMatchesSearch({
      ...bookmark,
      website: null,
    }, {
      websites: ["site-1"],
    })).toBe(false);
  });

  it("applies channel/website presence filters", () => {
    expect(bookmarkMatchesSearch(bookmark, {
      youtubeChannelPresence: "has",
    })).toBe(true);
    expect(bookmarkMatchesSearch(bookmark, {
      youtubeChannelPresence: "missing",
    })).toBe(false);
    expect(bookmarkMatchesSearch({
      ...bookmark,
      youtubeChannel: null,
    }, {
      youtubeChannelPresence: "missing",
    })).toBe(true);

    expect(bookmarkMatchesSearch(bookmark, {
      websitePresence: "has",
    })).toBe(true);
    expect(bookmarkMatchesSearch({
      ...bookmark,
      website: null,
    }, {
      websitePresence: "has",
    })).toBe(false);
    expect(bookmarkMatchesSearch({
      ...bookmark,
      website: null,
    }, {
      websitePresence: "missing",
    })).toBe(true);
  });

  it("applies number-range and boolean filters", () => {
    expect(bookmarkMatchesSearch(bookmark, {
      num: {
        p1: [1, 3],
      },
    })).toBe(true);
    expect(bookmarkMatchesSearch(bookmark, {
      num: {
        p1: [3, 5],
      },
    })).toBe(false);
    expect(bookmarkMatchesSearch(bookmark, {
      bool: {
        p2: true,
      },
    })).toBe(true);
    expect(bookmarkMatchesSearch(bookmark, {
      bool: {
        p2: false,
      },
    })).toBe(false);
  });
});

describe("bookmarkSearchEquals", () => {
  it("treats two empty searches as equal", () => {
    expect(bookmarkSearchEquals({}, {})).toBe(true);
  });

  it("matches regardless of top-level key order", () => {
    const a = {
      tags: ["t1"],
      categories: ["c1"],
    };
    const b = {
      categories: ["c1"],
      tags: ["t1"],
    };
    expect(bookmarkSearchEquals(a, b)).toBe(true);
  });

  it("matches regardless of record (num/bool) key order", () => {
    const a = {
      num: {
        p1: [1, 3],
        p2: [0, 5],
      },
    };
    const b = {
      num: {
        p2: [0, 5],
        p1: [1, 3],
      },
    };
    expect(bookmarkSearchEquals(a, b)).toBe(true);
  });

  it("ignores fields the validator drops", () => {
    expect(bookmarkSearchEquals({
      tags: ["t1"],
      bogus: 5,
    }, {
      tags: ["t1"],
    })).toBe(true);
  });

  it("returns false when the filters differ", () => {
    expect(bookmarkSearchEquals({
      tags: ["t1"],
    }, {
      tags: ["t2"],
    })).toBe(false);
    expect(bookmarkSearchEquals({
      tags: ["t1"],
    }, {})).toBe(false);
  });
});

describe("hasAnyActiveFilter", () => {
  it("returns false for an empty search", () => {
    expect(hasAnyActiveFilter({})).toBe(false);
  });

  it("treats empty collections and empty filter records as inactive", () => {
    expect(hasAnyActiveFilter({
      tags: [],
      categories: [],
      mediaTypes: [],
      youtubeChannels: [],
      websites: [],
      relationshipTypes: [],
      authors: [],
      num: {},
      bool: {},
      date: {},
      presence: {},
      choices: {},
    })).toBe(false);
  });

  const activeCases: [string, BookmarkSearch][] = [
    ["tags", {
      tags: ["t1"],
    }],
    ["tagPresence", {
      tagPresence: "has",
    }],
    ["categories", {
      categories: ["c1"],
    }],
    ["mediaTypes", {
      mediaTypes: ["m1"],
    }],
    ["youtubeChannels", {
      youtubeChannels: ["y1"],
    }],
    ["youtubeChannelPresence", {
      youtubeChannelPresence: "missing",
    }],
    ["websites", {
      websites: ["w1"],
    }],
    ["websitePresence", {
      websitePresence: "has",
    }],
    ["relationshipTypes", {
      relationshipTypes: ["r1"],
    }],
    ["authors", {
      authors: ["a1"],
    }],
    ["num", {
      num: {
        "prop-1": [1, 10],
      },
    }],
    ["bool", {
      bool: {
        "prop-1": true,
      },
    }],
    ["date", {
      date: {
        "prop-1": ["2024-01-01", null],
      },
    }],
    ["presence", {
      presence: {
        "prop-1": "has",
      },
    }],
    ["choices", {
      choices: {
        "prop-1": ["x"],
      },
    }],
  ];

  it.each(activeCases)("returns true when only %s is active", (_label, search) => {
    expect(hasAnyActiveFilter(search)).toBe(true);
  });

  it("treats a presence flag set to undefined as inactive", () => {
    expect(hasAnyActiveFilter({
      tagPresence: undefined,
      websitePresence: undefined,
      youtubeChannelPresence: undefined,
    })).toBe(false);
  });
});
