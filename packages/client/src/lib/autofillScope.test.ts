import { describe, expect, it } from "vitest";

import { validateAutofillListSearch } from "./autofillScope";

describe("validateAutofillListSearch", () => {
  it("returns an empty object for empty / unrelated input", () => {
    expect(validateAutofillListSearch({})).toEqual({});
    expect(validateAutofillListSearch({
      unrelated: "x",
    })).toEqual({});
  });

  it("keeps a known scope + slug pair", () => {
    expect(validateAutofillListSearch({
      scope: "category",
      scopeSlug: "recipes",
    })).toEqual({
      scope: "category",
      scopeSlug: "recipes",
    });
    expect(validateAutofillListSearch({
      scope: "media-type",
      scopeSlug: "video",
    })).toEqual({
      scope: "media-type",
      scopeSlug: "video",
    });
  });

  it("drops an unknown scope and an orphan scopeSlug", () => {
    expect(validateAutofillListSearch({
      scope: "bogus",
      scopeSlug: "recipes",
    })).toEqual({});
    // scopeSlug without a scope is meaningless.
    expect(validateAutofillListSearch({
      scopeSlug: "recipes",
    })).toEqual({});
  });

  it("passes through category (except the 'all' sentinel) and trims/omits empty strings", () => {
    expect(validateAutofillListSearch({
      category: "cat-1",
    })).toEqual({
      category: "cat-1",
    });
    expect(validateAutofillListSearch({
      category: "none",
    })).toEqual({
      category: "none",
    });
    expect(validateAutofillListSearch({
      category: "all",
    })).toEqual({});
    expect(validateAutofillListSearch({
      category: "   ",
      q: "",
    })).toEqual({});
  });

  it("keeps a trimmed search query", () => {
    expect(validateAutofillListSearch({
      q: "  recipe  ",
    })).toEqual({
      q: "recipe",
    });
  });

  it("ignores non-string values", () => {
    expect(validateAutofillListSearch({
      scope: 3,
      scopeSlug: 7,
      category: {},
      q: [],
    })).toEqual({});
  });
});
