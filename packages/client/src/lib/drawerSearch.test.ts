import { describe, expect, it } from "vitest";

import { validateDrawerSearch } from "./drawerSearch";

describe("validateDrawerSearch", () => {
  it("keeps a valid type/id pair", () => {
    expect(validateDrawerSearch({
      dCT: "autofill",
      dCId: "rule-1",
    })).toEqual({
      dCT: "autofill",
      dCId: "rule-1",
    });
    expect(validateDrawerSearch({
      dCT: "tag",
      dCId: "tag-1",
    })).toEqual({
      dCT: "tag",
      dCId: "tag-1",
    });
  });

  it("drops the pair when either param is missing", () => {
    expect(validateDrawerSearch({
      dCT: "tag",
    })).toEqual({});
    expect(validateDrawerSearch({
      dCId: "tag-1",
    })).toEqual({});
    expect(validateDrawerSearch({})).toEqual({});
  });

  it("rejects an unknown content type or empty id", () => {
    expect(validateDrawerSearch({
      dCT: "bogus",
      dCId: "x",
    })).toEqual({});
    expect(validateDrawerSearch({
      dCT: "tag",
      dCId: "",
    })).toEqual({});
  });
});
