// @vitest-environment node
import { describe, expect, it } from "vitest";

import { validateAutofillListSearch } from "./autofillScope";

describe("validateAutofillListSearch", () => {
  it("returns an empty object for empty / unrelated input", () => {
    expect(validateAutofillListSearch({})).toEqual({});
    expect(validateAutofillListSearch({
      unrelated: "x",
    })).toEqual({});
  });

  it("keeps each facet slug", () => {
    expect(validateAutofillListSearch({
      website: "youtube",
      tag: "cooking",
      mediaType: "video",
      channel: "chef-jane",
      property: "rating",
    })).toEqual({
      website: "youtube",
      tag: "cooking",
      mediaType: "video",
      channel: "chef-jane",
      property: "rating",
    });
  });

  it("keeps a category slug and the 'none' sentinel but drops 'all'", () => {
    expect(validateAutofillListSearch({
      category: "recipes",
    })).toEqual({
      category: "recipes",
    });
    expect(validateAutofillListSearch({
      category: "none",
    })).toEqual({
      category: "none",
    });
    expect(validateAutofillListSearch({
      category: "all",
    })).toEqual({});
  });

  it("migrates a legacy scope + scopeSlug pair onto its facet", () => {
    expect(validateAutofillListSearch({
      scope: "website",
      scopeSlug: "youtube",
    })).toEqual({
      website: "youtube",
    });
    expect(validateAutofillListSearch({
      scope: "media-type",
      scopeSlug: "video",
    })).toEqual({
      mediaType: "video",
    });
    expect(validateAutofillListSearch({
      scope: "category",
      scopeSlug: "recipes",
    })).toEqual({
      category: "recipes",
    });
  });

  it("drops an unknown legacy scope and an orphan scopeSlug", () => {
    expect(validateAutofillListSearch({
      scope: "bogus",
      scopeSlug: "recipes",
    })).toEqual({});
    // scopeSlug without a scope is meaningless.
    expect(validateAutofillListSearch({
      scopeSlug: "recipes",
    })).toEqual({});
  });

  it("prefers a new-style facet param over a legacy scope for the same facet", () => {
    expect(validateAutofillListSearch({
      website: "current",
      scope: "website",
      scopeSlug: "legacy",
    })).toEqual({
      website: "current",
    });
  });

  it("keeps a trimmed search query and omits empty strings", () => {
    expect(validateAutofillListSearch({
      q: "  recipe  ",
    })).toEqual({
      q: "recipe",
    });
    expect(validateAutofillListSearch({
      category: "   ",
      website: "",
      q: "",
    })).toEqual({});
  });

  it("ignores non-string values", () => {
    expect(validateAutofillListSearch({
      website: 3,
      tag: 7,
      category: {},
      q: [],
    })).toEqual({});
  });
});
