// @vitest-environment node
import { describe, expect, it } from "vitest";

import { resolveServerPage } from "./serverPagination";

describe("resolveServerPage", () => {
  it("computes the window for an in-range page", () => {
    expect(resolveServerPage(2, 55, 25)).toEqual({
      page: 2,
      totalPages: 3,
      offset: 25,
      rangeStart: 26,
    });
  });

  it("trusts the requested page while the total is unknown (first load)", () => {
    expect(resolveServerPage(4, undefined, 25)).toEqual({
      page: 4,
      totalPages: 4,
      offset: 75,
      rangeStart: 76,
    });
  });

  it("snaps an out-of-range page down to the last page once the total is known", () => {
    expect(resolveServerPage(5, 30, 25)).toEqual({
      page: 2,
      totalPages: 2,
      offset: 25,
      rangeStart: 26,
    });
  });

  it("clamps a below-range page up to 1", () => {
    expect(resolveServerPage(0, 30, 25)).toMatchObject({
      page: 1,
      offset: 0,
    });
  });

  it("reports an empty set as one page with a 0 range start", () => {
    expect(resolveServerPage(1, 0, 25)).toEqual({
      page: 1,
      totalPages: 1,
      offset: 0,
      rangeStart: 0,
    });
  });

  it("guards against a non-positive per-page size", () => {
    expect(resolveServerPage(2, 10, 0)).toMatchObject({
      totalPages: 10,
      offset: 1,
    });
  });
});
