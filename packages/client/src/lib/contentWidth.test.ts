// @vitest-environment node
import { describe, expect, it } from "vitest";

import { contentWidthClass } from "./contentWidth";

describe("contentWidthClass", () => {
  it("spans half the column on desktop for 'half'", () => {
    expect(contentWidthClass("half")).toBe("col-span-2 md:col-span-1");
  });

  it("always spans the full column for 'full'", () => {
    expect(contentWidthClass("full")).toBe("col-span-2");
  });
});
