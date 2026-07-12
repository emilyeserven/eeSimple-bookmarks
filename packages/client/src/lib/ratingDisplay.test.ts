// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ratingFillBounds } from "./ratingDisplay";

describe("ratingFillBounds", () => {
  it("fills from the left for a single value", () => {
    expect(ratingFillBounds({
      display: 3,
      value: 3,
      rangeEnd: null,
      readOnly: true,
      rangeIncludeStart: false,
    })).toEqual({
      bandStart: 0,
      bandEnd: 3,
    });
  });

  it("uses the hover display when interactive (ignores the band)", () => {
    expect(ratingFillBounds({
      display: 4,
      value: 2,
      rangeEnd: 5,
      readOnly: false,
      rangeIncludeStart: true,
    })).toEqual({
      bandStart: 0,
      bandEnd: 4,
    });
  });

  it("draws a start-exclusive band for a read-only range by default", () => {
    // 3→5 → band (3, 5]: fills stars 4 and 5.
    expect(ratingFillBounds({
      display: 3,
      value: 3,
      rangeEnd: 5,
      readOnly: true,
      rangeIncludeStart: false,
    })).toEqual({
      bandStart: 3,
      bandEnd: 5,
    });
  });

  it("includes the start level when rangeIncludeStart is set", () => {
    // 3→5 → band [3, 5]: bandStart shifts to value-1 so star 3 fills too (3,4,5 = 3 filled).
    expect(ratingFillBounds({
      display: 3,
      value: 3,
      rangeEnd: 5,
      readOnly: true,
      rangeIncludeStart: true,
    })).toEqual({
      bandStart: 2,
      bandEnd: 5,
    });
  });

  it("treats a range whose ends are equal as a single value (no band)", () => {
    expect(ratingFillBounds({
      display: 3,
      value: 3,
      rangeEnd: 3,
      readOnly: true,
      rangeIncludeStart: true,
    })).toEqual({
      bandStart: 0,
      bandEnd: 3,
    });
  });
});
