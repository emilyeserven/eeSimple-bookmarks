import { describe, expect, it } from "vitest";

import { validateCardDisplayListSearch } from "./cardDisplayScope";

describe("validateCardDisplayListSearch", () => {
  it("returns an empty object for empty / unrelated input", () => {
    expect(validateCardDisplayListSearch({})).toEqual({});
    expect(validateCardDisplayListSearch({
      unrelated: "x",
    })).toEqual({});
  });

  it("keeps a known scope + slug pair", () => {
    expect(validateCardDisplayListSearch({
      scope: "website",
      scopeSlug: "101cookbooks",
    })).toEqual({
      scope: "website",
      scopeSlug: "101cookbooks",
    });
    expect(validateCardDisplayListSearch({
      scope: "media-type",
      scopeSlug: "video",
    })).toEqual({
      scope: "media-type",
      scopeSlug: "video",
    });
  });

  it("drops an unknown scope and an orphan scopeSlug", () => {
    expect(validateCardDisplayListSearch({
      scope: "bogus",
      scopeSlug: "recipes",
    })).toEqual({});
    // scopeSlug without a scope is meaningless.
    expect(validateCardDisplayListSearch({
      scopeSlug: "recipes",
    })).toEqual({});
  });

  it("trims/omits empty scopeSlug strings", () => {
    expect(validateCardDisplayListSearch({
      scope: "category",
      scopeSlug: "   ",
    })).toEqual({
      scope: "category",
    });
    expect(validateCardDisplayListSearch({
      scope: "category",
      scopeSlug: "  recipes  ",
    })).toEqual({
      scope: "category",
      scopeSlug: "recipes",
    });
  });

  it("ignores non-string values", () => {
    expect(validateCardDisplayListSearch({
      scope: 3,
      scopeSlug: 7,
    })).toEqual({});
  });
});
