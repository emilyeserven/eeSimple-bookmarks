import { describe, expect, it } from "vitest";

import { validateDrawerSearch } from "./drawerSearch";

describe("validateDrawerSearch", () => {
  it("returns an item state for a valid open type/id pair, defaulting the mode to view", () => {
    expect(validateDrawerSearch({
      dOpen: true,
      dCT: "autofill",
      dCId: "rule-1",
    })).toEqual({
      dOpen: true,
      dCT: "autofill",
      dCId: "rule-1",
      dMode: "view",
    });
  });

  it("keeps an explicit edit mode", () => {
    expect(validateDrawerSearch({
      dOpen: true,
      dCT: "tag",
      dCId: "tag-1",
      dMode: "edit",
    })).toEqual({
      dOpen: true,
      dCT: "tag",
      dCId: "tag-1",
      dMode: "edit",
    });
  });

  it("treats a content type as open even without the open flag (deep links)", () => {
    expect(validateDrawerSearch({
      dCT: "bookmark",
    })).toEqual({
      dOpen: true,
      dCT: "bookmark",
    });
  });

  it("collapses to the tiles state when open with no content type", () => {
    expect(validateDrawerSearch({
      dOpen: true,
    })).toEqual({
      dOpen: true,
    });
  });

  it("drops the id when no content type is present", () => {
    expect(validateDrawerSearch({
      dOpen: true,
      dCId: "tag-1",
    })).toEqual({
      dOpen: true,
    });
  });

  it("is closed when neither the open flag nor a content type is present", () => {
    expect(validateDrawerSearch({})).toEqual({});
    expect(validateDrawerSearch({
      dMode: "edit",
    })).toEqual({});
  });

  it("rejects an unknown content type or empty id", () => {
    expect(validateDrawerSearch({
      dOpen: true,
      dCT: "bogus",
      dCId: "x",
    })).toEqual({
      dOpen: true,
    });
    expect(validateDrawerSearch({
      dOpen: true,
      dCT: "tag",
      dCId: "",
    })).toEqual({
      dOpen: true,
      dCT: "tag",
    });
  });
});
