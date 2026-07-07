// @vitest-environment node
import { describe, expect, it } from "vitest";

import { bookmarkImageModeLabel, COLUMN_CLASS, COLUMN_OPTIONS } from "./bookmarkColumns";

describe("bookmarkImageModeLabel", () => {
  it("labels each known mode", () => {
    expect(bookmarkImageModeLabel("natural")).toBe("Natural");
    expect(bookmarkImageModeLabel("square")).toBe("Square");
    expect(bookmarkImageModeLabel("opengraph")).toBe("OpenGraph");
    expect(bookmarkImageModeLabel("cropped")).toBe("Cropped");
  });

  it("falls back to Custom for an unrecognized mode (e.g. a custom ratio UUID)", () => {
    expect(bookmarkImageModeLabel("3f1c1b8e-0000-4000-8000-000000000000")).toBe("Custom");
  });
});

describe("COLUMN_CLASS", () => {
  it("has an entry for every supported column option", () => {
    for (const count of COLUMN_OPTIONS) {
      expect(COLUMN_CLASS[count]).toBeTruthy();
    }
  });
});
