// @vitest-environment node
import { describe, expect, it } from "vitest";

import { resolveTermDisplay } from "./cardTaxonomyDisplay";

describe("resolveTermDisplay", () => {
  it("shows all names when there is no cap and no collapse (default)", () => {
    expect(resolveTermDisplay(5, {
      maxTerms: null,
      collapseToCount: false,
    })).toEqual({
      mode: "all",
    });
  });

  it("shows all names when the total is within the cap", () => {
    expect(resolveTermDisplay(3, {
      maxTerms: 3,
      collapseToCount: false,
    })).toEqual({
      mode: "all",
    });
  });

  it("caps to the first N names + a hidden count once over the cap", () => {
    expect(resolveTermDisplay(5, {
      maxTerms: 3,
      collapseToCount: false,
    })).toEqual({
      mode: "limit",
      visible: 3,
      hidden: 2,
    });
  });

  it("collapses to a count past the threshold when collapseToCount is set", () => {
    expect(resolveTermDisplay(5, {
      maxTerms: 3,
      collapseToCount: true,
    })).toEqual({
      mode: "count",
      total: 5,
    });
  });

  it("keeps names below the threshold even with collapseToCount set", () => {
    expect(resolveTermDisplay(2, {
      maxTerms: 3,
      collapseToCount: true,
    })).toEqual({
      mode: "all",
    });
  });

  it("always collapses to a count when collapseToCount is set with no cap", () => {
    expect(resolveTermDisplay(4, {
      maxTerms: null,
      collapseToCount: true,
    })).toEqual({
      mode: "count",
      total: 4,
    });
  });

  it("treats a cap of 0 with collapse as always-count (everything exceeds 0)", () => {
    expect(resolveTermDisplay(1, {
      maxTerms: 0,
      collapseToCount: true,
    })).toEqual({
      mode: "count",
      total: 1,
    });
  });
});
