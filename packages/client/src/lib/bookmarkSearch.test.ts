import { describe, expect, it } from "vitest";

import {
  bookmarkMatchesSearch,
  validateBookmarkSearch,
  withBooleanFilter,
  withCategories,
  withNumberFilter,
  withTag,
} from "./bookmarkSearch";

describe("validateBookmarkSearch", () => {
  it("keeps a string tag and drops a non-string one", () => {
    expect(validateBookmarkSearch({
      tag: "abc",
    })).toEqual({
      tag: "abc",
    });
    expect(validateBookmarkSearch({
      tag: 5,
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

  it("omits empty filter records", () => {
    expect(validateBookmarkSearch({
      num: {},
      bool: {},
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

  it("sets and clears the tag immutably", () => {
    const base = {
      tag: "a",
    };
    expect(withTag(base, "b")).toEqual({
      tag: "b",
    });
    expect(withTag(base, undefined)).toEqual({});
    expect(base).toEqual({
      tag: "a",
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
