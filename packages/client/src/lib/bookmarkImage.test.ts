import type { CustomAspectRatio } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { bookmarkImageAspectStyle, bookmarkImageClass } from "./bookmarkImage";

describe("bookmarkImageClass", () => {
  it("uses fixed-width left layout, omitting object-cover for natural mode", () => {
    expect(bookmarkImageClass(true, "natural")).toContain("w-32");
    expect(bookmarkImageClass(true, "natural")).not.toContain("object-cover");
  });

  it("adds object-cover for a non-natural left layout", () => {
    expect(bookmarkImageClass(true, "cropped")).toContain("object-cover");
  });

  it("uses full-width top layout when imageLeft is false", () => {
    expect(bookmarkImageClass(false, "natural")).toContain("w-full");
    expect(bookmarkImageClass(false, "cropped")).toContain("object-cover");
  });
});

describe("bookmarkImageAspectStyle", () => {
  const customRatios: CustomAspectRatio[] = [
    {
      id: "wide",
      width: 3,
      height: 1,
    } as CustomAspectRatio,
  ];

  it("returns no aspect ratio for natural mode", () => {
    expect(bookmarkImageAspectStyle("natural", 4, 3, [])).toEqual({});
  });

  it("resolves the built-in square / opengraph ratios", () => {
    expect(bookmarkImageAspectStyle("square", 4, 3, [])).toEqual({
      aspectRatio: "1 / 1",
    });
    expect(bookmarkImageAspectStyle("opengraph", 4, 3, [])).toEqual({
      aspectRatio: "191 / 100",
    });
  });

  it("uses the cropped width/height for cropped mode", () => {
    expect(bookmarkImageAspectStyle("cropped", 16, 9, [])).toEqual({
      aspectRatio: "16 / 9",
    });
  });

  it("resolves a custom ratio by id", () => {
    expect(bookmarkImageAspectStyle("wide", 4, 3, customRatios)).toEqual({
      aspectRatio: "3 / 1",
    });
  });

  it("falls back to no ratio for an unknown custom id", () => {
    expect(bookmarkImageAspectStyle("missing", 4, 3, customRatios)).toEqual({});
  });
});
