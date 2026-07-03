// @vitest-environment node
import type { Bookmark, CustomAspectRatio, ImageDisplayPreference } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { makeBookmarkImage } from "../test-utils/factories";

import { bookmarkImageAspectStyle, bookmarkImageClass, resolveBookmarkDisplayImage } from "./bookmarkImage";

describe("bookmarkImageClass", () => {
  it("uses fixed-width left layout, omitting object-cover for natural mode", () => {
    expect(bookmarkImageClass(true, "natural")).toContain("w-32");
    expect(bookmarkImageClass(true, "natural")).not.toContain("object-cover");
  });

  it("crops to fill (object-cover) for a non-natural left layout", () => {
    expect(bookmarkImageClass(true, "cropped")).toContain("object-cover");
    expect(bookmarkImageClass(true, "cropped")).not.toContain("object-contain");
  });

  it("uses full-width top layout when imageLeft is false", () => {
    expect(bookmarkImageClass(false, "natural")).toContain("w-full");
    expect(bookmarkImageClass(false, "cropped")).toContain("object-cover");
    expect(bookmarkImageClass(false, "cropped")).not.toContain("object-contain");
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

describe("resolveBookmarkDisplayImage", () => {
  const image = makeBookmarkImage();
  const screenshot = makeBookmarkImage({
    id: "shot",
    url: "https://example.com/shot.webp",
    source: "screenshot",
  });

  function bookmarkWith(
    preference: ImageDisplayPreference,
    overrides: Partial<Pick<Bookmark, "image" | "screenshot">> = {},
  ): Pick<Bookmark, "image" | "screenshot" | "imageDisplayPreference"> {
    return {
      image: null,
      screenshot: null,
      imageDisplayPreference: preference,
      ...overrides,
    };
  }

  it("auto prefers image over screenshot when both exist", () => {
    expect(resolveBookmarkDisplayImage(bookmarkWith("auto", {
      image,
      screenshot,
    }))).toBe(image);
  });

  it("auto falls back to screenshot when there is no image", () => {
    expect(resolveBookmarkDisplayImage(bookmarkWith("auto", {
      screenshot,
    }))).toBe(screenshot);
  });

  it("auto returns null when neither exists", () => {
    expect(resolveBookmarkDisplayImage(bookmarkWith("auto"))).toBeNull();
  });

  it("\"image\" preference falls back to screenshot when there is no image", () => {
    expect(resolveBookmarkDisplayImage(bookmarkWith("image", {
      screenshot,
    }))).toBe(screenshot);
  });

  it("\"screenshot\" preference falls back to image when there is no screenshot", () => {
    expect(resolveBookmarkDisplayImage(bookmarkWith("screenshot", {
      image,
    }))).toBe(image);
  });

  it("\"screenshot\" preference wins over image when both exist", () => {
    expect(resolveBookmarkDisplayImage(bookmarkWith("screenshot", {
      image,
      screenshot,
    }))).toBe(screenshot);
  });
});
