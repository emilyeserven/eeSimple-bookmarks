// @vitest-environment node
import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";

import { describe, expect, it } from "vitest";

describe("propertyAppliesToCategory", () => {
  it("matches a category listed in categoryIds", () => {
    expect(propertyAppliesToCategory({
      allCategories: false,
      categoryIds: ["a", "b"],
    }, "a")).toBe(true);
  });

  it("does not match a category absent from categoryIds", () => {
    expect(propertyAppliesToCategory({
      allCategories: false,
      categoryIds: ["a"],
    }, "z")).toBe(false);
  });

  it("matches any category when allCategories is set, even one not in categoryIds", () => {
    expect(propertyAppliesToCategory({
      allCategories: true,
      categoryIds: [],
    }, "new-category")).toBe(true);
  });
});

describe("propertyAppliesToMediaType", () => {
  it("matches a media type listed in mediaTypeIds", () => {
    expect(propertyAppliesToMediaType({
      allMediaTypes: false,
      mediaTypeIds: ["a", "b"],
    }, "a")).toBe(true);
  });

  it("does not match a media type absent from mediaTypeIds", () => {
    expect(propertyAppliesToMediaType({
      allMediaTypes: false,
      mediaTypeIds: ["a"],
    }, "z")).toBe(false);
  });

  it("never matches when the bookmark has no media type", () => {
    expect(propertyAppliesToMediaType({
      allMediaTypes: true,
      mediaTypeIds: [],
    }, null)).toBe(false);
  });

  it("matches any media type when allMediaTypes is set", () => {
    expect(propertyAppliesToMediaType({
      allMediaTypes: true,
      mediaTypeIds: [],
    }, "new-media-type")).toBe(true);
  });
});
