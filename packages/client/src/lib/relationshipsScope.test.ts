// @vitest-environment node
import { describe, expect, it } from "vitest";

import { validateRelationshipsListSearch } from "./relationshipsScope";

describe("validateRelationshipsListSearch", () => {
  it("returns an empty object for empty / unrelated input", () => {
    expect(validateRelationshipsListSearch({})).toEqual({});
    expect(validateRelationshipsListSearch({
      unrelated: "x",
    })).toEqual({});
  });

  it("keeps a bookmark id", () => {
    expect(validateRelationshipsListSearch({
      bookmark: "abc123",
    })).toEqual({
      bookmark: "abc123",
    });
  });

  it("trims the id and drops blank / whitespace-only values", () => {
    expect(validateRelationshipsListSearch({
      bookmark: "  abc  ",
    })).toEqual({
      bookmark: "abc",
    });
    expect(validateRelationshipsListSearch({
      bookmark: "   ",
    })).toEqual({});
    expect(validateRelationshipsListSearch({
      bookmark: "",
    })).toEqual({});
  });

  it("ignores non-string values", () => {
    expect(validateRelationshipsListSearch({
      bookmark: 3,
    })).toEqual({});
    expect(validateRelationshipsListSearch({
      bookmark: {},
    })).toEqual({});
  });
});
