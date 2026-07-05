// @vitest-environment node
import type { BookmarkSearch } from "./bookmarkSearch";

import { describe, expect, it } from "vitest";

import {
  bookmarkMatchesSearch,
  bookmarkSearchEquals,
  hasAnyActiveFilter,
  summarizeBookmarkSearch,
  tagsForServerQuery,
  validateBookmarkSearch,
  withBooleanFilter,
  withCategories,
  withMediaTypes,
  withNumberFilter,
  withSort,
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

  it("accepts 'exclude' for all presence fields", () => {
    expect(validateBookmarkSearch({
      tagPresence: "exclude",
      youtubeChannelPresence: "exclude",
      websitePresence: "exclude",
      sectionsPresence: "exclude",
    })).toEqual({
      tagPresence: "exclude",
      youtubeChannelPresence: "exclude",
      websitePresence: "exclude",
      sectionsPresence: "exclude",
    });
    expect(validateBookmarkSearch({
      presence: {
        "prop-1": "exclude",
        "prop-2": "has",
        "prop-3": "bad",
      },
    })).toEqual({
      presence: {
        "prop-1": "exclude",
        "prop-2": "has",
      },
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

  it("keeps a well-formed field sort and drops an invalid one", () => {
    expect(validateBookmarkSearch({
      sort: {
        primary: {
          field: "title",
          direction: "asc",
        },
      },
    })).toEqual({
      sort: {
        primary: {
          field: "title",
          direction: "asc",
        },
      },
    });
    expect(validateBookmarkSearch({
      sort: {
        primary: {
          field: "title",
          direction: "sideways",
        },
      },
    })).toEqual({});
    expect(validateBookmarkSearch({
      sort: {
        primary: {
          direction: "asc",
        },
      },
    })).toEqual({});
    expect(validateBookmarkSearch({
      sort: "nope",
    })).toEqual({});
  });

  it("keeps a well-formed secondary sort dimension and drops a malformed one", () => {
    expect(validateBookmarkSearch({
      sort: {
        primary: {
          field: "createdAt",
          direction: "desc",
        },
        secondary: {
          field: "title",
          direction: "asc",
        },
      },
    })).toEqual({
      sort: {
        primary: {
          field: "createdAt",
          direction: "desc",
        },
        secondary: {
          field: "title",
          direction: "asc",
        },
      },
    });
    expect(validateBookmarkSearch({
      sort: {
        primary: {
          field: "createdAt",
          direction: "desc",
        },
        secondary: {
          field: "title",
        },
      },
    })).toEqual({
      sort: {
        primary: {
          field: "createdAt",
          direction: "desc",
        },
      },
    });
  });

  it("keeps a random sort with a numeric seed and drops one without", () => {
    expect(validateBookmarkSearch({
      sort: {
        random: true,
        seed: 42,
      },
    })).toEqual({
      sort: {
        random: true,
        seed: 42,
      },
    });
    expect(validateBookmarkSearch({
      sort: {
        random: true,
      },
    })).toEqual({});
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

  it("sets and clears the sort", () => {
    const sort = {
      primary: {
        field: "title",
        direction: "asc" as const,
      },
    };
    expect(withSort({}, sort)).toEqual({
      sort,
    });
    expect(withSort({
      sort,
      categories: ["cat-1"],
    }, undefined)).toEqual({
      categories: ["cat-1"],
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
      builtIn: false,
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
    locations: [],
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
    sectionsValues: [],
    people: [],
    relationships: [],
    languageUsages: [],
    genreMoods: [],
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

  it("applies the place-type filter (any-match across a bookmark's locations)", () => {
    const withLocations = {
      ...bookmark,
      locations: [
        {
          id: "loc-1",
          name: "Tokyo",
          slug: "tokyo",
          parentId: null,
          placeType: "City",
        },
        {
          id: "loc-2",
          name: "Japan",
          slug: "japan",
          parentId: null,
          placeType: "Country",
        },
      ],
    };
    expect(bookmarkMatchesSearch(withLocations, {
      placeTypes: ["city"],
    })).toBe(true);
    expect(bookmarkMatchesSearch(withLocations, {
      placeTypes: ["region"],
    })).toBe(false);
    expect(bookmarkMatchesSearch(withLocations, {
      placeTypes: ["city", "region"],
    })).toBe(true);
    // A bookmark with no locations never matches a place-type filter.
    expect(bookmarkMatchesSearch(bookmark, {
      placeTypes: ["city"],
    })).toBe(false);
  });

  it("applies place-type presence and exclude filters", () => {
    const withLocations = {
      ...bookmark,
      locations: [{
        id: "loc-1",
        name: "Tokyo",
        slug: "tokyo",
        parentId: null,
        placeType: "City",
      }],
    };
    expect(bookmarkMatchesSearch(withLocations, {
      placeTypePresence: "has",
    })).toBe(true);
    expect(bookmarkMatchesSearch(bookmark, {
      placeTypePresence: "has",
    })).toBe(false);
    expect(bookmarkMatchesSearch(bookmark, {
      placeTypePresence: "missing",
    })).toBe(true);
    expect(bookmarkMatchesSearch(withLocations, {
      placeTypePresence: "missing",
    })).toBe(false);
    expect(bookmarkMatchesSearch(withLocations, {
      placeTypes: ["city"],
      placeTypePresence: "exclude",
    })).toBe(false);
    expect(bookmarkMatchesSearch(withLocations, {
      placeTypes: ["region"],
      placeTypePresence: "exclude",
    })).toBe(true);
  });

  it("applies Genres & Moods include, presence, and exclude filters", () => {
    const withGenreMoods = {
      ...bookmark,
      genreMoods: [{
        id: "gm-1",
        name: "Sci-Fi",
        slug: "sci-fi",
        parentId: null,
      }],
    };
    // include (any-of)
    expect(bookmarkMatchesSearch(withGenreMoods, {
      genreMoods: ["gm-1"],
    })).toBe(true);
    expect(bookmarkMatchesSearch(withGenreMoods, {
      genreMoods: ["gm-2"],
    })).toBe(false);
    // presence
    expect(bookmarkMatchesSearch(withGenreMoods, {
      genreMoodPresence: "has",
    })).toBe(true);
    expect(bookmarkMatchesSearch(bookmark, {
      genreMoodPresence: "has",
    })).toBe(false);
    expect(bookmarkMatchesSearch(bookmark, {
      genreMoodPresence: "missing",
    })).toBe(true);
    // exclude
    expect(bookmarkMatchesSearch(withGenreMoods, {
      genreMoods: ["gm-1"],
      genreMoodPresence: "exclude",
    })).toBe(false);
    expect(bookmarkMatchesSearch(withGenreMoods, {
      genreMoods: ["gm-2"],
      genreMoodPresence: "exclude",
    })).toBe(true);
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

  it("applies the language-usage facets per association row", () => {
    const withUsages = {
      ...bookmark,
      languageUsages: [
        {
          id: "lu1",
          language: {
            id: "en",
            name: "English",
            slug: "english",
            isoCode: "en",
          },
          level: {
            id: "dub",
            name: "Dub",
            slug: "dub",
            kind: "availability" as const,
          },
          note: null,
        },
        {
          id: "lu2",
          language: {
            id: "ja",
            name: "Japanese",
            slug: "japanese",
            isoCode: "ja",
          },
          level: {
            id: "subs",
            name: "Subtitles",
            slug: "subtitles",
            kind: "availability" as const,
          },
          note: null,
        },
      ],
    };
    // language-only and level-only match.
    expect(bookmarkMatchesSearch(withUsages, {
      languageUsageLanguages: ["ja"],
    })).toBe(true);
    expect(bookmarkMatchesSearch(withUsages, {
      languageUsageLevels: ["dub"],
    })).toBe(true);
    // both on one row match.
    expect(bookmarkMatchesSearch(withUsages, {
      languageUsageLanguages: ["ja"],
      languageUsageLevels: ["subs"],
    })).toBe(true);
    // cross-product does NOT match (no Japanese dub).
    expect(bookmarkMatchesSearch(withUsages, {
      languageUsageLanguages: ["ja"],
      languageUsageLevels: ["dub"],
    })).toBe(false);
    // a bookmark with no usages never matches.
    expect(bookmarkMatchesSearch(bookmark, {
      languageUsageLanguages: ["en"],
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

  it("treats sort as part of the compared state", () => {
    const sort = {
      primary: {
        field: "title",
        direction: "asc",
      },
    };
    expect(bookmarkSearchEquals({
      tags: ["t1"],
      sort,
    }, {
      tags: ["t1"],
      sort,
    })).toBe(true);
    expect(bookmarkSearchEquals({
      tags: ["t1"],
      sort,
    }, {
      tags: ["t1"],
    })).toBe(false);
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
      people: [],
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
    ["people", {
      people: ["a1"],
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

describe("tagsForServerQuery", () => {
  it("returns tags when tagPresence is not exclude", () => {
    expect(tagsForServerQuery({})).toBeUndefined();
    expect(tagsForServerQuery({
      tags: ["t1", "t2"],
    })).toEqual(["t1", "t2"]);
    expect(tagsForServerQuery({
      tags: ["t1"],
      tagPresence: "has",
    })).toEqual(["t1"]);
    expect(tagsForServerQuery({
      tags: ["t1"],
      tagPresence: "missing",
    })).toEqual(["t1"]);
  });

  it("returns undefined when tagPresence is exclude", () => {
    expect(tagsForServerQuery({
      tagPresence: "exclude",
    })).toBeUndefined();
    expect(tagsForServerQuery({
      tags: ["t1", "t2"],
      tagPresence: "exclude",
    })).toBeUndefined();
  });
});

describe("bookmarkMatchesSearch — exclude mode", () => {
  const tag1 = {
    id: "tag-1",
    name: "Fiction",
    slug: "fiction",
    parentId: null,
    editableOnCard: false,
  };
  const tag2 = {
    id: "tag-2",
    name: "Nonfiction",
    slug: "nonfiction",
    parentId: null,
    editableOnCard: false,
  };

  const base = {
    categoryId: "cat-1",
    mediaType: null,
    youtubeChannel: {
      id: "ch-1",
      name: "Channel",
      slug: "channel",
    },
    website: {
      id: "site-1",
      domain: "example.com",
      siteName: "Example",
      slug: "example",
      imageUrl: null,
    },
    tags: [tag1],
    locations: [],
    numberValues: [],
    booleanValues: [],
    dateTimeValues: [],
    fileValues: [],
    progressValues: [],
    choicesValues: [{
      propertyId: "prop-1",
      values: ["val-a", "val-b"],
    }],
    sectionsValues: [],
    people: [],
    relationships: [],
    languageUsages: [],
    genreMoods: [],
  };

  describe("tag exclusion", () => {
    it("excludes bookmark whose tags overlap with the excluded set", () => {
      expect(bookmarkMatchesSearch(base, {
        tags: ["tag-1"],
        tagPresence: "exclude",
      })).toBe(false);
    });

    it("passes bookmark whose tags do not overlap with the excluded set", () => {
      expect(bookmarkMatchesSearch(base, {
        tags: ["tag-2"],
        tagPresence: "exclude",
      })).toBe(true);
    });

    it("passes all bookmarks when no tags are selected in exclude mode", () => {
      expect(bookmarkMatchesSearch(base, {
        tagPresence: "exclude",
      })).toBe(true);
      expect(bookmarkMatchesSearch({
        ...base,
        tags: [],
      }, {
        tagPresence: "exclude",
      })).toBe(true);
    });

    it("passes a bookmark with no tags even when tags are in the excluded set", () => {
      expect(bookmarkMatchesSearch({
        ...base,
        tags: [],
      }, {
        tags: ["tag-1"],
        tagPresence: "exclude",
      })).toBe(true);
    });

    it("excludes when bookmark has ANY of the excluded tags (not just all)", () => {
      expect(bookmarkMatchesSearch({
        ...base,
        tags: [tag1, tag2],
      }, {
        tags: ["tag-1"],
        tagPresence: "exclude",
      })).toBe(false);
    });
  });

  describe("YouTube channel exclusion", () => {
    it("excludes bookmark whose channel is in the excluded set", () => {
      expect(bookmarkMatchesSearch(base, {
        youtubeChannels: ["ch-1"],
        youtubeChannelPresence: "exclude",
      })).toBe(false);
    });

    it("passes bookmark whose channel is not in the excluded set", () => {
      expect(bookmarkMatchesSearch(base, {
        youtubeChannels: ["ch-2"],
        youtubeChannelPresence: "exclude",
      })).toBe(true);
    });

    it("passes bookmark with no channel in exclude mode", () => {
      expect(bookmarkMatchesSearch({
        ...base,
        youtubeChannel: null,
      }, {
        youtubeChannels: ["ch-1"],
        youtubeChannelPresence: "exclude",
      })).toBe(true);
    });
  });

  describe("website exclusion", () => {
    it("excludes bookmark whose website is in the excluded set", () => {
      expect(bookmarkMatchesSearch(base, {
        websites: ["site-1"],
        websitePresence: "exclude",
      })).toBe(false);
    });

    it("passes bookmark whose website is not in the excluded set", () => {
      expect(bookmarkMatchesSearch(base, {
        websites: ["site-2"],
        websitePresence: "exclude",
      })).toBe(true);
    });

    it("passes bookmark with no website in exclude mode", () => {
      expect(bookmarkMatchesSearch({
        ...base,
        website: null,
      }, {
        websites: ["site-1"],
        websitePresence: "exclude",
      })).toBe(true);
    });
  });

  describe("choices property exclusion", () => {
    it("excludes bookmark that has any of the excluded choice values", () => {
      expect(bookmarkMatchesSearch(base, {
        choices: {
          "prop-1": ["val-a"],
        },
        presence: {
          "prop-1": "exclude",
        },
      })).toBe(false);
    });

    it("passes bookmark that has none of the excluded choice values", () => {
      expect(bookmarkMatchesSearch(base, {
        choices: {
          "prop-1": ["val-c"],
        },
        presence: {
          "prop-1": "exclude",
        },
      })).toBe(true);
    });

    it("passes bookmark with no choices values when in exclude mode", () => {
      expect(bookmarkMatchesSearch({
        ...base,
        choicesValues: [],
      }, {
        choices: {
          "prop-1": ["val-a"],
        },
        presence: {
          "prop-1": "exclude",
        },
      })).toBe(true);
    });
  });
});

describe("summarizeBookmarkSearch", () => {
  it("returns 'No filters' for an empty search", () => {
    expect(summarizeBookmarkSearch({})).toBe("No filters");
  });

  it("handles a single category (singular)", () => {
    expect(summarizeBookmarkSearch({
      categories: ["cat-1"],
    })).toBe("1 category");
  });

  it("handles multiple categories (plural)", () => {
    expect(summarizeBookmarkSearch({
      categories: ["cat-1", "cat-2"],
    })).toBe("2 categories");
  });

  it("handles media types", () => {
    expect(summarizeBookmarkSearch({
      mediaTypes: ["book"],
    })).toBe("1 media type");
    expect(summarizeBookmarkSearch({
      mediaTypes: ["book", "film"],
    })).toBe("2 media types");
  });

  it("handles people", () => {
    expect(summarizeBookmarkSearch({
      people: ["Person A"],
    })).toBe("1 person");
    expect(summarizeBookmarkSearch({
      people: ["A", "B"],
    })).toBe("2 people");
  });

  it("handles tags (default presence)", () => {
    expect(summarizeBookmarkSearch({
      tags: ["tag-1"],
    })).toBe("1 tag");
    expect(summarizeBookmarkSearch({
      tags: ["tag-1", "tag-2"],
    })).toBe("2 tags");
  });

  it("handles tags with 'exclude' presence", () => {
    expect(summarizeBookmarkSearch({
      tags: ["tag-1"],
      tagPresence: "exclude",
    })).toBe("1 excluded tag");
    expect(summarizeBookmarkSearch({
      tags: ["tag-1", "tag-2"],
      tagPresence: "exclude",
    })).toBe("2 excluded tags");
  });

  it("handles tagPresence other than 'exclude'", () => {
    expect(summarizeBookmarkSearch({
      tagPresence: "has",
    })).toBe("tags: has");
    expect(summarizeBookmarkSearch({
      tags: ["t"],
      tagPresence: "missing",
    })).toBe("1 tag · tags: missing");
  });

  it("handles websites with 'exclude' presence", () => {
    expect(summarizeBookmarkSearch({
      websites: ["site-1"],
      websitePresence: "exclude",
    })).toBe("1 excluded website");
  });

  it("handles websitePresence other than 'exclude'", () => {
    expect(summarizeBookmarkSearch({
      websitePresence: "has",
    })).toBe("website: has");
  });

  it("handles YouTube channels with 'exclude' presence", () => {
    expect(summarizeBookmarkSearch({
      youtubeChannels: ["ch-1", "ch-2"],
      youtubeChannelPresence: "exclude",
    })).toBe("2 excluded channels");
  });

  it("handles youtubeChannelPresence other than 'exclude'", () => {
    expect(summarizeBookmarkSearch({
      youtubeChannelPresence: "has",
    })).toBe("channel: has");
  });

  it("counts property filters across types", () => {
    expect(summarizeBookmarkSearch({
      num: {
        "prop-1": [0, 10],
      },
      bool: {
        "prop-2": true,
      },
    })).toBe("2 properties");
    expect(summarizeBookmarkSearch({
      choices: {
        "prop-1": ["a"],
      },
    })).toBe("1 property");
  });

  it("handles sectionsPresence 'exclude'", () => {
    expect(summarizeBookmarkSearch({
      sectionsPresence: "exclude",
    })).toBe("sections: excluded types");
  });

  it("handles sectionsPresence other values", () => {
    expect(summarizeBookmarkSearch({
      sectionsPresence: "has",
    })).toBe("sections: has");
  });

  it("handles sectionTypes", () => {
    expect(summarizeBookmarkSearch({
      sectionTypes: ["url", "page"],
    })).toBe("section types: url, page");
  });

  it("joins multiple filters with ' · '", () => {
    expect(summarizeBookmarkSearch({
      categories: ["cat-1"],
      tags: ["tag-1"],
    })).toBe("1 category · 1 tag");
  });

  it("drops invalid raw fields gracefully", () => {
    expect(summarizeBookmarkSearch({
      tags: "not-an-array",
      invalid: 999,
    })).toBe("No filters");
  });

  it("describes a field sort", () => {
    expect(summarizeBookmarkSearch({
      sort: {
        primary: {
          field: "createdAt",
          direction: "desc",
        },
      },
    })).toBe("sorted by date added (desc)");
  });

  it("describes a random sort", () => {
    expect(summarizeBookmarkSearch({
      sort: {
        random: true,
        seed: 1,
      },
    })).toBe("sorted randomly");
  });

  it("combines a sort with other filters", () => {
    expect(summarizeBookmarkSearch({
      categories: ["cat-1"],
      sort: {
        primary: {
          field: "title",
          direction: "asc",
        },
      },
    })).toBe("1 category · sorted by title (asc)");
  });
});
