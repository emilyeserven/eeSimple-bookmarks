// @vitest-environment node
import { describe, expect, it } from "vitest";

import { joinSelectorPath } from "./sectionSelectorPath";

describe("joinSelectorPath", () => {
  it("joins non-empty segments with a descendant combinator", () => {
    expect(joinSelectorPath("aside > ul > li", "a")).toBe("aside > ul > li a");
  });

  it("drops empty, whitespace-only, null, and undefined segments", () => {
    expect(joinSelectorPath("", "  ", null, undefined, ".row")).toBe(".row");
    expect(joinSelectorPath(".card", undefined, ".title")).toBe(".card .title");
  });

  it("trims each segment before joining", () => {
    expect(joinSelectorPath("  .card  ", "  .title  ")).toBe(".card .title");
  });

  it("returns an empty string when every segment is empty", () => {
    expect(joinSelectorPath("", null, undefined)).toBe("");
  });

  it("returns a single segment unchanged (trimmed)", () => {
    expect(joinSelectorPath("  .only  ")).toBe(".only");
  });
});
